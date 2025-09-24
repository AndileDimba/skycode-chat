import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { format, formatDistanceToNow } from 'date-fns';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { Firestore, collection, query, orderBy } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { AppUser, Message, Thread } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-chat-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app" *ngIf="me(); else loading">
      <aside class="left">
        <header class="sidebar-header">
          <div class="me">
            <div class="avatar">{{ initials(me()?.displayName) }}</div>
            <div class="me-meta">
              <div class="me-name">{{ me()?.displayName }}</div>
              <a class="signout" (click)="signOut()">Sign out</a>
            </div>
          </div>
          <input [(ngModel)]="search" class="search" placeholder="Search people..." />
        </header>

        <div class="contacts" *ngIf="filteredUsers().length; else noContacts">
          <div
            class="contact"
            *ngFor="let u of filteredUsers()"
            [class.active]="other() && u.uid === other()!.uid"
            (click)="select(u)"
          >
            <div class="avatar">{{ initials(u.displayName) }}</div>
            <div class="meta">
              <div class="row">
                <div class="name">{{ u.displayName }}</div>
                <div class="time" *ngIf="lastMessageAt(u) as t">{{ t }}</div>
              </div>
              <div class="last">{{ lastMessageText(u) || 'Say hello…' }}</div>
            </div>
          </div>
        </div>

        <ng-template #noContacts>
          <div class="empty-state">
            No contacts yet.
            <div class="hint">Create a second account (Sign Up) and log into both in different browsers.</div>
          </div>
        </ng-template>
      </aside>

      <main class="right" *ngIf="other(); else pickSomeone">
        <header class="chat-header">
          <div class="avatar big">{{ initials(other()?.displayName) }}</div>
          <div class="peer-meta">
            <div class="name">{{ other()?.displayName }}</div>
            <div class="status">{{ statusText(other()) }}</div>
          </div>
        </header>

        <section class="messages" #scrollArea>
          <ng-container *ngFor="let group of grouped()">
            <div class="date-chip">{{ group.dateLabel }}</div>
            <div
              class="bubble"
              *ngFor="let m of group.items"
              [class.mine]="m.senderId === me()!.uid"
            >
              <div class="text">{{ m.text }}</div>
              <div class="stamp">{{ time(m.createdAt) }}</div>
            </div>
          </ng-container>
        </section>

        <footer class="composer">
          <input
            [(ngModel)]="draft"
            (keydown.enter)="enterToSend($event)"
            placeholder="Type your message…"
          />
          <button (click)="send()">Send</button>
        </footer>
      </main>
    </div>

    <ng-template #loading><div class="loading">Loading…</div></ng-template>
    <ng-template #pickSomeone><div class="empty-chat">Pick a contact to start chatting</div></ng-template>
  `,
  styles: [`
    .app { height: 100vh; display: grid; grid-template-columns: 320px 1fr; background: #f3f4f6; }
    .left { background: #fff; border-right: 1px solid #e5e7eb; display: grid; grid-template-rows: auto 1fr; }
    .sidebar-header { padding: 14px; border-bottom: 1px solid #eef; display: grid; gap: 12px; }
    .me { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #2563eb; color: #fff; display: grid; place-items: center; font-weight: 600; }
    .avatar.big { width: 44px; height: 44px; }
    .me-name { font-weight: 600; }
    .signout { color: #ef4444; font-size: 12px; cursor: pointer; }
    .search { width: 100%; padding: 9px 11px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; }
    .contacts { overflow: auto; }
    .contact { display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
    .contact:hover { background: #f8fafc; }
    .contact.active { background: #eef2ff; }
    .meta .row { display: flex; justify-content: space-between; align-items: baseline; }
    .name { font-weight: 600; }
    .time { font-size: 12px; color: #6b7280; }
    .last { font-size: 13px; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .empty-state { padding: 16px; color: #6b7280; }
    .empty-state .hint { margin-top: 8px; font-size: 12px; color: #94a3b8; }

    .right { display: grid; grid-template-rows: auto 1fr auto; }
    .chat-header { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 12px 16px; display: flex; gap: 12px; align-items: center; }
    .peer-meta .name { font-weight: 700; }
    .peer-meta .status { font-size: 12px; color: #6b7280; }

    .messages { overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; background: #f3f4f6; }
    .date-chip { align-self: center; background: #e5e7eb7a; color: #475569; font-size: 12px; padding: 4px 10px; border-radius: 999px; margin: 6px 0; }
    .bubble { position: relative; max-width: 66%; align-self: flex-start; background: #e5e7eb; color: #111827; padding: 10px 12px; border-radius: 14px; }
    .bubble.mine { align-self: flex-end; background: #2563eb; color: #fff; }
    .bubble::after { content: ''; position: absolute; left: -6px; bottom: 8px; width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 6px solid #e5e7eb; }
    .bubble.mine::after { left: auto; right: -6px; border-right: 0; border-left: 6px solid #2563eb; }
    .text { white-space: pre-wrap; }
    .stamp { font-size: 11px; opacity: 0.8; margin-top: 4px; text-align: right; }
    .composer { background: #fff; border-top: 1px solid #e5e7eb; padding: 10px; display: grid; grid-template-columns: 1fr auto; gap: 8px; }
    .composer input { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; outline: none; }
    .composer button { padding: 10px 14px; background: #2563eb; color: #fff; border: none; border-radius: 12px; cursor: pointer; }
    .loading, .empty-chat { height: 100vh; display: grid; place-items: center; color: #6b7280; }
  `]
})
export class ChatPageComponent {
  private auth = inject(AuthService);
  private chat = inject(ChatService);
  private db = inject(Firestore);

  me = signal<AppUser | null>(null);
  users = signal<AppUser[]>([]);
  other = signal<AppUser | null>(null);
  messages = signal<Message[]>([]);
  threads = signal<Thread[]>([]);
  search = '';
  draft = '';

  constructor() {
    // Current user + load contacts + threads meta
    effect(() => {
      this.auth.user$.subscribe(u => {
        this.me.set(u);
        if (u) {
          this.loadUsers(u.uid);
          this.chat.threadMeta$(u.uid).subscribe(ts => this.threads.set(ts));
        } else {
          this.users.set([]);
          this.threads.set([]);
        }
      });
    }, { allowSignalWrites: true });

    // Load messages when selecting a contact
    effect(() => {
      const me = this.me();
      const o = this.other();
      if (me && o) {
        this.chat.messages$(me, o).subscribe(list => this.messages.set(list));
      } else {
        this.messages.set([]);
      }
    }, { allowSignalWrites: true });
  }

  // Contacts
  loadUsers(myUid: string) {
    const uCol = collection(this.db, 'users');
    const q = query(uCol, orderBy('displayName'));
    collectionData(q, { idField: 'uid' }).subscribe(docs => {
      const list = (docs as any[]).map(d => d as AppUser).filter(u => u.uid !== myUid);
      this.users.set(list);
    });
  }

  async select(u: AppUser) {
  const me = this.me();
  if (!me) return;
  // Make sure the thread doc exists before we start listening
  await this.chat.ensureThread(me.uid, u.uid);
  this.other.set(u);
}

  filteredUsers = computed(() => {
    const term = this.search.toLowerCase().trim();
    const list = this.users();
    if (!term) return list;
    return list.filter(u => (u.displayName || '').toLowerCase().includes(term));
  });

  // Messages grouped by day
  grouped = computed(() => {
    const msgs = this.messages();
    const out: { dateLabel: string; items: Message[] }[] = [];
    let key = '';
    for (const m of msgs) {
      const d = new Date(m.createdAt);
      const k = [d.getFullYear(), d.getMonth(), d.getDate()].join('-');
      if (k !== key) {
        key = k;
        out.push({ dateLabel: format(d, 'do MMMM yyyy'), items: [] });
      }
      out[out.length - 1].items.push(m);
    }
    return out;
  });

  // Last message preview/time for contact list (using threads meta)
  private threadIdFor(a: string, b: string) { return [a, b].sort().join('_'); }

  lastMessageText(u: AppUser) {
    const me = this.me();
    if (!me) return null;
    const id = this.threadIdFor(me.uid, u.uid);
    const t = this.threads().find(x => x.id === id);
    return t?.lastMessageText || null;
  }

  lastMessageAt(u: AppUser) {
    const me = this.me();
    if (!me) return null;
    const id = this.threadIdFor(me.uid, u.uid);
    const t = this.threads().find(x => x.id === id);
    if (!t?.lastMessageAt) return null;
    const msAgo = Date.now() - t.lastMessageAt;
    // If same day show time, else relative
    const sameDay = new Date(t.lastMessageAt).toDateString() === new Date().toDateString();
    return sameDay ? format(t.lastMessageAt, 'HH:mm') : formatDistanceToNow(t.lastMessageAt, { addSuffix: true });
  }

  // Helpers
  time(ms: number) { return format(new Date(ms), 'HH:mm'); }
  statusText(u: AppUser | null) { return !u ? '' : (u.status === 'online' ? 'Online' : 'Offline'); }
  initials(name?: string) {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  enterToSend(evt: Event) {
  const e = evt as KeyboardEvent;
  if (e.key === 'Enter' && !e.shiftKey) {
    evt.preventDefault();
    this.send();
  }
}

  async send() {
    const text = this.draft.trim();
    const me = this.me();
    const o = this.other();
    if (!text || !me || !o) return;
    await this.chat.sendMessage(me, o, text);
    this.draft = '';
  }

  async signOut() { await this.auth.signOut(); }
}
