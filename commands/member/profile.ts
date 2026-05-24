
import { Bot } from "../../core/core.js";
import type { CommandContext } from "../../libs/types.js";
import { GetMemberBirthday, getMember } from "../../db/mongodb.js";

export function getRank(points: number) {
  if (points >= 25000) return '👑 Admin'
  if (points >= 23000) return '💵 Familia Motta'
  if (points >= 21000) return '🌿 Traficante'
  if (points >= 20000) return '⚔️ Maestro'
  if (points >= 17000) return '🧠 Filósofo'
  if (points >= 15000) return '🩺 Doctor'
  if (points >= 14500) return '🎩 Embajador'
  if (points >= 14300) return '🪑 4 x 8'
  if (points >= 14200) return '🧥 Ministro'
  if (points >= 13800) return '🐇 Mataviejitos'
  if (points >= 13500) return '📖 Testigo de Jehová'
  if (points >= 13000) return '🍻 Parkeador'
  if (points >= 12000) return '📰 Reportero'
  if (points >= 11500) return '🏆 Challenger LP1300'
  if (points >= 11000) return '🦅 Águila'
  if (points >= 10800) return '🏛 Diputado'
  if (points >= 10400) return '⚖ ACODECO'
  if (points >= 10100) return '☕ Cafetero'
  if (points >= 10000) return '🍺 Bebedor experto'
  if (points >= 9800) return '🛴 Yeyecita'
  if (points >= 9600) return '💸 Auxilio Economico'
  if (points >= 9500) return '👴 100 a los 70'
  if (points >= 9250) return '🏙 Costa del Este'
  if (points >= 9100) return '🚌 Pavo de bus'
  if (points >= 9000) return '🔫 Colón'
  if (points >= 8800) return '💅 Rakataka'
  if (points >= 8700) return '📄 Billetero'
  if (points >= 8500) return '🧼 Mistolín'
  if (points >= 8200) return '💎 La Joyita'
  if (points >= 8000) return '👄 Bewy'
  if (points >= 7800) return '🚓 San Miguelito'
  if (points >= 7700) return '🐦 Gavilán Pollero'
  if (points >= 7500) return '🔪 Pandillero'
  if (points >= 7200) return '👷 Trabajador del MOP'
  if (points >= 7100) return '🚽 Baño Público'
  if (points >= 7000) return '📑 Bien Cuidao'
  if (points >= 6800) return '🍺 Pinta'
  if (points >= 6700) return '🗿 Botella'
  if (points >= 6500) return '🧛‍♂️ Chupa sangre'
  if (points >= 6200) return '🚗 Uber'
  if (points >= 6000) return '🦌 Venado'
  if (points >= 5800) return '🐟 Camisa Celeste'
  if (points >= 5500) return '👮‍♂️ Tongo'
  if (points >= 5200) return '🧀 Siu-Mai'
  if (points >= 5000) return '🐔 Roba Pollo'
  if (points >= 4800) return '💰 Bien cuidao'
  if (points >= 4500) return '🐴 Yeguero'
  if (points >= 4400) return '🚪 Los Colados'
  if (points >= 4200) return '🦆 Santeño'
  if (points >= 4000) return '🐄 Ganadero'
  if (points >= 3800) return '🐗 Puerco de monte'
  if (points >= 3700) return '🌈 Plomero'
  if (points >= 3600) return '🚶‍♂️ Vendedor Ambulante'
  if (points >= 3500) return '🐔 Gallinazo'
  if (points >= 3200) return '📦 Paquetero'
  if (points >= 3000) return '🚚 Repartidor De P.YA'
  if (points >= 2800) return '🎣 Pescador'
  if (points >= 2700) return '🏠 Techos de Esperanza'
  if (points >= 2200) return '🎲 Ludópata'
  if (points >= 2000) return '💊 Drogadicto'
  if (points >= 1700) return '🧂 Salado'
  if (points >= 1500) return '🗿 Piedrero'
  if (points >= 1300) return '🔥 Intenso'
  if (points >= 1000) return '🗣️ Bocón'
  if (points >= 900) return '� Alerta Amber'
  if (points >= 700) return '😄 Activo'
  if (points >= 400) return '🐢 Varela'
  if (points >= 200) return '🐛 Gusano'
  if (points >= 100) return '👀 Mirón'
  if (points >= 50) return '🐣 Nuevo'
  return '💀 Cadáver'
}

export function getLevel(points: number) {
  return Math.floor(0.1 * Math.sqrt(points))
}

interface Profile {
  jid: string
  admin?: boolean
}

async function execute(profile: Profile) {
  try {
    const user = await getMember(profile.jid)
    if (user) {
      const birthday = await GetMemberBirthday(profile.jid)
      return `
      *Perfil de Usuario*
      👤 Nombre: ${user?.name}
      🧢 Discord: ${user?.discordTag ? `✅ ${user.discordTag}` : '❌ No verificado'}
      📅 Cumpleaños: ${birthday?.birthday == null ? `No registrado` : `${birthday.birthday.day}/${birthday.birthday.month}`}
      ✉ Mensajes: ${user?.message.length}
      👑 Puntos: ${user?.points?.toLocaleString('en-us')}
      ⚠ Advertencias: ${user?.warnings.length}
      📗 Nivel: ${getLevel(user.level || 0)}
      ⚔️ Rango: ${getRank(user.level || 0)}
      `
    } else {
      return 'No Hay Registro'
    }
  } catch (error) {
    console.log(error)
    return 'Error al obtener el perfil'
  }
}

export async function Profile(ctx: CommandContext) {
  const member = await ctx.msg.key.participant;
  const mentioned = await ctx.mentions[0]
  const admin = await Bot.isAdmin(ctx.jid, mentioned ? mentioned : member as string)
  execute({
    jid: mentioned ? mentioned : `${member}`,
    admin: admin
  }).then(res => {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: res,
      reply: true,
      delay: 1500
    })
  })
}