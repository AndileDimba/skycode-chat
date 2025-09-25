import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { AppUser, Message, Thread } from '../../core/models';
import { groupMessagesByDay, formatTimeHHmm } from '../../core/chat-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContactListComponent } from './contact-list.component';
import { MessageListComponent } from './message-list.component';
import { SideNavComponent } from './side-nav.component';
import { TopBarComponent } from './top-bar.component';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-chat-page',
  imports: [
    CommonModule,
    FormsModule,
    ContactListComponent,
    MessageListComponent,
    SideNavComponent,
    TopBarComponent,
  ],
  templateUrl: './chat-page.component.html',
  styleUrls: [],
})
export class ChatPageComponent implements AfterViewChecked {
  @ViewChild(MessageListComponent) messageList?: MessageListComponent;

  private auth = inject(AuthService);
  private chat = inject(ChatService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  me = signal<AppUser | null>(null);
  users = signal<AppUser[]>([]);
  other = signal<AppUser | null>(null);
  messages = signal<Message[]>([]);
  threads = signal<Thread[]>([]);
  errorMsg = signal<string | null>(null);

  search = '';
  newMessage = '';
  showEmojiPicker = false;

  constructor() {
    effect(
      () => {
        this.auth.user$
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((u) => {
            this.me.set(u);
            if (u) {
              this.loadUsers(u.uid);
              this.loadThreads(u.uid);
            } else {
              this.users.set([]);
              this.threads.set([]);
              this.router.navigateByUrl('/login');
            }
          });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const me = this.me();
        const o = this.other();
        if (me && o) {
          this.loadMessages(me, o);
        } else {
          this.messages.set([]);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadUsers(myUid: string) {
    this.chat
      .users$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
        this.users.set(list.filter((u) => u.uid !== myUid));
      });
  }

  loadThreads(myUid: string) {
    this.chat
      .threadMeta$(myUid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ts) => this.threads.set(ts));
  }

  async loadMessages(me: AppUser, other: AppUser) {
    this.chat
      .messages$(me, other)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          console.log('[chat] messages loaded', {
            count: list.length,
            me: me.uid,
            other: other.uid,
          });
          this.errorMsg.set(null);
          this.messages.set(list);
          setTimeout(() => this.scrollToBottom(), 100);
          this.chat.markThreadAsRead(me.uid, other.uid);
        },
        error: (err) => {
          console.error('[chat] messages load failed', err);
          this.errorMsg.set(
            'Unable to load messages. Please check your connection or permissions.'
          );
          this.messages.set([]);
        },
      });
  }

  async selectContact(contact: AppUser) {
  const me = this.me();
  
  this.assertUid(me?.uid);
  this.assertUid(contact?.uid);

  if (!me) return;
  
  this.errorMsg.set(null);
  
  try {
    await this.chat.ensureThread(me.uid, contact.uid);
  } catch (e: any) {
    console.error('❌ selectContact - ensureThread failed', e?.code, e?.message, e);
    this.errorMsg.set('Could not create conversation. Check rules/permissions.');
    return;
  }

  this.other.set(contact);
  this.newMessage = '';

  try {
    await this.chat.markThreadAsRead(me.uid, contact.uid);
  } catch (e) {
    console.error('markThreadAsRead failed (non-blocking)', e);
  }
}

  filteredUsers = computed(() => {
    const term = this.search.toLowerCase().trim();
    const list = this.users();
    if (!term) return list;
    return list.filter(
      (u) =>
        (u.displayName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
    );
  });

  messageGroups = computed(() => groupMessagesByDay(this.messages()));

  private threadIdFor(a: string, b: string) {
    return [a, b].sort().join('_');
  }

  lastMessagePreview(contact: AppUser): string | null {
    const me = this.me();
    if (!me) return null;
    const threadId = this.threadIdFor(me.uid, contact.uid);
    const thread = this.threads().find((t) => t.id === threadId);
    return thread?.lastMessageText || null;
  }

  lastMessageTime(contact: AppUser): string | null {
    const me = this.me();
    if (!me) return null;
    const threadId = this.threadIdFor(me.uid, contact.uid);
    const thread = this.threads().find((t) => t.id === threadId);
    if (!thread?.lastMessageAt) return null;

    const msgDate = new Date(thread.lastMessageAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      format(a, 'yyyy-MM-dd') === format(b, 'yyyy-MM-dd');

    if (sameDay(msgDate, today)) return format(msgDate, 'HH:mm');
    if (sameDay(msgDate, yesterday)) return 'Yesterday';
    if (msgDate.getFullYear() === today.getFullYear())
      return format(msgDate, 'MMM d');
    return format(msgDate, 'MMM d, yyyy');
  }

  unreadCount(contact: AppUser): number {
    const me = this.me();
    if (!me) return 0;
    const threadId = this.threadIdFor(me.uid, contact.uid);
    const messages = this.messages().filter(
      (m) =>
        m.threadId === threadId &&
        m.senderId !== me.uid &&
        (!m.readBy || !m.readBy.includes(me.uid))
    );
    return messages.length;
  }

  isOwnMessage(message: Message): boolean {
    const me = this.me();
    return me ? message.senderId === me.uid : false;
  }

  formatMessageTime(timestamp: number): string {
    return formatTimeHHmm(timestamp);
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  onSearch() {
  }

  private assertUid(u?: string) {
    if (!u) throw new Error('Missing UID');
  }

  openNewChat() {
    const list = this.users();
    const me = this.me();
    if (!me || list.length === 0) return;
    // Pick the first available user not currently selected as a simple demo
    const candidate = list.find(
      (u) => !this.other() || u.uid !== this.other()!.uid
    );
    if (candidate) {
      this.selectContact(candidate);
    }
  }

  async sendMessage(event?: KeyboardEvent) {
    if (event) {
      event.preventDefault();
    }

    const text = this.newMessage?.trim();
    if (!text) return;

    const me = this.me();
    const otherUser = this.other();
    if (!me || !otherUser) return;

    await this.chat.sendMessage(me, otherUser, text);
    this.newMessage = '';
    this.showEmojiPicker = false;
  }

  autoResize(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 100) + 'px';
  }

  scrollToBottom() {
    this.messageList?.scrollToBottom();
  }

  async signOut() {
    await this.auth.signOut();
  }
}
