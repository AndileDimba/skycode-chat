import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
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
  template: ["./chat-page.component.html"], // Use external HTML file
  styles: [], // Remove all the old CSS since Tailwind handles everything
})
export class ChatPageComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private auth = inject(AuthService);
  private chat = inject(ChatService);
  private db = inject(Firestore);

  me = signal<AppUser | null>(null);
  users = signal<AppUser[]>([]);
  other = signal<AppUser | null>(null);
  messages = signal<Message[]>([]);
  threads = signal<Thread[]>([]);
  search = '';
  newMessage = '';
  showEmojiPicker = false;

  constructor() {
    effect(
      () => {
        this.auth.user$.subscribe((u) => {
          this.me.set(u);
          if (u) {
            this.loadUsers(u.uid);
            this.loadThreads(u.uid);
          } else {
            this.users.set([]);
            this.threads.set([]);
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
    const uCol = collection(this.db, 'users');
    const q = query(uCol, orderBy('displayName'));
    collectionData(q, { idField: 'uid' }).subscribe((docs) => {
      const list = (docs as any[])
        .map((d) => d as AppUser)
        .filter((u) => u.uid !== myUid);
      this.users.set(list);
    });
  }

  loadThreads(myUid: string) {
    this.chat.threadMeta$(myUid).subscribe((ts) => this.threads.set(ts));
  }

  async loadMessages(me: AppUser, other: AppUser) {
    this.chat.messages$(me, other).subscribe((list) => {
      this.messages.set(list);
      // Scroll to bottom after messages load
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  async selectContact(contact: AppUser) {
    const me = this.me();
    if (!me) return;
    await this.chat.ensureThread(me.uid, contact.uid);
    this.other.set(contact);
    this.newMessage = '';
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

  messageGroups = computed(() => {
    const msgs = this.messages();
    const groups: { dateLabel?: string; messages: Message[] }[] = [];
    let currentDate = '';

    for (const msg of msgs) {
      const msgDate = new Date(msg.createdAt);
      const dateKey = format(msgDate, 'yyyy-MM-dd');

      if (dateKey !== currentDate) {
        currentDate = dateKey;
        const dateLabel = this.formatDateLabel(msgDate);
        groups.push({ dateLabel, messages: [] });
      }

      groups[groups.length - 1].messages.push(msg);
    }

    return groups;
  });

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

    const now = new Date();
    const msgDate = new Date(thread.lastMessageAt);
    const diffInHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(msgDate, 'HH:mm');
    } else {
      return format(msgDate, 'MMM dd');
    }
  }

  unreadCount(contact: AppUser): number {
    // Simple implementation - count unread messages
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return format(date, 'HH:mm');
  }

  formatDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'do MMMM yyyy');
    }
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
    // Debounced search if needed
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
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  async signOut() {
    await this.auth.signOut();
  }
}
