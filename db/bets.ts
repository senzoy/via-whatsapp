import mongoose from "mongoose";
import { findCountry, getCountryAliases } from "../assets/countries.js";

const { Schema } = mongoose;

// ─── Counter for auto-increment matchId ──────────────────────────────────────

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel = mongoose.model("Counter", counterSchema);

async function getNextMatchId(): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    "matchId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter!.seq;
}

// ─── Match Schema ────────────────────────────────────────────────────────────

export type MatchStatus = "open" | "closed" | "finished";

export interface IMatch {
  matchId: number;
  teamA: string;
  teamB: string;
  teamAAliases: string[];
  teamBAliases: string[];
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
  createdBy: string;
  group: string;
  createdAt: Date;
  closedAt: Date | null;
  finishedAt: Date | null;
}

const matchSchema = new Schema<IMatch>({
  matchId: { type: Number, required: true, unique: true },
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  teamAAliases: { type: [String], default: [] },
  teamBAliases: { type: [String], default: [] },
  status: { type: String, enum: ["open", "closed", "finished"], default: "open" },
  scoreA: { type: Number, default: null },
  scoreB: { type: Number, default: null },
  createdBy: { type: String, required: true },
  group: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  finishedAt: { type: Date, default: null },
});

matchSchema.index({ group: 1, status: 1 });
matchSchema.index({ matchId: 1 });

const MatchModel = mongoose.model("Match", matchSchema);

// ─── Bet Schema ──────────────────────────────────────────────────────────────

export type BetType =
  | "exact_score"
  | "winner"
  | "loser"
  | "draw"
  | "over"
  | "under"
  | "double_chance";

export type BetResult = "pending" | "won" | "lost";

export interface IBet {
  matchId: number;
  userLib: string;
  betType: BetType;
  team: string | null;
  scoreA: number | null;
  scoreB: number | null;
  threshold: number | null;
  result: BetResult;
  changed: boolean;
  createdAt: Date;
}

