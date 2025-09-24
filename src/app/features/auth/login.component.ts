import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">{{ mode === 'login' ? 'Welcome back' : 'Create your account' }}</h2>
          <button class="text-sm text-blue-600 hover:underline" (click)="toggle()">
            {{ mode === 'login' ? 'Create account' : 'Sign in' }}
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Email</label>
            <input formControlName="email" type="email" placeholder="you@example.com" class="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div class="text-xs text-red-600 mt-1" *ngIf="form.controls.email.touched && form.controls.email.invalid">Enter a valid email</div>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Password</label>
            <div class="relative">
              <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" class="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" (click)="showPassword = !showPassword" aria-label="Toggle password visibility">👁</button>
            </div>
            <div class="text-xs text-red-600 mt-1" *ngIf="form.controls.password.touched && form.controls.password.invalid">Minimum 6 characters</div>
          </div>
          <div *ngIf="mode==='signup'">
            <label class="block text-xs text-gray-600 mb-1">Display name (optional)</label>
            <input formControlName="displayName" type="text" placeholder="Your name" class="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" [disabled]="form.invalid || loading" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
            <span *ngIf="!loading">{{ mode === 'login' ? 'Sign In' : 'Sign Up' }}</span>
            <span *ngIf="loading">Please wait...</span>
          </button>
        </form>

        <p class="text-xs text-gray-500 mt-4">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  mode: 'login' | 'signup' = 'login';
  loading = false;
  showPassword = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    displayName: ['']
  });

  toggle() { this.mode = this.mode === 'login' ? 'signup' : 'login'; }

  async submit() {
    const { email, password, displayName } = this.form.value;
    if (!email || !password) return;
    this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.signIn(email, password);
      } else {
        await this.auth.signUp(email, password, displayName || undefined);
      }
      this.router.navigateByUrl('/chat');
    } finally {
      this.loading = false;
    }
  }
}
