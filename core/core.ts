import {
  makeWASocket,
  Browsers,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "baileys"
import type { GroupMetadata, WASocket, WAMessage, } from 'baileys'
import P from 'pino'
import NodeCache from "node-cache"
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'
import type { CommandContext } from "../libs/types.js"
import { PointSystem } from "../services/points.js"
import { checkRobResponse } from "../libs/robbery.js"

type CommandHandler = (ctx: CommandContext) => void | Promise<void>
interface sendMessage {
  msg: WAMessage
  jid: string
  content: string
  reply?: true | false
  delay?: 1000 | number
  mentions?: string[]
}

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

class WABot {
  static useState = {}
  static socket: WASocket
  static commands = new Map<string, CommandHandler>()
  static prefix = '!'
  static async connect() {
    const { saveCreds, state } = await useMultiFileAuthState('auth_info_baileys')
    const { version } = await fetchLatestBaileysVersion()
    this.socket = makeWASocket({
      auth: state,
      version,
      logger: P({ level: 'silent' }),
      browser: Browsers.windows('Desktop'),
      connectTimeoutMs: 60_000,
      markOnlineOnConnect: false,
      retryRequestDelayMs: 250,
      printQRInTerminal: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      cachedGroupMetadata: async (jid: string) => groupCache.get(jid),
    })

    this.socket.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update

      if (qr) {
        const qrString = await QRCode.toString(qr, { type: 'terminal', small: true })
        console.clear()
        console.log('📱 ===== WHATSAPP BOT =====')
        console.log(qrString)
      }

      if (connection === 'open') {
        console.log('✅ Conectado a WhatsApp')
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode

        if (code === DisconnectReason.loggedOut) {
          console.log('🚪 Sesión cerrada. Escanea el QR nuevamente.')
        } else {
          console.log('🔄 Reconectando...')
          WABot.connect()
        }
      }
    })

    this.socket.ev.on('creds.update', saveCreds)
    await this.RequestMessage()
  }

  static async getGroupMetadata(jid: string) {
    const cached = groupCache.get(jid)
    if (cached) return cached as GroupMetadata

    const meta = await this.socket.groupMetadata(jid)
    groupCache.set(jid, meta)
    return meta as GroupMetadata
  }

  static async isAdmin(jid: string, participant: string) {
    const meta = await this.getGroupMetadata(jid) as GroupMetadata
    return meta.participants.some(
      p => p.id === participant && (p.admin === 'admin' || p.admin === 'superadmin')
    )
  }

  static async RequestMessage() {
    this.socket.ev.on('messages.upsert', async ({ messages, type, requestId }) => {
      const msg = messages[0]
      if (!msg?.message) return

      let text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''


      console.log(msg.key.remoteJid)

      if (!text.startsWith(this.prefix)) {
        console.log(`📩 Nuevo mensaje (${type}) ${msg.key} - Request ID: ${requestId}, time: ${new Date(Number(msg.messageTimestamp) * 1000)}`)
        // PointSystem(messages)
        if (msg.key.participant) checkRobResponse(msg.key.participant, text)

      } else {
        const jid = msg.key.remoteJid!
        const sender = msg.key.participant || jid
        const [cmd, ...args] = text.slice(this.prefix.length).trim().split(/\s+/)
        const admin = await this.isAdmin(jid, `${msg.key.participant}`)
        const command = this.commands.get(cmd ? cmd.toLowerCase() : '')
        if (!command) return
        const mentions =
          msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const ctx: CommandContext = {
          msg,
          jid,
          sender,
          text,
          args,
          mentions,
          admin
        }
        await command(ctx)
      }
    })
  }

  static sendMessage(message: sendMessage) {
    this.socket.sendPresenceUpdate('composing', message.jid)
    setTimeout(() => {
      this.socket.sendMessage(message.jid,
        {
          text: message.content,
          mentions: [...message.mentions || '']
        },
        message.reply ? { quoted: message.msg } : undefined)
    }, message.delay)
    this.socket.sendPresenceUpdate('available', message.jid)
  }

  static command(name: string, handler: CommandHandler) {
    this.commands.set(name.toLowerCase(), handler)
  }
}

const Bot = WABot

export { Bot }