const betSchema = new Schema<IBet>({
  matchId: { type: Number, required: true },
  userLib: { type: String, required: true },
  betType: {
    type: String,
    enum: ["exact_score", "winner", "loser", "draw", "over", "under", "double_chance"],
    required: true,
  },
  team: { type: String, default: null },
  scoreA: { type: Number, default: null },
  scoreB: { type: Number, default: null },
  threshold: { type: Number, default: null },
  result: { type: String, enum: ["pending", "won", "lost"], default: "pending" },
  changed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

betSchema.index({ matchId: 1 });
betSchema.index({ matchId: 1, userLib: 1 });

const BetModel = mongoose.model("Bet", betSchema);

// ─── Team Alias Helpers ──────────────────────────────────────────────────────

/** Normalize a string for comparison: lowercase, remove accents */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Generate common aliases from a team name */
export function generateAliases(name: string): string[] {
  const norm = normalize(name);
  const aliases = new Set<string>([norm, name.toLowerCase()]);

  // Add first 3 chars as abbreviation if name is long enough
  if (norm.length >= 4) {
    aliases.add(norm.slice(0, 3));
  }

  // Add country-specific aliases if the name matches a known country
  const country = findCountry(name);
  if (country) {
    for (const alias of getCountryAliases(country)) {
      aliases.add(alias);
    }
  }

  return [...aliases];
}

// ─── Match CRUD ──────────────────────────────────────────────────────────────

export async function createMatch(
  teamA: string,
  teamB: string,
  createdBy: string,
  group: string
): Promise<IMatch> {
  const matchId = await getNextMatchId();
  const teamAAliases = generateAliases(teamA);
  const teamBAliases = generateAliases(teamB);

  const match = await MatchModel.create({
    matchId,
    teamA: teamA.toLowerCase(),
    teamB: teamB.toLowerCase(),
    teamAAliases,
    teamBAliases,
    status: "open",
    createdBy,
    group,
  });

  return match.toObject();
}

export async function getOpenMatches(group: string) {
  return MatchModel.find({ group, status: "open" }).sort({ createdAt: -1 });
}

export async function getActiveMatches(group: string) {
  return MatchModel.find({ group, status: { $in: ["open", "closed"] } }).sort({ createdAt: -1 });
}

export async function getMatchById(matchId: number) {
  return MatchModel.findOne({ matchId });
}

/**
 * Find an open match in a group that has a team matching the given alias.
 * Returns the match and which side (A or B) matched.
 */
export async function findMatchByTeam(
  teamAlias: string,
  group: string
): Promise<{ match: IMatch; side: "A" | "B" } | null> {
  const norm = normalize(teamAlias);
  const matches = await MatchModel.find({ group, status: "open" });

  for (const m of matches) {
    if (m.teamAAliases.some((a) => normalize(a) === norm)) {
      return { match: m.toObject(), side: "A" };
    }
    if (m.teamBAliases.some((a) => normalize(a) === norm)) {
      return { match: m.toObject(), side: "B" };
    }
  }

  return null;
}

/**
 * Resolve a team alias against a specific match.
 * Returns the canonical team name and side.
 */
export function resolveTeamInMatch(
  match: IMatch,
  teamAlias: string
): { team: string; side: "A" | "B" } | null {
  const norm = normalize(teamAlias);
  if (match.teamAAliases.some((a) => normalize(a) === norm)) {
    return { team: match.teamA, side: "A" };
  }
  if (match.teamBAliases.some((a) => normalize(a) === norm)) {
    return { team: match.teamB, side: "B" };
  }
  return null;
}

export async function closeMatch(matchId: number) {
  return MatchModel.updateOne(
    { matchId, status: "open" },
    { $set: { status: "closed", closedAt: new Date() } }
  );
}

export async function setMatchResult(matchId: number, scoreA: number, scoreB: number) {
  return MatchModel.updateOne(
    { matchId, status: { $in: ["open", "closed"] } },
    {
      $set: {
        status: "finished",
        scoreA,
        scoreB,
        finishedAt: new Date(),
        closedAt: new Date(),
      },
    }
  );
}

// ─── Bet CRUD ────────────────────────────────────────────────────────────────

export async function placeBet(
  matchId: number,
  userLib: string,
  betData: {
    betType: BetType;
    team: string | null;
    scoreA?: number | null;
    scoreB?: number | null;
    threshold?: number | null;
  }
) {
  return BetModel.create({
    matchId,
    userLib,
    betType: betData.betType,
    team: betData.team,
    scoreA: betData.scoreA ?? null,
    scoreB: betData.scoreB ?? null,
    threshold: betData.threshold ?? null,
    result: "pending",
  });
}

export async function getUserBetForMatch(matchId: number, userLib: string) {
  return BetModel.findOne({ matchId, userLib });
}

export async function getBetsByMatch(matchId: number) {
  return BetModel.find({ matchId });
}

export async function getUserChangedBetForMatch(matchId: number, userLib: string) {
  return BetModel.findOne({ matchId, userLib, changed: true });
}

export async function getBetsByUser(userLib: string) {
  return BetModel.find({ userLib }).sort({ createdAt: -1 });
}

export async function getMatchesByIds(matchIds: number[]) {
  return MatchModel.find({ matchId: { $in: matchIds } });
}

// ─── Bet Evaluation ──────────────────────────────────────────────────────────

/**
 * Evaluate a single bet against the final score.
 * The match object is needed to know which team is A and which is B.
 */
function evaluateSingleBet(
  bet: IBet,
  match: IMatch,
  scoreA: number,
  scoreB: number
): BetResult {
  switch (bet.betType) {
    case "draw":
      return scoreA === scoreB ? "won" : "lost";

    case "exact_score": {
      return bet.scoreA === scoreA && bet.scoreB === scoreB ? "won" : "lost";
    }

    case "winner": {
      // bet.team is the canonical team name (match.teamA or match.teamB)
      if (bet.team === match.teamA) {
        return scoreA > scoreB ? "won" : "lost";
      }
      if (bet.team === match.teamB) {
        return scoreB > scoreA ? "won" : "lost";
      }
      return "lost";
    }

    case "loser": {
      if (bet.team === match.teamA) {
        return scoreA < scoreB ? "won" : "lost";
      }
      if (bet.team === match.teamB) {
        return scoreB < scoreA ? "won" : "lost";
      }
      return "lost";
    }

    case "over": {
      // bet.team scored MORE than threshold
      const teamScore = bet.team === match.teamA ? scoreA : scoreB;
      return teamScore > (bet.threshold ?? 0) ? "won" : "lost";
    }

    case "under": {
      // bet.team scored LESS than threshold
      const teamScore = bet.team === match.teamA ? scoreA : scoreB;
      return teamScore < (bet.threshold ?? 0) ? "won" : "lost";
    }

    case "double_chance": {
      // Team wins OR draw
      if (scoreA === scoreB) return "won"; // draw
      if (bet.team === match.teamA && scoreA > scoreB) return "won";
      if (bet.team === match.teamB && scoreB > scoreA) return "won";
      return "lost";
    }

    default:
      return "lost";
  }
}

/**
 * Evaluate all bets for a match and update their results in the DB.
 * Returns arrays of winning and losing bets.
 */
export async function evaluateBets(matchId: number, scoreA: number, scoreB: number) {
  const match = await MatchModel.findOne({ matchId });
  if (!match) throw new Error(`Match ${matchId} not found`);

  const bets = await BetModel.find({ matchId, result: "pending" });

  const winners: IBet[] = [];
  const losers: IBet[] = [];

  for (const bet of bets) {
    const result = evaluateSingleBet(bet.toObject(), match.toObject(), scoreA, scoreB);

    bet.result = result;
    await bet.save();

    if (result === "won") {
      winners.push(bet.toObject());
    } else {
      losers.push(bet.toObject());
    }
  }

  return { winners, losers, match: match.toObject() };
}

// ─── Bet Stats ─────────────────────────────────────────────────────────────

export interface MatchBetBreakdown {
  match: IMatch;
  total: number;
  byTeam: Record<string, number>;
  byType: Record<string, number>;
}

export interface GroupBetSummary {
  matchId: number;
  teamA: string;
  teamB: string;
  status: string;
  count: number;
}

export async function getBetBreakdownByMatch(matchId: number): Promise<MatchBetBreakdown | null> {
  const match = await MatchModel.findOne({ matchId });
  if (!match) return null;

  const bets = await BetModel.find({ matchId });
  const byTeam: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const b of bets) {
    const betType = b.betType;
    byType[betType] = (byType[betType] ?? 0) + 1;

    if (betType === "draw") {
      byTeam["draw"] = (byTeam["draw"] ?? 0) + 1;
    } else if (betType === "exact_score") {
      // exact_score doesn't favor a single team, skip byTeam
    } else if (betType === "double_chance" && b.team) {
      byTeam[b.team] = (byTeam[b.team] ?? 0) + 1;
      byTeam["draw"] = (byTeam["draw"] ?? 0) + 1;
    } else if (b.team) {
      byTeam[b.team] = (byTeam[b.team] ?? 0) + 1;
    }
  }

  return { match: match.toObject(), total: bets.length, byTeam, byType };
}

export async function getBetCountsByGroup(group: string): Promise<GroupBetSummary[]> {
  const matches = await MatchModel.find({ group, status: { $in: ["open", "closed"] } }).sort({ createdAt: -1 });

  const summaries: GroupBetSummary[] = [];

  for (const m of matches) {
    const count = await BetModel.countDocuments({ matchId: m.matchId });
    summaries.push({
      matchId: m.matchId,
      teamA: m.teamA,
      teamB: m.teamB,
      status: m.status,
      count,
    });
  }

  return summaries;
}

// ─── Maxbet Ranking ─────────────────────────────────────────────────────────

const BET_POINTS: Record<string, number> = {
  exact_score: 3,
  winner: 2,
  draw: 1,
  double_chance: 1,
  over: 1.5,
  under: 1.5,
  loser: 0,
};

export interface MaxbetEntry {
  lib: string;
  name: string;
  points: number;
}

export async function getMaxbetRanking(group: string): Promise<MaxbetEntry[]> {
  const finishedMatches = await MatchModel.find({ group, status: "finished" });
  const matchIds = finishedMatches.map((m) => m.matchId);
  if (matchIds.length === 0) return [];

  const wonBets = await BetModel.find({ matchId: { $in: matchIds }, result: "won" });

  const pointsByLib: Record<string, number> = {};
  for (const b of wonBets) {
    pointsByLib[b.userLib] = (pointsByLib[b.userLib] ?? 0) + (BET_POINTS[b.betType] ?? 0);
  }

  const { getMember } = await import("../db/mongodb.js");
  const entries: MaxbetEntry[] = [];

  for (const [lib, points] of Object.entries(pointsByLib)) {
    const member = await getMember(lib);
    entries.push({
      lib,
      name: member?.name ?? lib.split("@")[0] ?? "Unknown",
      points,
    });
  }

  entries.sort((a, b) => b.points - a.points);
  return entries;
}
