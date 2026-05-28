import mongoose from "mongoose";
import dotenv from 'dotenv';
import { getAccountLimits as getConfigLimits } from "./configs.js";
dotenv.config();
mongoose.connect(process.env.DB || '');
const { Schema } = mongoose;
const transactionSchema = new Schema({
    type: { type: String, enum: ['deposit', 'withdraw'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    balanceAfter: { type: Number, required: true }
});
const bancoSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    accountType: { type: String, enum: ['basic', 'premium', 'vip', 'elite'], default: 'basic' },
    maxBalance: { type: Number, default: 1_000_000 },
    dailyWithdrawLimit: { type: Number, default: 100_000 },
    dailyWithdrawUsed: { type: Number, default: 0 },
    lastWithdrawReset: { type: Date, default: Date.now },
    yappyDailyUsed: { type: Number, default: 0 },
    yappyLastReset: { type: Date, default: Date.now },
    isFrozen: { type: Boolean, default: false },
    transactions: [transactionSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
bancoSchema.index({ userId: 1 });
const BancoModel = mongoose.model('Banco', bancoSchema);
BancoModel.createCollection();
export { BancoModel };
const ACCOUNT_RANK = { basic: 0, premium: 1, vip: 2, elite: 3 };
export async function checkAndResetYappyDaily(userId) {
    const account = await BancoModel.findOne({ userId });
    if (!account)
        return null;
    const now = new Date();
    const diff = now.getTime() - new Date(account.yappyLastReset).getTime();
    if (diff >= 24 * 60 * 60 * 1000) {
        account.yappyDailyUsed = 0;
        account.yappyLastReset = now;
        account.updatedAt = now;
        await account.save();
    }
    return account;
}
export async function getOrCreateBanco(userId, level = 0) {
    let account = await BancoModel.findOne({ userId });
    const limits = await getConfigLimits(level);
    if (!account) {
        account = await BancoModel.create({
            userId,
            balance: 0,
            ...limits,
            lastWithdrawReset: new Date(),
            transactions: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    else if (ACCOUNT_RANK[limits.accountType] > ACCOUNT_RANK[account.accountType]) {
        account.accountType = limits.accountType;
        account.maxBalance = limits.maxBalance;
        account.dailyWithdrawLimit = limits.dailyWithdrawLimit;
        account.updatedAt = new Date();
        await account.save();
    }
    return account;
}
export async function checkAndResetDaily(userId) {
    const account = await BancoModel.findOne({ userId });
    if (!account)
        return null;
    const now = new Date();
    const diff = now.getTime() - new Date(account.lastWithdrawReset).getTime();
    if (diff >= 24 * 60 * 60 * 1000) {
        account.dailyWithdrawUsed = 0;
        account.lastWithdrawReset = now;
        account.updatedAt = now;
        await account.save();
    }
    return account;
}
export async function resetAllDailyWithdraws() {
    await BancoModel.updateMany({}, {
        $set: {
            dailyWithdrawUsed: 0,
            lastWithdrawReset: new Date(),
            updatedAt: new Date()
        }
    });
}
export async function isFrozen(userId) {
    const account = await BancoModel.findOne({ userId }).select('isFrozen');
    return account?.isFrozen ?? false;
}
export async function setFrozen(userId, frozen) {
    await BancoModel.updateOne({ userId }, { $set: { isFrozen: frozen, updatedAt: new Date() } });
}
export async function resetAllDailyYappy() {
    await BancoModel.updateMany({}, {
        $set: {
            yappyDailyUsed: 0,
            yappyLastReset: new Date(),
            updatedAt: new Date()
        }
    });
}
