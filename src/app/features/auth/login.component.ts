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
    <div class="auth-wrap">
      <div class="card">
        <h2>{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</h2>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email</label>
          <input formControlName="email" type="email" placeholder="you@example.com" />
          <label>Password</label>
          <input formControlName="password" type="password" placeholder="••••••••" />
          <div *ngIf="mode==='signup'">
            <label>Display name (optional)</label>
            <input formControlName="displayName" type="text" placeholder="Your name" />
          </div>

          <button type="submit">{{ mode === 'login' ? 'Sign In' : 'Sign Up' }}</button>
        </form>

        <p class="switch">
          <span *ngIf="mode==='login'">No account?</span>
          <span *ngIf="mode==='signup'">Have an account?</span>
          <a (click)="toggle()">{{ mode === 'login' ? 'Create one' : 'Sign in' }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height: 100vh; display: grid; place-items: center; background: #f5f6fa; }
    .card { width: 360px; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    h2 { margin: 0 0 16px; }
    form { display: grid; gap: 10px; }
    label { font-size: 12px; color: #555; }
    input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; outline: none; }
    button { margin-top: 8px; padding: 10px 14px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .switch { margin-top: 12px; font-size: 14px; color: #444; }
    .switch a { color: #2563eb; cursor: pointer; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  mode: 'login' | 'signup' = 'login';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    displayName: ['']
  });

  toggle() { this.mode = this.mode === 'login' ? 'signup' : 'login'; }

  async submit() {
    const { email, password, displayName } = this.form.value;
    if (!email || !password) return;
    if (this.mode === 'login') {
      await this.auth.signIn(email, password);
    } else {
      await this.auth.signUp(email, password, displayName || undefined);
    }
    this.router.navigateByUrl('/chat');
  }
}
