import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.DB || '');
const { Schema } = mongoose;

const configsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  bankFundBalance: { type: Number, default: 0 },
});

configsSchema.index({ key: 1 });

const ConfigsModel = mongoose.model('Configs', configsSchema);
ConfigsModel.createCollection();

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
