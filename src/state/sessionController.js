import { sessionStore } from './sessionStore.js';
export function setSessionIdentity(uid, role, day) {
  const identity = uid ? `${uid}:${role || ''}:${day}` : null;
  if (identity !== sessionStore.identity) sessionStore.clear(identity);
  return identity;
}
