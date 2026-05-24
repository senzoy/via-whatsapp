import mongoose, { model, Types } from "mongoose";
import dotenv from 'dotenv';

dotenv.config()

mongoose.connect(process.env.DB || '')
const { Schema } = mongoose

const memberSchema = new Schema({
  name: String,
  group: String,
  discordId: String,
  discordTag: String,
  lib: String,
  points: Number,
  birthday: { day: Number, month: Number },
  level: Number,
  cooldowns: {
    work: Date,
    casino: Date,
    daily: Date,
  },
  bank: {
    balance: Number,
    transactions: [{ id: String, amount: Number, type: String, receiver: String, sender: String, timeStamp: Date }]
  },
  warnings: [
    { id: Number, reason: String, timeStamp: Date }
  ],
  message: [{ content: String, timeStamp: Date }]
})

const Model = mongoose.model('Member', memberSchema)
Model.createCollection();


const casinoRegister = new Schema({
  lib: String,
  game: { type: String },
  bet: { type: Number },
  payout: { type: Number },
  win: { type: Boolean },
  timeStamp: { type: Date, default: Date.now() },
})

const CasinoModel = mongoose.model('Casino', casinoRegister)



// async function updateLevel() {
//   const operations = data.map(member => ({
//     updateOne: {
//       filter: { lib: member.id },
//       update: {
//         $set: {
//           level: member.points
//         }
//       },
//       upsert: true // opcional
//     }
//   }))

//   await Model.bulkWrite(operations)

//   console.log('✅ Niveles actualizados')
// }
// updateLevel()

export function NewMember(name: string, msg: { content: string, timeStamp: Date }, group: string) {
  const doc = new Model({ name, points: 0, message: [msg], warnings: [], group: group })
  doc.save()
}

export async function SaveMessages(id: Types.ObjectId, msg: { content: string, timeStamp: Date }, group: string) {
  await Model.updateOne({ _id: id }, { $push: { message: msg }, $inc: { points: msg.content.split(/[^\w\s]+|\s+/).length, level: 1, 'bank.balance': msg.content.split(/[^\w\s]+|\s+/).length } })
}

export async function updatePoints(id: Types.ObjectId, points: number) {
  await Model.updateOne({ _id: id }, { $inc: { points: points, level: points } })
}

export async function getMember(lib: string) {
  const doc = await Model.findOne({ lib: lib });
  if (doc) return doc
}

export async function setMember(name: string, lib: string, msg: { content: string, timeStamp: Date }, group: string) {
  const doc = await Model.create({ name, lib: lib, points: msg.content.split(/[^\w\s]+|\s+/).length, message: [msg], warnings: [], group: group })
}

export async function getTopMembers(from: string) {
  const members = await Model.find({ group: from }, { name: 1, points: 1, }).sort({ points: -1 })
  return members
}

export async function getTopMembersLvl(from: string) {
  const members = await Model.find({ group: from }).sort({ level: -1 })
  return members
}


export async function addWarn(id: Types.ObjectId, warning: { id: Number, reason: string, timeStamp: Date }) {
  await Model.updateOne({ _id: id }, { $push: { warnings: warning } })
}

export async function getWarnings(from: string) {
  const warnings = await Model.findOne({ lib: from }).select('warnings')
  return warnings
}

type Actions = 'add' | 'remove' | 'list'

type PropsMap = {
  add: {
    id: Number
    reason: string
    timeStamp: Date
  }
  remove: {
    warn: number | 'all'
  }
  list: {}
}
export async function MemberWarnings<T extends Actions>(
  lib: string,
  action: T,
  props: PropsMap[T]
) {

  if (action === 'add') {
    await Model.updateOne({ lib: lib }, { $push: { warnings: props } })
    return
  }

  if (action === 'remove') {
    console.log(props)
    const a = props as PropsMap['remove']
    if (a.warn === 'all') {
      const warnings = await Model.updateOne({ lib: lib }, { $set: { warnings: [] } })
      return warnings
    }
    if (typeof a.warn === 'number') {
      const user = await Model.findOne({ lib: lib }).select('warnings')
      if (!user || !user.warnings?.length) return

      const index = a.warn

      if (index < 0 || index >= user.warnings.length) return

      user.warnings.splice(index, 1)
      await user.save()
      return
    }
  }
  if (action === 'list') {
    const warnings = await Model.findOne({ lib: lib }).select('warnings')
    return warnings
  }
}


export async function getAllMessages() {
  const messages = await Model.find({}).select('name message')

  const all = messages.flatMap(user =>
    user.message.map(msg => ({
      name: user.name,
      content: msg.content,
      timeStamp: msg.timeStamp
    }))
  )

  const sorted = all.sort(
    (a, b) => new Date(a.timeStamp) - new Date(b.timeStamp)
  )

  return sorted
    .map(msg => `${msg.name}: ${msg.content}`)
    .join('\n')
}

