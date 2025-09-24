import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppUser } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-contact-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-96 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 avatar-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {{ initials(currentUserName) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-gray-900 text-sm truncate">{{ currentUserName }}</div>
              <div class="text-xs text-green-500">Online</div>
            </div>
          </div>
          <button class="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors" (click)="signOut.emit()" aria-label="Sign out">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold text-gray-700">Messages</div>
          <button class="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100" aria-label="New conversation" (click)="newChat.emit()">+</button>
        </div>
        <div class="relative">
          <input [(ngModel)]="search" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent text-sm bg-white" placeholder="Search contacts..." />
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-hidden" *ngIf="filteredContacts.length; else noContacts">
        <div *ngFor="let contact of filteredContacts" class="contact-item flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors" [class.bg-blue-50]="selectedUid === contact.uid" (click)="select(contact)">
          <div class="contact-avatar w-12 h-12 avatar-gradient rounded-full flex items-center justify-center text-sm font-semibold text-white mr-3 flex-shrink-0">
            {{ initials(contact.displayName) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <div class="contact-name font-semibold text-sm text-gray-900 truncate">{{ contact.displayName }}</div>
              <div class="last-message-time text-xs text-gray-500 flex-shrink-0 ml-2" *ngIf="lastMessageTime && lastMessageTime(contact) as time">{{ time }}</div>
            </div>
            <div class="last-message-preview text-sm text-gray-600 truncate" *ngIf="lastMessagePreview && lastMessagePreview(contact) as preview">{{ preview }}</div>
          </div>
          <div class="unread-count bg-whatsapp-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0" *ngIf="unreadCount && unreadCount(contact) > 0">{{ unreadCount(contact) }}</div>
        </div>
      </div>

      <ng-template #noContacts>
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <div class="text-4xl mb-4">👥</div>
          <div class="text-lg font-medium mb-2">No contacts yet</div>
          <div class="text-sm opacity-70">Create another account to start chatting</div>
        </div>
      </ng-template>
    </div>
  `,
  styles: []
})
export class ContactListComponent {
  @Input() contacts: AppUser[] = [];
  @Input() selectedUid: string | null = null;
  @Input() lastMessagePreview?: (u: AppUser) => string | null;
  @Input() lastMessageTime?: (u: AppUser) => string | null;
  @Input() unreadCount?: (u: AppUser) => number;
  @Input() currentUserName: string = '';
  @Output() signOut = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() contactSelected = new EventEmitter<AppUser>();

  search = '';

  get filteredContacts(): AppUser[] {
    const term = this.search.toLowerCase().trim();
    if (!term) return this.contacts;
    return this.contacts.filter(
      u => (u.displayName || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    );
  }

  select(user: AppUser) {
    this.contactSelected.emit(user);
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}


