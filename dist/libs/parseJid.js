export function parseJid(jid) {
    const [userPart, domain] = jid.split('@');
    const [userId, deviceId] = userPart.split(':');
    return {
        userId,
        deviceId: deviceId ? Number(deviceId) : 0,
        domain, // 'lid' | 's.whatsapp.net' | 'g.us'
        isGroup: domain === 'g.us',
        isLid: domain === 'lid',
        lid: `${userId}@lid`
    };
}
