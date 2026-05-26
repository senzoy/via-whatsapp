import mongoose from "mongoose";
import dotenv from 'dotenv';
import { getMember, getMemberBank } from "./mongodb.js";

dotenv.config();

mongoose.connect(process.env.DB || '');
const { Schema } = mongoose;

const criminalSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  criminalPoints: { type: Number, default: 0 },
  robCooldownUntil: { type: Date, default: null },
  workPenaltyUntil: { type: Date, default: null },
  totalRobs: { type: Number, default: 0 },
  failedRobs: { type: Number, default: 0 },
  successfulRobs: { type: Number, default: 0 },
  outstandingFine: { type: Number, default: 0 }, // multas pendientes
});

criminalSchema.index({ userId: 1 });

const CriminalModel = mongoose.model('Criminal', criminalSchema);
CriminalModel.createCollection();

export async function getOrCreateCriminal(userId: string) {
  let record = await CriminalModel.findOne({ userId });
  if (!record) {
    record = await CriminalModel.create({ userId });
  }
  return record;
}

export async function addCriminalPoints(userId: string, points: number) {
  await CriminalModel.updateOne({ userId }, { $inc: { criminalPoints: points } });
}

export async function setRobCooldown(userId: string, durationMs: number) {
  await CriminalModel.updateOne(
    { userId },
    { $set: { robCooldownUntil: new Date(Date.now() + durationMs) } }
  );
}

export async function setWorkPenalty(userId: string, durationMs: number) {
  await CriminalModel.updateOne(
    { userId },
    { $set: { workPenaltyUntil: new Date(Date.now() + durationMs) } }
  );
}

export async function incrementRobStats(userId: string, success: boolean) {
  const inc: Record<string, number> = { totalRobs: 1 };
  if (success) {
    inc.successfulRobs = 1;
  } else {
    inc.failedRobs = 1;
  }
  await CriminalModel.updateOne({ userId }, { $inc: inc });
}

export async function getOutstandingFine(userId: string): Promise<number> {
  const crim = await CriminalModel.findOne({ userId }).select('outstandingFine');
  return crim?.outstandingFine ?? 0;
}

export async function addOutstandingFine(userId: string, amount: number) {
  await CriminalModel.updateOne({ userId }, { $inc: { outstandingFine: amount } });
}

export async function reduceOutstandingFine(userId: string, amount: number) {
  await CriminalModel.updateOne(
    { userId },
    { $inc: { outstandingFine: -amount } }
  );
}

export async function payFineFromWalletThenBank(userId: string, amountToPay: number): Promise<{ paidFromWallet: number; paidFromBank: number; remaining: number }> {
  // Import inside function to prevent circular deps
  const { getMember, getMemberBank } = await import("./mongodb.js");
  const { BancoModel } = await import("./banco.js");

  const member = await getMember(userId);
  const walletBalance = member?.bank?.balance ?? 0;
  
  const bancoRecord = await getMemberBank(userId);
  const bankBalance = bancoRecord?.bank?.balance ?? 0;

  let paidFromWallet = 0;
  let paidFromBank = 0;
  let remaining = amountToPay;

  // Pay from wallet first
  if (walletBalance > 0) {
    paidFromWallet = Math.min(walletBalance, amountToPay);
    await addOutstandingFine(userId, -paidFromWallet); // reduce outstanding fine
    remaining -= paidFromWallet;
  }

  // Pay from bank if still needed
  if (remaining > 0 && bankBalance > 0) {
    paidFromBank = Math.min(bankBalance, remaining);
    // Deduct from banco balance
    await BancoModel.updateOne(
      { userId: userId },
      { $inc: { balance: -paidFromBank } }
    );
    
    remaining -= paidFromBank;
  }
  
  // If still remaining, it stays as outstanding fine (debt)
  return { paidFromWallet, paidFromBank, remaining };
}
