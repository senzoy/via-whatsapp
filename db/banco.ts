import mongoose from "mongoose";
import dotenv from 'dotenv';
import { getAccountLimits as getConfigLimits, getAccountRank } from "./configs.js";

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
  accountType: { type: String, default: 'basic' },
  subscriptionUntil: { type: Date, default: null },
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

export async function checkAndResetYappyDaily(userId: string) {
  const account = await BancoModel.findOne({ userId });
  if (!account) return null;
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

export async function getOrCreateBanco(userId: string, level: number = 0) {
  let account = await BancoModel.findOne({ userId });
  const limits = await getConfigLimits(level, account?.accountType, account?.subscriptionUntil);

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
  } else {
    const rank = await getAccountRank();
    const newRank = rank[limits.accountType] ?? -1;
    const currentRank = rank[account.accountType] ?? -1;
    if (
      limits.accountType !== account.accountType
        ? newRank > currentRank
        : limits.maxBalance !== account.maxBalance || limits.dailyWithdrawLimit !== account.dailyWithdrawLimit
    ) {
      account.accountType = limits.accountType;
      account.maxBalance = limits.maxBalance;
      account.dailyWithdrawLimit = limits.dailyWithdrawLimit;
      account.updatedAt = new Date();
      await account.save();
    }
  }

  return account;
}

export async function checkAndResetDaily(userId: string) {
  const account = await BancoModel.findOne({ userId });
  if (!account) return null;

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

export async function isFrozen(userId: string): Promise<boolean> {
  const account = await BancoModel.findOne({ userId }).select('isFrozen');
  return account?.isFrozen ?? false;
}

export async function setFrozen(userId: string, frozen: boolean) {
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
