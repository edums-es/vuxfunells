import { nanoid } from 'nanoid';

const KEY = 'visitor_id';

export function getVisitorId(): string {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const created = nanoid(16);
  localStorage.setItem(KEY, created);
  return created;
}

