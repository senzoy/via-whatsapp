import type { WAMessage } from "baileys"

export interface CommandContext {
  msg: WAMessage
  jid: string
  sender: string
  text: string
  args: string[]
  mentions: string[]
  admin: boolean
}

export enum SystemPoints {
  IMAGE = 5,
  REACTION = 1,
  AUDIO = 1.5,
  VIDEO = 10,
  STICKER = 2
}


// ─── Casino Schedule ──────────────────────────────────────────────────────────

const CASINO_HOURS = [
  { open: { h: 15, m: 20 }, close: { h: 15, m: 25 } },  // 3:00 pm – 3:10 pm
  { open: { h: 21, m: 20 }, close: { h: 21, m: 30 } },  // 9:00 pm – 9:10 pm
];

export function isCasinoOpen(): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return CASINO_HOURS.some(({ open, close }) => {
    const openMinutes = open.h * 60 + open.m;
    const closeMinutes = close.h * 60 + close.m;
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  });
}

export function getNextOpenTime(): string {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const { open } of CASINO_HOURS) {
    const openMinutes = open.h * 60 + open.m;
    if (currentMinutes < openMinutes) {
      return `${String(open.h).padStart(2, '0')}:${String(open.m).padStart(2, '0')}`;
    }
  }

  // Ya pasaron ambos horarios — devuelve el primero del día siguiente
  const first = CASINO_HOURS[0].open;
  return `${String(first.h).padStart(2, '0')}:${String(first.m).padStart(2, '0')}`;
}