import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, where } from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { AppUser, Thread, Message } from './models';
import { map } from 'rxjs/operators';
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

  users$(): Observable<AppUser[]> {
    const uCol = collection(this.db, 'users');
    const qy = query(uCol, orderBy('displayName'));
    return collectionData(qy, { idField: 'uid' }).pipe(
      map(list => list as AppUser[])
    );
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

  async markThreadAsRead(meUid: string, otherUid: string) {
    const threadId = this.threadIdFor(meUid, otherUid);
    const mCol = collection(this.db, 'threads', threadId, 'messages');
    const qy = query(mCol, orderBy('createdAt', 'asc'));
    const messages = (await collectionData(qy, { idField: 'id' }).toPromise()) as any[] | undefined;
    if (!messages || messages.length === 0) return;
    await Promise.all(
      messages
        .filter((m: any) => !(m.readBy || []).includes(meUid) && m.senderId !== meUid)
        .map(async (m: any) => {
          const ref = doc(this.db, 'threads', threadId, 'messages', m.id);
          const readBy = Array.from(new Set([...(m.readBy || []), meUid]));
          await setDoc(ref, { readBy }, { merge: true });
        })
    );
  }
}
