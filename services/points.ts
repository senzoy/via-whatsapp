import type { WAMessage } from "baileys"
import { getMember, SaveMessages, setMember, updatePoints } from "../db/mongodb.js"
import { SystemPoints } from "../libs/types.js"

export async function PointSystem(messages: WAMessage[]) {
  for (const msg of messages) {
    if (!msg.message || msg.key.fromMe) continue
    const isGroup = msg.key.remoteJid?.endsWith('@g.us')
    const from = msg.key.remoteJid!
    let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''

    const points = () => {
      if (msg.message?.imageMessage) {
        return SystemPoints.IMAGE
      }
      if (msg.message?.reactionMessage) {
        return SystemPoints.REACTION
      }
      if (msg.message?.audioMessage) {
        if (msg.message?.audioMessage.seconds as number > 10) {
          return 10
        }
        return (msg.message?.audioMessage.seconds as number) * SystemPoints.AUDIO
      }
      if (msg.message?.videoMessage) {
        return SystemPoints.VIDEO
      }
      if (msg.message?.stickerMessage) {
        return SystemPoints.STICKER
      }
    }

    if (isGroup) {
      getMember(`${msg.key.participant}`).then(d => {
        if (d) {
          if (text.length > 0) {
            SaveMessages(d._id, { content: text, timeStamp: new Date() }, from)
          } else {
            updatePoints(d._id, points() || 0)
          }
        } else {
          setMember(`${msg.pushName}`, `${msg.key.participant}`, { content: text, timeStamp: new Date() }, from)
        }
      })
    }
  }
} 