export async function resetMessagesAndPoints() {
  await Model.updateMany(
    {},
    {
      $set: { message: [], points: 0 }
    }
  )
}

export async function resetWarnings() {
  await Model.updateMany(
    {},
    {
      $set: { warnings: [] }
    }
  )
}

interface BankTransaction {
  id: string
  amount: number
  type: 'deposit' | 'withdrawal'
  receiver: string
  sender: string
  timeStamp: Date
}

export async function AddTransaction(lib: string, transaction: BankTransaction) {
  await Model.updateOne({ lib: lib }, { $push: { bank: transaction } })
}

export async function getMemberBank(lib: string) {
  const user = await Model.findOne({ lib: lib }).select('bank')
  return user
}

export async function getTopMoney() {
  const members = await Model.find({}).sort({ 'bank.balance': -1 }).select('bank name')
  return members
}

export async function Transfer(
  senderLib: string,
  receiverLib: string,
  amount: number
) {
  const sender = await Model.findOne({ lib: senderLib });
  const receiver = await Model.findOne({ lib: receiverLib });

  if (!sender || !receiver) return;
  if (amount <= 0) return;
  if (!sender.bank?.balance || sender.bank.balance < amount) return;

  sender.bank.balance -= amount;
  receiver.bank.balance += amount;

  await Promise.all([sender.save(), receiver.save()]);
}

export async function UpdateCooldown(lib: string, action: 'work' | 'casino' | 'daily', time: number) {
  await Model.updateOne({ lib: lib }, { $set: { [`cooldowns.${action}`]: Date.now() + time } })
}

export async function GetCooldown(lib: string, action: 'work' | 'casino' | 'daily') {
  const user = await Model.findOne({ lib: lib }).select('cooldowns')
  return user?.cooldowns?.[action] || null
}

export async function DeleteCooldown(lib: string, action: 'work' | 'casino' | 'daily') {
  await Model.updateOne({ lib: lib }, { $unset: { [`cooldowns.${action}`]: "" } })
}

export async function AddBalance(lib: string, amount: number) {
  await Model.updateOne({ lib: lib }, { $inc: { 'bank.balance': amount } })
}

export async function resetAllCooldown() {
  await Model.updateMany({}, {
    $set: {
      cooldowns: {
        work: 0,
        casino: 0,
        daily: 0
      }
    }
  })
}

export async function AddBone(amount: number) {
  await Model.updateMany({}, { $inc: { 'bank.balance': amount } })
}


export async function AddCasinoPlay(lib: string, game: string, bet: number) {
  const doc = new CasinoModel({ lib, game, bet, timeStamp: new Date() })
  await doc.save()
}

export async function AddCasinoResult(lib: string, game: string, bet: number, payout: number) {
  const doc = new CasinoModel({ lib, game, bet, payout, timeStamp: new Date() })
  await doc.save()
}



export async function GetCasinoStats() {
  const now = new Date();


  const panamaNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Panama' })
  );

  const start = new Date(panamaNow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(panamaNow);
  end.setHours(23, 59, 59, 999);

  const plays = await CasinoModel.find({
    timeStamp: {
      $gte: start,
      $lte: end
    }
  }).select('game payout bet win lib timeStamp');

  return plays;
}


export async function GetCasinoWins(lib: string) {
  const wins = await CasinoModel.find({ lib: lib, win: true }).select('game payout bet win timeStamp')
  return wins
}

export async function GetCasinoLosses(lib: string) {
  const losses = await CasinoModel.find({ lib: lib, win: false }).select('game bet win timeStamp')
  return losses
}

export async function UpdateBirthday(
  lib: string,
  date: { day: number; month: number }
) {
  await Model.updateOne(
    { lib },
    {
      $set: {
        birthday: {
          day: date.day,
          month: date.month
        }
      }
    }
  );
}


export async function GetMemberBirthday(lib: string) {
  const user = await Model.findOne({ lib: lib }).select('birthday name')
  return user || null
}

export async function GetAllBirthdays() {
  const users = await Model.find({}).select('birthday name').sort({ 'birthday.month': 1, 'birthday.day': 1 })
  return users
}

export async function getBirthdaysToday() {
  const date = new Date()
  const panamaNow = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/Panama' })
  );
  const month = panamaNow.getMonth() + 1
  const day = panamaNow.getDate()
  const birthdays = await Model.find({ 'birthday.day': day, 'birthday.month': month }).select('birthday name lib group')
  console.log(birthdays)
  return birthdays
}