import { isCasinoOpen, getNextOpenTime } from "../../libs/types.js";
import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import {
  getMember,
  AddBalance,
  GetCooldown,
  UpdateCooldown,
  AddCasinoResult
} from "../../db/mongodb.js";



// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const MIN_BET = 1_000;
const MAX_BET = 20_000_000;

const COOLDOWN_WIN = 15_000;
const COOLDOWN_LOSE = 10_000;

// RTP REAL DEL CASINO
const TARGET_RTP = 0.88;

// Protección del casino
const HOUSE_RESERVE = 5_000_000;

// Jackpot
const JACKPOT_RATE = 0.01;
const JACKPOT_RESET = 50_000;

let jackpot = 10_000_000;

// ─────────────────────────────────────────────────────────────
// ESTADÍSTICAS GLOBALES
// ─────────────────────────────────────────────────────────────

let globalIn = 0;
let globalOut = 0;

function getGlobalRTP() {
  if (globalIn <= 0) return 0;
  return globalOut / globalIn;
}

// ─────────────────────────────────────────────────────────────
// SÍMBOLOS
// ─────────────────────────────────────────────────────────────

const BASE_SYMBOLS = [
  { icon: "🍒", weight: 40, multiplier: 2 },
  { icon: "🍋", weight: 30, multiplier: 4 },
  { icon: "🍉", weight: 15, multiplier: 8 },
  { icon: "⭐", weight: 10, multiplier: 20 },
  { icon: "💎", weight: 5, multiplier: 50 },
];

type Sym = typeof BASE_SYMBOLS[number];

// ─────────────────────────────────────────────────────────────
// AJUSTE DINÁMICO DE PESOS
// ─────────────────────────────────────────────────────────────

function getAdjustedSymbols(): Sym[] {

  const rtp = getGlobalRTP();

  return BASE_SYMBOLS.map(symbol => {

    let weight = symbol.weight;

    // Si el casino está pagando demasiado
    if (rtp > TARGET_RTP) {

      if (symbol.multiplier >= 20) {
        weight *= 0.60;
      }
      else if (symbol.multiplier >= 8) {
        weight *= 0.80;
      }
    }

    // Si el casino está ganando demasiado
    else if (rtp < TARGET_RTP - 0.10) {

      if (symbol.multiplier >= 20) {
        weight *= 1.20;
      }
      else if (symbol.multiplier >= 8) {
        weight *= 1.10;
      }
    }

    // Protección extra si jackpot crece demasiado
    if (jackpot > 5_000_000 && symbol.icon === "💎") {
      weight *= 0.50;
    }

    return {
      ...symbol,
      weight: Math.max(1, Math.floor(weight))
    };
  });
}

// ─────────────────────────────────────────────────────────────
// RANDOM CRIPTOGRÁFICO
// ─────────────────────────────────────────────────────────────

function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x1_0000_0000;
}

function secureRandInt(limit: number): number {

  const buf = new Uint32Array(1);
  const ceil = 0x1_0000_0000 - (0x1_0000_0000 % limit);

  do {
    crypto.getRandomValues(buf);
  }
  while (buf[0] >= ceil);

  return buf[0] % limit;
}

// ─────────────────────────────────────────────────────────────
// PICK DINÁMICO
// ─────────────────────────────────────────────────────────────

function pickSymbol(): Sym {

  const symbols = getAdjustedSymbols();

  const totalWeight = symbols.reduce((s, x) => s + x.weight, 0);

  let r = secureRandInt(totalWeight);

  for (const s of symbols) {

    if (r < s.weight) {
      return s;
    }

    r -= s.weight;
  }

  return symbols[0];
}

// ─────────────────────────────────────────────────────────────
// RESULTADO
// ─────────────────────────────────────────────────────────────

interface SpinResult {
  roll: [Sym, Sym, Sym];
  win: boolean;
  payout: number;
  jackpotWin?: number;
  near: boolean;
  nearJackpot: boolean;
}

// ─────────────────────────────────────────────────────────────
// MOTOR SLOT
// ─────────────────────────────────────────────────────────────

function spinFull(amount: number): SpinResult {

  const a = pickSymbol();
  const b = pickSymbol();
  const c = pickSymbol();

  const roll: [Sym, Sym, Sym] = [a, b, c];

  const triple = a.icon === b.icon && b.icon === c.icon;

  // Near miss
  const icons = [a.icon, b.icon, c.icon];

  const near =
    icons[0] === icons[1] ||
    icons[1] === icons[2] ||
    icons[0] === icons[2];

  const nearJackpot =
    icons.filter(i => i === "💎").length === 2;

  // Ganó
  if (triple) {

    let payout = amount * a.multiplier;

    let jackpotWin = 0;

    // Jackpot
    if (a.icon === "💎") {

      jackpotWin = jackpot;
      jackpot = JACKPOT_RESET;

      payout += jackpotWin;
    }

    return {
      roll,
      win: true,
      payout,
      jackpotWin,
      near: false,
      nearJackpot: false
    };
  }

  // Perdió
  return {
    roll,
    win: false,
    payout: 0,
    near,
    nearJackpot
  };
}

