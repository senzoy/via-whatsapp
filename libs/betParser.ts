// ─── Bet Parser ──────────────────────────────────────────────────────────────
// Parses the args from `!apuesto <...>` into a structured bet.
//
// Priority order:
//   1. empate
//   2. <team> <num> <team> <num>  → exact_score
//   3. <team> > <num>             → over
//   3. <team> < <num>             → under
//   4. <team> gana                → winner
//   5. <team> pierde              → loser
//   6. <team> o empate            → double_chance

export type ParsedBet =
  | { type: "draw" }
  | { type: "exact_score"; teamA: string; scoreA: number; teamB: string; scoreB: number }
  | { type: "over"; team: string; threshold: number }
  | { type: "under"; team: string; threshold: number }
  | { type: "winner"; team: string }
  | { type: "loser"; team: string }
  | { type: "double_chance"; team: string };

/** Normalize for comparison: lowercase + remove accents */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Parse the args array from `!apuesto` into a ParsedBet.
 * Returns null if the input doesn't match any known pattern.
 *
 * @param args — The split args after `!apuesto`, e.g. ["mex", "gana"]
 */
export function parseBet(args: string[]): ParsedBet | null {
  if (args.length === 0) return null;

  const lower = args.map((a) => norm(a));

  // ── 1. Empate ──────────────────────────────────────────────────────────────
  if (lower.length === 1 && lower[0] === "empate") {
    return { type: "draw" };
  }

  // ── 2. Marcador exacto: <team> <num> <team> <num> ─────────────────────────
  if (lower.length === 4) {
    const scoreA = Number(lower[1]);
    const scoreB = Number(lower[3]);
    if (!isNaN(scoreA) && !isNaN(scoreB) && Number.isInteger(scoreA) && Number.isInteger(scoreB) && scoreA >= 0 && scoreB >= 0) {
      return {
        type: "exact_score",
        teamA: lower[0]!,
        scoreA,
        teamB: lower[2]!,
        scoreB,
      };
    }
  }

  // ── 3. Over/Under: <team> > <num> | <team> < <num> ────────────────────────
  if (lower.length === 3 && (lower[1] === ">" || lower[1] === "<")) {
    const threshold = Number(lower[2]);
    if (!isNaN(threshold) && Number.isInteger(threshold) && threshold >= 0) {
      const betType = lower[1] === ">" ? "over" : "under";
      return {
        type: betType,
        team: lower[0]!,
        threshold,
      };
    }
  }

  // ── 4. Ganador: <team> gana ────────────────────────────────────────────────
  if (lower.length === 2 && lower[1] === "gana") {
    return { type: "winner", team: lower[0]! };
  }

  // ── 5. Perdedor: <team> pierde ─────────────────────────────────────────────
  if (lower.length === 2 && lower[1] === "pierde") {
    return { type: "loser", team: lower[0]! };
  }

  // ── 6. Doble oportunidad: <team> o empate ──────────────────────────────────
  if (lower.length === 3 && lower[1] === "o" && lower[2] === "empate") {
    return { type: "double_chance", team: lower[0]! };
  }

  return null;
}

/**
 * Format a parsed bet into a human-readable Spanish string.
 */
export function formatBet(bet: ParsedBet): string {
  switch (bet.type) {
    case "draw":
      return "⚖️ *Empate*";
    case "exact_score":
      return `🎯 *Marcador exacto:* ${bet.teamA} ${bet.scoreA} - ${bet.teamB} ${bet.scoreB}`;
    case "over":
      return `📈 *${bet.team}* anota más de ${bet.threshold} goles`;
    case "under":
      return `📉 *${bet.team}* anota menos de ${bet.threshold} goles`;
    case "winner":
      return `🏆 *${bet.team}* gana`;
    case "loser":
      return `💀 *${bet.team}* pierde`;
    case "double_chance":
      return `🔄 *${bet.team}* gana o empate`;
  }
}

/**
 * Get the team names mentioned in a parsed bet (for match lookup).
 * Returns an array of team aliases used.
 */
export function getTeamsFromBet(bet: ParsedBet): string[] {
  switch (bet.type) {
    case "draw":
      return [];
    case "exact_score":
      return [bet.teamA, bet.teamB];
    case "over":
    case "under":
    case "winner":
    case "loser":
    case "double_chance":
      return [bet.team];
  }
}
