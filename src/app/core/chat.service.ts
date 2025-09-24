import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, where } from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { AppUser, Thread, Message } from './models';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private db = inject(Firestore);

  private threadIdFor(a: string, b: string) {
    return [a, b].sort().join('_');
  }

  async ensureThread(a: string, b: string): Promise<string> {
    const id = this.threadIdFor(a, b);
    const tRef = doc(this.db, 'threads', id);
    const snap = await getDoc(tRef);
    if (!snap.exists()) {
      const t: Thread = {
        id,
        participants: [a, b],
        createdAt: Date.now()
      };
      await setDoc(tRef, t);
    }
    return id;
  }

  messages$(me: AppUser, other: AppUser): Observable<Message[]> {
    const id = this.threadIdFor(me.uid, other.uid);
    const mCol = collection(this.db, 'threads', id, 'messages');
    const q = query(mCol, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(list => list.map(doc => doc as Message))
    );
  }

  async sendMessage(me: AppUser, other: AppUser, text: string) {
    const threadId = await this.ensureThread(me.uid, other.uid);
    const mCol = collection(this.db, 'threads', threadId, 'messages');
    const msg: Omit<Message, 'id'> = {
      threadId,
      senderId: me.uid,
      text,
      createdAt: Date.now(),
      readBy: [me.uid]
    };
    await addDoc(mCol, msg);

    // Update thread metadata
    const tRef = doc(this.db, 'threads', threadId);
    await setDoc(tRef, {
      lastMessageText: text,
      lastMessageAt: msg.createdAt
    }, { merge: true });
  }

  threadMeta$(meUid: string): Observable<Thread[]> {
    const tCol = collection(this.db, 'threads');
    const qy = query(tCol, where('participants', 'array-contains', meUid));
    return collectionData(qy, { idField: 'id' }).pipe(
      map(list => (list as Thread[]).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)))
    );
  }
}
