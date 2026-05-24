import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember, GetCasinoStats } from "../../db/mongodb.js";
// ─── Formatter ────────────────────────────────────────────────────────────────

async function formatStats(plays: any[]): Promise<{ content: string; mentions: string[] }> {
    const fmt = (n: number) => `$${Math.floor(n).toLocaleString('en-US')}`;

    // Globales
    const totalBet = plays.reduce((s, p) => s + (p.bet ?? 0), 0);
    const totalPayout = plays.reduce((s, p) => s + (p.payout ?? 0), 0);
    const totalGames = plays.length;
    const totalWins = plays.filter(p => p.win).length;
    const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';

    const gameCount = plays.reduce<Record<string, number>>((acc, p) => {
        if (!p.game) return acc;
        acc[p.game] = (acc[p.game] ?? 0) + 1;
        return acc;
    }, {});

    const gameEmoji: Record<string, string> = {
        slot: '🎰 Tragamonedas',
        ruleta: '🎡 Ruleta',
    };

    const gameLines = Object.entries(gameCount)
        .sort(([, a], [, b]) => b - a)
        .map(([game, count]) => {
            const label = gameEmoji[game.toLowerCase()] ?? `🎮 ${game}`;
            return `  ${label}: ${count.toLocaleString('en-US')} partidas`;
        })
        .join('\n');

    // Agrupar por jugador — bet y payout
    const statsByLib = plays.reduce<Record<string, { bet: number; payout: number }>>((acc, p) => {
        if (!p.lib) return acc;
        if (!acc[p.lib]) acc[p.lib] = { bet: 0, payout: 0 };
        acc[p.lib].bet += p.bet ?? 0;
        acc[p.lib].payout += p.payout ?? 0;
        return acc;
    }, {});

    const sorted = Object.entries(statsByLib)
        .filter(([, s]) => s.bet > 0)
        .sort(([, a], [, b]) => b.bet - a.bet);

    // Resolver nombres y acumular mentions
    const mentions: string[] = [];

    const topLines = await Promise.all(
        sorted.map(async ([lib, s], i) => {
            const member = await getMember(lib);
            const name = member?.name ?? lib.split('@')[0];
            const jid = lib.replace('@lid', '@s.whatsapp.net');
            mentions.push(jid);
            return (`${i + 1}. @${name}\n💰 *Apostado*: ${fmt(s.bet)}\n💸 *Ganado*: ${fmt(s.payout)}`);
        })
    );

    const content = (
        `🎰 *Estadísticas del Casino*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💸 *Total apostado:*   ${fmt(totalBet)}\n` +
        `💸 *Total ganado:*     ${fmt(totalPayout)}\n` +
        `🎮 *Partidas jugadas:* ${totalGames.toLocaleString('en-US')}\n` +
        `✅ *Ganadores:*        ${totalWins.toLocaleString('en-US')} (${winRate}%)\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🕹️ *Juegos*\n` +
        `${gameLines}\n` +
        `REGISTRO DE APUESTAS\n` + topLines.join('\n\n💰')
    );

    return { content, mentions };
}

// ─── Comando ──────────────────────────────────────────────────────────────────

export async function Casino(ctx: CommandContext) {
    try {
        const plays = await GetCasinoStats();
        const { content, mentions } = await formatStats(plays);

        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content,
            mentions,
            delay: 1500
        });

    } catch (err) {
        console.error('[Casino] Error:', err);
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: '⚠️ No se pudieron cargar las estadísticas.',
            delay: 1500
        });
    }
}