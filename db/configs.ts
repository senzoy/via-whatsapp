import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.DB || '');
const { Schema } = mongoose;

const configsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  bankFundBalance: { type: Number, default: 0 },
  accountTypes: { type: Schema.Types.Mixed },
}, { strict: false });

configsSchema.index({ key: 1 });

export interface AccountTypeConfig {
  maxBalance: number;
  dailyWithdrawLimit: number;
  yappyLimit: number;
  chequeLimit: number;
  minLevel?: number;
  subscription?: boolean;
}

const ConfigsModel = mongoose.model('Configs', configsSchema);
ConfigsModel.createCollection();

let cachedAccountTypes: Record<string, AccountTypeConfig> | null = null;

export async function getAccountTypes(): Promise<Record<string, AccountTypeConfig>> {
  if (cachedAccountTypes) return cachedAccountTypes;
  const doc = await ConfigsModel.findOne({ key: 'global' }).select('accountTypes');
  cachedAccountTypes = (doc?.accountTypes as Record<string, AccountTypeConfig>) ?? null;
  if (!cachedAccountTypes) {
    cachedAccountTypes = {
      basic: { maxBalance: 1_000_000, dailyWithdrawLimit: 100_000, yappyLimit: 50_000, chequeLimit: 1_000_000, minLevel: 0 },
      premium: { maxBalance: 10_000_000, dailyWithdrawLimit: 1_000_000, yappyLimit: 500_000, chequeLimit: 10_000_000, minLevel: 3000 },
      vip: { maxBalance: 50_000_000, dailyWithdrawLimit: 5_000_000, yappyLimit: 2_500_000, chequeLimit: 50_000_000, minLevel: 10000 },
      elite: { maxBalance: 100_000_000, dailyWithdrawLimit: 10_000_000, yappyLimit: 10_000_000, chequeLimit: 100_000_000, minLevel: 17000 },
      gold: { maxBalance: 25_000_000, dailyWithdrawLimit: 2_500_000, yappyLimit: 1_000_000, chequeLimit: 25_000_000, subscription: true },
      platinum: { maxBalance: 75_000_000, dailyWithdrawLimit: 7_500_000, yappyLimit: 5_000_000, chequeLimit: 75_000_000, subscription: true },
      diamond: { maxBalance: 200_000_000, dailyWithdrawLimit: 20_000_000, yappyLimit: 15_000_000, chequeLimit: 200_000_000, subscription: true },
    };
  }
  return cachedAccountTypes;
}

export function clearAccountTypesCache() {
  cachedAccountTypes = null;
}

export async function getAccountLimits(
  level: number,
  currentType?: string,
  subscriptionUntil?: Date | null
): Promise<{ accountType: string; maxBalance: number; dailyWithdrawLimit: number; yappyLimit: number; chequeLimit: number }> {
  const types = await getAccountTypes();

  // Check if user has an active subscription type
  if (currentType && types[currentType]?.subscription && subscriptionUntil && Date.now() < new Date(subscriptionUntil).getTime()) {
    const { minLevel: _, subscription: __, ...rest } = types[currentType]!;
    return { accountType: currentType, ...rest };
  }

  // Level-based matching (only types with minLevel)
  let matched = 'basic';
  let matchedConfig = types['basic'];
  for (const [type, config] of Object.entries(types)) {
    if (config.minLevel !== undefined && level >= config.minLevel) {
      matched = type;
      matchedConfig = config;
    }
  }
  const { minLevel: _, subscription: __, ...rest } = matchedConfig!;
  return { accountType: matched, ...rest };
}

export async function addToBankFund(amount: number) {
  await ConfigsModel.updateOne(
    { key: 'global' },
    { $inc: { bankFundBalance: amount } },
    { upsert: true }
  );
}

export async function getBankFundBalance(): Promise<number> {
  const doc = await ConfigsModel.findOne({ key: 'global' }).select('bankFundBalance');
  return doc?.bankFundBalance ?? 0;
}
