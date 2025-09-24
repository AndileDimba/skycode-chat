import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-side-nav',
  imports: [CommonModule],
  template: `
    <aside class="h-full w-16 bg-gray-800 text-white flex flex-col items-center py-4 space-y-6">
      <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700" aria-label="Home">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7"/><path d="M9 22V12h6v10"/></svg>
      </button>
      <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700" aria-label="Help">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.82 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12" y2="17"/></svg>
      </button>
      <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700" aria-label="Settings">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0A1.65 1.65 0 0010.91 3H11a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0A1.65 1.65 0 0019.91 12H20a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </button>
    </aside>
  `,
  styles: []
})
export class SideNavComponent {}


