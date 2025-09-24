import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../core/models';
import { MessageGroup, formatSmartTimestamp } from '../../core/chat-utils';

@Component({
  standalone: true,
  selector: 'app-message-list',
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto p-5 pb-24 custom-scrollbar" #messagesContainer>
      <div class="messages-content mx-auto w-full flex flex-col gap-3">
        <ng-container *ngFor="let messageGroup of messageGroups">
          <div class="flex justify-center my-6" *ngIf="messageGroup.dateLabel">
            <div class="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-medium text-whatsapp-muted">{{ messageGroup.dateLabel }}</div>
          </div>
          <ng-container *ngFor="let message of messageGroup.messages">
            <div class="message-wrapper flex w-full mb-1" [class.justify-end]="isOwn(message)" [class.justify-start]="!isOwn(message)">
              <div class="message-bubble flex-col" [class.bg-whatsapp-light-green]="isOwn(message)" [class.bg-white]="!isOwn(message)" [class.rounded-br-sm]="isOwn(message)" [class.rounded-bl-sm]="!isOwn(message)" [class.ml-auto]="isOwn(message)" [class.mr-auto]="!isOwn(message)" [class.mr-0]="isOwn(message)" [class.ml-0]="!isOwn(message)">
                <div class="w-full min-w-sm max-w-sm">
                  {{ message.text }}
                  <span class="min-w-full message-time text-whatsapp-muted">
                    {{ formatTime(message.createdAt) }}
                    <ng-container *ngIf="isOwn(message)">
                      <span class="ml-1" [class.tick-read]="(message.readBy?.length || 0) > 1" [title]="(message.readBy?.length || 0) > 1 ? 'Read' : 'Sent'">
                        {{ (message.readBy?.length || 0) > 1 ? '✓✓' : '✓' }}
                      </span>
                    </ng-container>
                  </span>
                </div>
                <div class="text-xs text-gray-400 mt-1" *ngIf="isOwn(message)">
                  <ng-container *ngIf="(message.readBy?.length || 0) > 1; else deliveredOnly">
                    Read, {{ formatTime(message.createdAt) }}
                  </ng-container>
                  <ng-template #deliveredOnly>
                    Delivered, {{ formatTime(message.createdAt) }}
                  </ng-template>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>

        <div class="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10" *ngIf="totalMessages === 0">
          <div class="text-5xl mb-4">💬</div>
          <div class="text-lg font-medium mb-2">No messages yet</div>
          <div class="text-sm opacity-70">Start a conversation!</div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MessageListComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @Input() messageGroups: MessageGroup[] = [];
  @Input() isOwn!: (m: Message) => boolean;
  @Input() formatTime: (ts: number) => string = formatSmartTimestamp;

  get totalMessages(): number {
    return this.messageGroups.reduce((sum, g) => sum + g.messages.length, 0);
  }

  scrollToBottom() {
    if (!this.messagesContainer) return;
    const el = this.messagesContainer.nativeElement as HTMLElement;
    el.scrollTop = el.scrollHeight;
  }
}


