import { Message } from './models';
import { format, startOfWeek, isSameWeek, isSameMonth } from 'date-fns';

export interface MessageGroup {
  dateLabel?: string;
  messages: Message[];
}

export function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  if (fmt(date) === fmt(today)) return 'Today';
  if (fmt(date) === fmt(yesterday)) return 'Yesterday';
  return format(date, 'do MMMM yyyy');
}

export function groupMessagesByDay(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentKey = '';
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  for (const message of messages) {
    const msgDate = new Date(message.createdAt);
    const key = format(msgDate, 'yyyy-MM-dd');
    if (key !== currentKey) {
      currentKey = key;
      let dateLabel = getDateLabel(msgDate);
      if (!isSameWeek(msgDate, today, { weekStartsOn: 1 })) {
        if (isSameMonth(msgDate, today)) {
          dateLabel = 'Earlier this month';
        } else {
          dateLabel = format(msgDate, 'do MMMM yyyy');
        }
      } else if (msgDate < thisWeekStart) {
        dateLabel = 'Last week';
      }
      groups.push({ dateLabel, messages: [] });
    }
    groups[groups.length - 1].messages.push(message);
  }
  return groups;
}

export function formatTimeHHmm(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm');
}

export function formatSmartTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => format(a, 'yyyy-MM-dd') === format(b, 'yyyy-MM-dd');

  if (sameDay(d, today)) {
    return format(d, 'HH:mm');
  }
  if (sameDay(d, yesterday)) {
    return 'Yesterday ' + format(d, 'HH:mm');
  }
  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return format(d, 'EEE HH:mm');
  }
  if (d.getFullYear() === today.getFullYear()) {
    return format(d, 'MMM d, HH:mm');
  }
  return format(d, 'MMM d, yyyy HH:mm');
}


