import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, user as afUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { docData } from '@angular/fire/firestore';
import { AppUser } from './models';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  user$ = afUser(this.auth).pipe(
    switchMap(u => {
      if (!u) return of(null);
      const ref = doc(this.db, 'users', u.uid);
      return docData(ref).pipe(
        map(data => {
          if (!data) return null;
          return { uid: u.uid, ...(data as any) } as AppUser;
        })
      );
    })
  );

  async signUp(email: string, password: string, displayName?: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const name = displayName || email.split('@')[0];
    await updateProfile(cred.user, { displayName: name });
    const ref = doc(this.db, 'users', cred.user.uid);
    await setDoc(ref, {
      displayName: name,
      email,
      status: 'online',
      lastSeen: Date.now(),
      createdAt: Date.now(),
      photoURL: ''
    }, { merge: true });
    return cred.user;
  }

  async signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const ref = doc(this.db, 'users', cred.user.uid);
    await setDoc(ref, {
      displayName: cred.user.displayName || email.split('@')[0],
      email,
      status: 'online',
      lastSeen: Date.now(),
    }, { merge: true });
    return cred.user;
  }

  async signOut() {
    const u = this.auth.currentUser;
    if (u) {
      const ref = doc(this.db, 'users', u.uid);
      await setDoc(ref, { status: 'offline', lastSeen: Date.now() }, { merge: true });
    }
    await signOut(this.auth);
  }
}
