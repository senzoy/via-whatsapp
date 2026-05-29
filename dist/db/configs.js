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
const ConfigsModel = mongoose.model('Configs', configsSchema);
ConfigsModel.createCollection();
let cachedAccountTypes = null;
export async function getAccountTypes() {
    if (cachedAccountTypes)
        return cachedAccountTypes;
    const doc = await ConfigsModel.findOne({ key: 'global' }).select('accountTypes');
    cachedAccountTypes = doc?.accountTypes ?? null;
    if (!cachedAccountTypes) {
        cachedAccountTypes = {
            basic: { maxBalance: 1_000_000, maxDeposit: 1_000_000, maxTransfer: 50_000, dailyWithdrawLimit: 100_000, minPoints: 0 },
            premium: { maxBalance: 10_000_000, maxDeposit: 10_000_000, maxTransfer: 500_000, dailyWithdrawLimit: 1_000_000, minPoints: 3000 },
            vip: { maxBalance: 50_000_000, maxDeposit: 50_000_000, maxTransfer: 2_500_000, dailyWithdrawLimit: 5_000_000, minPoints: 10000 },
            elite: { maxBalance: 100_000_000, maxDeposit: 100_000_000, maxTransfer: 10_000_000, dailyWithdrawLimit: 10_000_000, minPoints: 17000 },
            gold: { maxBalance: 25_000_000, maxDeposit: 25_000_000, maxTransfer: 1_000_000, dailyWithdrawLimit: 2_500_000, subscription: true },
            platinum: { maxBalance: 75_000_000, maxDeposit: 75_000_000, maxTransfer: 5_000_000, dailyWithdrawLimit: 7_500_000, subscription: true },
            diamond: { maxBalance: 200_000_000, maxDeposit: 200_000_000, maxTransfer: 15_000_000, dailyWithdrawLimit: 20_000_000, subscription: true },
        };
    }
    return cachedAccountTypes;
}
export function clearAccountTypesCache() {
    cachedAccountTypes = null;
}
export async function getAccountRank() {
    const types = await getAccountTypes();
    const rank = {};
    let i = 0;
    for (const type of Object.keys(types)) {
        rank[type] = i++;
    }
    return rank;
}
export async function getAccountLimits(level, currentType, subscriptionUntil) {
    const types = await getAccountTypes();
    // Check if user has an active subscription
    const hasValidSubscription = subscriptionUntil && Date.now() < new Date(subscriptionUntil).getTime();
    if (hasValidSubscription) {
        // If currentType is a subscription type, use it directly
        if (currentType && types[currentType]?.subscription) {
            const { minPoints: _, subscription: __, ...rest } = types[currentType];
            return { accountType: currentType, ...rest };
        }
        // Fallback: find the first subscription type with valid subscription
        for (const [type, config] of Object.entries(types)) {
            if (config.subscription) {
                const { minPoints: _, subscription: __, ...rest } = config;
                return { accountType: type, ...rest };
            }
        }
    }
    // Level-based matching (only types with minPoints)
    let matched = 'basic';
    let matchedConfig = types['basic'];
    for (const [type, config] of Object.entries(types)) {
        if (config.minPoints !== undefined && level >= config.minPoints) {
            matched = type;
            matchedConfig = config;
        }
    }
    const { minPoints: _, subscription: __, ...rest } = matchedConfig;
    return { accountType: matched, ...rest };
}
export async function addToBankFund(amount) {
    await ConfigsModel.updateOne({ key: 'global' }, { $inc: { bankFundBalance: amount } }, { upsert: true });
}
export async function getBankFundBalance() {
    const doc = await ConfigsModel.findOne({ key: 'global' }).select('bankFundBalance');
    return doc?.bankFundBalance ?? 0;
}
