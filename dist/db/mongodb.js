import mongoose, { model, Types } from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.DB || '');
const { Schema } = mongoose;
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
});
const Model = mongoose.model('Member', memberSchema);
Model.createCollection();
const casinoRegister = new Schema({
    lib: String,
    game: { type: String },
    bet: { type: Number },
    payout: { type: Number },
    win: { type: Boolean },
    timeStamp: { type: Date, default: Date.now() },
});
const CasinoModel = mongoose.model('Casino', casinoRegister);
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
export function NewMember(name, msg, group) {
    const doc = new Model({ name, points: 0, message: [msg], warnings: [], group: group });
    doc.save();
}
export async function SaveMessages(id, msg, group) {
    await Model.updateOne({ _id: id }, { $push: { message: msg }, $inc: { points: msg.content.split(/[^\w\s]+|\s+/).length, level: 1, 'bank.balance': msg.content.split(/[^\w\s]+|\s+/).length } });
}
export async function updatePoints(id, points) {
    await Model.updateOne({ _id: id }, { $inc: { points: points, level: points } });
}
export async function getMember(lib) {
    const doc = await Model.findOne({ lib: lib });
    if (doc)
        return doc;
}
export async function setMember(name, lib, msg, group) {
    const doc = await Model.create({ name, lib: lib, points: msg.content.split(/[^\w\s]+|\s+/).length, message: [msg], warnings: [], group: group });
}
export async function getTopMembers(from) {
    const members = await Model.find({ group: from }, { name: 1, points: 1, }).sort({ points: -1 });
    return members;
}
export async function getTopMembersLvl(from) {
    const members = await Model.find({ group: from }).sort({ level: -1 });
    return members;
}
export async function addWarn(id, warning) {
    await Model.updateOne({ _id: id }, { $push: { warnings: warning } });
}
export async function getWarnings(from) {
    const warnings = await Model.findOne({ lib: from }).select('warnings');
    return warnings;
}
export async function MemberWarnings(lib, action, props) {
    if (action === 'add') {
        await Model.updateOne({ lib: lib }, { $push: { warnings: props } });
        return;
    }
    if (action === 'remove') {
        console.log(props);
        const a = props;
        if (a.warn === 'all') {
            const warnings = await Model.updateOne({ lib: lib }, { $set: { warnings: [] } });
            return warnings;
        }
        if (typeof a.warn === 'number') {
            const user = await Model.findOne({ lib: lib }).select('warnings');
            if (!user || !user.warnings?.length)
                return;
            const index = a.warn;
            if (index < 0 || index >= user.warnings.length)
                return;
            user.warnings.splice(index, 1);
            await user.save();
            return;
        }
    }
    if (action === 'list') {
        const warnings = await Model.findOne({ lib: lib }).select('warnings');
        return warnings;
    }
}
export async function getAllMessages() {
    const messages = await Model.find({}).select('name message');
    const all = messages.flatMap(user => user.message.map(msg => ({
        name: user.name,
        content: msg.content,
        timeStamp: msg.timeStamp
    })));
    const sorted = all.sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp));
    return sorted
        .map(msg => `${msg.name}: ${msg.content}`)
        .join('\n');
}
export async function resetMessagesAndPoints() {
    await Model.updateMany({}, {
        $set: { message: [], points: 0 }
    });
}
export async function resetWarnings() {
    await Model.updateMany({}, {
        $set: { warnings: [] }
    });
}
export async function AddTransaction(lib, transaction) {
    await Model.updateOne({ lib: lib }, { $push: { bank: transaction } });
}
export async function getMemberBank(lib) {
    const user = await Model.findOne({ lib: lib }).select('bank');
    return user;
}
export async function getTopMoney() {
    const members = await Model.find({}).sort({ 'bank.balance': -1 }).select('bank name');
    return members;
}
export async function Transfer(senderLib, receiverLib, amount) {
    const sender = await Model.findOne({ lib: senderLib });
    const receiver = await Model.findOne({ lib: receiverLib });
    if (!sender || !receiver)
        return;
    if (amount <= 0)
        return;
    if (!sender.bank?.balance || sender.bank.balance < amount)
        return;
    sender.bank.balance -= amount;
    receiver.bank.balance += amount;
    await Promise.all([sender.save(), receiver.save()]);
}
export async function UpdateCooldown(lib, action, time) {
    await Model.updateOne({ lib: lib }, { $set: { [`cooldowns.${action}`]: Date.now() + time } });
}
export async function GetCooldown(lib, action) {
    const user = await Model.findOne({ lib: lib }).select('cooldowns');
    return user?.cooldowns?.[action] || null;
}
export async function DeleteCooldown(lib, action) {
    await Model.updateOne({ lib: lib }, { $unset: { [`cooldowns.${action}`]: "" } });
}
export async function AddBalance(lib, amount) {
    await Model.updateOne({ lib: lib }, { $inc: { 'bank.balance': amount } });
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
    });
}
export async function AddBone(amount) {
    await Model.updateMany({}, { $inc: { 'bank.balance': amount } });
}
export async function AddCasinoPlay(lib, game, bet) {
    const doc = new CasinoModel({ lib, game, bet, timeStamp: new Date() });
    await doc.save();
}
export async function AddCasinoResult(lib, game, bet, payout) {
    const doc = new CasinoModel({ lib, game, bet, payout, timeStamp: new Date() });
    await doc.save();
}
export async function GetCasinoStats() {
    const now = new Date();
    const panamaNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Panama' }));
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
export async function GetCasinoWins(lib) {
    const wins = await CasinoModel.find({ lib: lib, win: true }).select('game payout bet win timeStamp');
    return wins;
}
export async function GetCasinoLosses(lib) {
    const losses = await CasinoModel.find({ lib: lib, win: false }).select('game bet win timeStamp');
    return losses;
}
export async function UpdateBirthday(lib, date) {
    await Model.updateOne({ lib }, {
        $set: {
            birthday: {
                day: date.day,
                month: date.month
            }
        }
    });
}
export async function GetMemberBirthday(lib) {
    const user = await Model.findOne({ lib: lib }).select('birthday name');
    return user || null;
}
export async function GetAllBirthdays() {
    const users = await Model.find({}).select('birthday name').sort({ 'birthday.month': 1, 'birthday.day': 1 });
    return users;
}
export async function getBirthdaysToday() {
    const date = new Date();
    const panamaNow = new Date(date.toLocaleString('en-US', { timeZone: 'America/Panama' }));
    const month = panamaNow.getMonth() + 1;
    const day = panamaNow.getDate();
    const birthdays = await Model.find({ 'birthday.day': day, 'birthday.month': month }).select('birthday name lib group');
    console.log(birthdays);
    return birthdays;
}