// ─────────────────────────────────────────────────────────────
// COMANDO
// ─────────────────────────────────────────────────────────────

export async function Slot(ctx: CommandContext) {

  if (!isCasinoOpen()) {

    return Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      reply: true,
      delay: 2000,
      content: `🎰 El casino está cerrado. Vuelve a las ${getNextOpenTime()}`
    });
  }

  const userId = ctx.msg.key.participant as string;

  const send = (content: string) =>
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content,
      reply: true,
      delay: 1500
    });

  try {

    // ─────────────────────────────────
    // COOLDOWN
    // ─────────────────────────────────

    const cooldown = await GetCooldown(userId, "casino");

    if (cooldown && Date.now() < cooldown.getTime()) {

      const ms = cooldown.getTime() - Date.now();

      const txt =
        ms < 60_000
          ? `${Math.ceil(ms / 1000)}s`
          : `${Math.ceil(ms / 60_000)}m`;

      return send(`❌ Máquina ocupada. Espera ${txt}`);
    }

    // ─────────────────────────────────
    // VALIDACIÓN
    // ─────────────────────────────────

    const amount = Number(ctx.args[0]);

    if (!Number.isInteger(amount) || amount <= 0) {
      return send("❌ Ingresa una cantidad válida.");
    }

    if (amount < MIN_BET || amount > MAX_BET) {

      return send(
        `❌ Apuesta fuera de rango.\n` +
        `Mín $${MIN_BET.toLocaleString()} — ` +
        `Máx $${MAX_BET.toLocaleString()}`
      );
    }

    // ─────────────────────────────────
    // USUARIO
    // ─────────────────────────────────

    const user = await getMember(userId);

    const balance =
      (user?.bank?.balance as number) ?? 0;

    if (!user || balance < amount) {

      return send(
        `💸 Saldo insuficiente.\n` +
        `Tienes $${balance.toLocaleString()}`
      );
    }

    // ─────────────────────────────────
    // PROTECCIÓN DEL CASINO
    // ─────────────────────────────────

    const casinoProfit = globalIn - globalOut;

    if (casinoProfit < -HOUSE_RESERVE) {

      return send(
        "🏦 El casino está en mantenimiento financiero.\n" +
        "Vuelve más tarde."
      );
    }

    // ─────────────────────────────────
    // COBRAR APUESTA
    // ─────────────────────────────────

    await AddBalance(userId, -amount);

    jackpot += Math.floor(amount * JACKPOT_RATE);

    globalIn += amount;

    // ─────────────────────────────────
    // SPIN
    // ─────────────────────────────────

    const result = spinFull(amount);

    // ─────────────────────────────────
    // PAYOUT
    // ─────────────────────────────────

    if (result.win) {

      await AddBalance(userId, result.payout);

      globalOut += result.payout;

      await AddCasinoResult(
        userId,
        "slot",
        amount,
        result.payout
      );
    }
    else {

      await AddCasinoResult(
        userId,
        "slot",
        amount,
        0
      );
    }

    // ─────────────────────────────────
    // MENSAJE
    // ─────────────────────────────────

    const icons = result.roll.map(s => s.icon);

    let msg =
      `🎰 | ${icons.join(" | ")} |\n`;

    if (result.win) {

      const profit = result.payout - amount;

      const phrases = [
        "🔥 ¡Buen giro!",
        "💰 ¡Vas en racha!",
        "🎉 ¡Sigue así!",
        "🍀 ¡La suerte te acompaña!"
      ];

      msg +=
        `\n🎉 Ganaste *$${profit.toLocaleString()}*`;

      msg +=
        `\n${phrases[secureRandInt(phrases.length)]}`;

      if (result.jackpotWin) {

        msg +=
          `\n\n💎 *¡¡¡JACKPOT!!!*`;

        msg +=
          `\n+$${result.jackpotWin.toLocaleString()}`;
      }
    }
    else {

      msg +=
        `\n😢 Perdiste $${amount.toLocaleString()}`;

      if (result.nearJackpot) {
        msg += `\n😳 *¡CASI JACKPOT!*`;
      }
      else if (result.near) {
        msg += `\n😏 *¡Estuviste cerca!*`;
      }
    }

    // RTP visible opcional (debug)
    const rtp = (getGlobalRTP() * 100).toFixed(2);

    msg +=
      `\n\n💰 Jackpot: $${jackpot.toLocaleString()}`;

    msg +=
      `\n📊 RTP Casino: ${rtp}%`;

    // ─────────────────────────────────
    // COOLDOWN
    // ─────────────────────────────────

    await UpdateCooldown(
      userId,
      "casino",
      result.win
        ? COOLDOWN_WIN
        : COOLDOWN_LOSE
    );

    return send(msg);

  }
  catch (err) {

    console.error("[Slot] Error:", err);

    return send(
      "⚠️ Hubo un error en la máquina.\n" +
      "Intenta nuevamente."
    );
  }
}