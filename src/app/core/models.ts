export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status?: 'online' | 'offline';
  lastSeen?: number;
  createdAt?: number;
}

export interface Thread {
  id: string;
  participants: string[];
  createdAt: number;
  lastMessageText?: string;
  lastMessageAt?: number;
}

export interface Message {
  id?: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: number;
  readBy?: string[];
}
