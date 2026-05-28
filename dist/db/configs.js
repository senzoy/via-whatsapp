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
            basic: { maxBalance: 1_000_000, dailyWithdrawLimit: 100_000, yappyLimit: 50_000, chequeLimit: 1_000_000, minLevel: 0 },
            premium: { maxBalance: 10_000_000, dailyWithdrawLimit: 1_000_000, yappyLimit: 500_000, chequeLimit: 10_000_000, minLevel: 3000 },
            vip: { maxBalance: 50_000_000, dailyWithdrawLimit: 5_000_000, yappyLimit: 2_500_000, chequeLimit: 50_000_000, minLevel: 10000 },
            elite: { maxBalance: 100_000_000, dailyWithdrawLimit: 10_000_000, yappyLimit: 10_000_000, chequeLimit: 100_000_000, minLevel: 17000 },
        };
    }
    return cachedAccountTypes;
}
export function clearAccountTypesCache() {
    cachedAccountTypes = null;
}
export async function getAccountLimits(level) {
    const types = await getAccountTypes();
    let matched = 'basic';
    let matchedConfig = types['basic'];
    for (const [type, config] of Object.entries(types)) {
        if (level >= config.minLevel) {
            matched = type;
            matchedConfig = config;
        }
    }
    const { minLevel: _, ...rest } = matchedConfig;
    return { accountType: matched, ...rest };
}
export async function addToBankFund(amount) {
    await ConfigsModel.updateOne({ key: 'global' }, { $inc: { bankFundBalance: amount } }, { upsert: true });
}
export async function getBankFundBalance() {
    const doc = await ConfigsModel.findOne({ key: 'global' }).select('bankFundBalance');
    return doc?.bankFundBalance ?? 0;
}
