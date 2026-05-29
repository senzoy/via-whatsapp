export var SystemPoints;
(function (SystemPoints) {
    SystemPoints[SystemPoints["IMAGE"] = 5] = "IMAGE";
    SystemPoints[SystemPoints["REACTION"] = 1] = "REACTION";
    SystemPoints[SystemPoints["AUDIO"] = 1.5] = "AUDIO";
    SystemPoints[SystemPoints["VIDEO"] = 10] = "VIDEO";
    SystemPoints[SystemPoints["STICKER"] = 2] = "STICKER";
})(SystemPoints || (SystemPoints = {}));
// ─── Casino Schedule (Panama timezone) ─────────────────────────────────────────
const CASINO_HOURS = [
    { open: { h: 21, m: 20 }, close: { h: 21, m: 30 } }, // 9:20 pm – 9:30 pm
    { open: { h: 22, m: 0 }, close: { h: 22, m: 10 } }, // 10:00 pm – 10:10 pm
];
function getPanamaMinutes() {
    const now = new Date();
    const panamaStr = now.toLocaleString('en-US', { timeZone: 'America/Panama', hour12: false });
    const parts = panamaStr.split(', ');
    if (parts.length < 2)
        return 0;
    const timePart = parts[1];
    const timeParts = timePart.split(':').map(Number);
    if (timeParts.length < 2)
        return 0;
    return timeParts[0] * 60 + timeParts[1];
}
export function isCasinoOpen() {
    const currentMinutes = getPanamaMinutes();
    return CASINO_HOURS.some(({ open, close }) => {
        const openMinutes = open.h * 60 + open.m;
        const closeMinutes = close.h * 60 + close.m;
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    });
}
export function getNextOpenTime() {
    const currentMinutes = getPanamaMinutes();
    for (const { open } of CASINO_HOURS) {
        const openMinutes = open.h * 60 + open.m;
        if (currentMinutes < openMinutes) {
            return `${String(open.h).padStart(2, '0')}:${String(open.m).padStart(2, '0')}`;
        }
    }
    // Ya pasaron ambos horarios — devuelve el primero del día siguiente
    const first = CASINO_HOURS[0]?.open;
    if (!first)
        return '21:20';
    return `${String(first.h).padStart(2, '0')}:${String(first.m).padStart(2, '0')}`;
}
