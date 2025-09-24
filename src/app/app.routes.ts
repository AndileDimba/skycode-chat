import { Routes, CanActivateFn, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return user(auth).pipe(
    take(1),
    map(u => !!u),
    tap(ok => { if (!ok) router.navigateByUrl('/login'); })
  );
};

// Prevent route flashes on initial load using canMatch
export const matchAuthed: CanMatchFn = () => {
  const auth = inject(Auth);
  return user(auth).pipe(take(1), map(u => !!u));
};

export const matchGuest: CanMatchFn = () => {
  const auth = inject(Auth);
  return user(auth).pipe(take(1), map(u => !u));
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent), canMatch: [matchGuest] },
  { path: 'chat', loadComponent: () => import('./features/chat/chat-page.component').then(m => m.ChatPageComponent), canMatch: [matchAuthed] },
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: '**', redirectTo: 'chat' }
];
