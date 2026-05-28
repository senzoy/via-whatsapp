import mongoose from "mongoose";
import dotenv from 'dotenv';

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

type AccountType = 'basic' | 'premium' | 'vip' | 'elite';

interface AccountLimits {
  accountType: AccountType;
  maxBalance: number;
  dailyWithdrawLimit: number;
  yappyLimit: number;
  chequeLimit: number;
}

export function getAccountLimits(level: number): AccountLimits {
  if (level >= 17000) return { accountType: 'elite', maxBalance: 100_000_000, dailyWithdrawLimit: 10_000_000, yappyLimit: 10_000_000, chequeLimit: 100_000_000 };
  if (level >= 10000) return { accountType: 'vip', maxBalance: 50_000_000, dailyWithdrawLimit: 5_000_000, yappyLimit: 2_500_000, chequeLimit: 50_000_000 };
  if (level >= 3000) return { accountType: 'premium', maxBalance: 10_000_000, dailyWithdrawLimit: 1_000_000, yappyLimit: 500_000, chequeLimit: 10_000_000 };
  return { accountType: 'basic', maxBalance: 1_000_000, dailyWithdrawLimit: 100_000, yappyLimit: 50_000, chequeLimit: 1_000_000 };
}

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
  const limits = getAccountLimits(level);

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
  } else if (account.accountType !== limits.accountType) {
    account.accountType = limits.accountType as any;
    account.maxBalance = limits.maxBalance;
    account.dailyWithdrawLimit = limits.dailyWithdrawLimit;
    account.updatedAt = new Date();
    await account.save();
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
