import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-top-bar',
  imports: [CommonModule],
  template: `
    <header class="w-full h-12 bg-gray-900 text-white flex items-center justify-between px-4">
      <div class="flex items-center space-x-3">
        <div class="font-semibold tracking-wide">SAFE<span class="text-orange-400">●</span>Miner</div>
      </div>
      <div class="flex items-center space-x-4">
        <button class="w-8 h-8 rounded hover:bg-gray-800" aria-label="Notifications">🔔</button>
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">{{ initials(displayName) }}</div>
          <span class="hidden sm:inline text-sm text-gray-300">Welcome {{ displayName }}</span>
        </div>
        <button class="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700" (click)="logout.emit()">Logout</button>
      </div>
    </header>
  `,
  styles: []
})
export class TopBarComponent {
  @Input() displayName: string = '';
  @Output() logout = new EventEmitter<void>();

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}


