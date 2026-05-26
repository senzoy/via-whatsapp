import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.DB || '');
const { Schema } = mongoose;

const criminalSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  criminalPoints: { type: Number, default: 0 },
  robCooldownUntil: { type: Date, default: null },
  workPenaltyUntil: { type: Date, default: null },
  interactionPenaltyUntil: { type: Date, default: null },
  totalRobs: { type: Number, default: 0 },
  failedRobs: { type: Number, default: 0 },
  successfulRobs: { type: Number, default: 0 },
  outstandingFine: { type: Number, default: 0 },
  fineDeadline: { type: Date, default: null },
  bankYappyBlockUntil: { type: Date, default: null },
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
  await CriminalModel.updateOne(
    { userId },
    {
      $inc: { outstandingFine: amount },
      $set: { fineDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    }
  );
}

export async function reduceOutstandingFine(userId: string, amount: number) {
  const crim = await CriminalModel.findOne({ userId }).select('outstandingFine fineDeadline');
  const current = crim?.outstandingFine ?? 0;
  const newFine = Math.max(0, current - amount);

  if (newFine === 0) {
    await CriminalModel.updateOne(
      { userId },
      { $set: { outstandingFine: 0, fineDeadline: null } }
    );
  } else {
    await CriminalModel.updateOne(
      { userId },
      { $inc: { outstandingFine: -amount } }
    );
  }
}

export async function payFineFromWalletThenBank(userId: string, amount: number): Promise<{ paidFromWallet: number; paidFromBank: number; remaining: number }> {
  const { getMember, AddBalance } = await import("./mongodb.js");
  const { BancoModel } = await import("./banco.js");

  const member = await getMember(userId);
  const walletBalance = member?.bank?.balance ?? 0;

  let remaining = amount;
  let paidFromWallet = 0;
  let paidFromBank = 0;

  if (walletBalance > 0) {
    paidFromWallet = Math.min(walletBalance, remaining);
    await AddBalance(userId, -paidFromWallet);
    remaining -= paidFromWallet;
  }

  if (remaining > 0) {
    const bancoDoc = await BancoModel.findOne({ userId }).select('balance');
    const bankBalance = bancoDoc?.balance ?? 0;
    if (bankBalance > 0) {
      paidFromBank = Math.min(bankBalance, remaining);
      await BancoModel.updateOne({ userId }, { $inc: { balance: -paidFromBank } });
      remaining -= paidFromBank;
    }
  }

  return { paidFromWallet, paidFromBank, remaining };
}

export async function checkAndGetPenaltyStatus(userId: string): Promise<{ blocked: boolean; message: string }> {
  const crim = await CriminalModel.findOne({ userId }).select('outstandingFine fineDeadline interactionPenaltyUntil');
  if (!crim) return { blocked: false, message: '' };

  // Currently under penalty
  if (crim.interactionPenaltyUntil && Date.now() < new Date(crim.interactionPenaltyUntil).getTime()) {
    const remaining = Math.ceil((new Date(crim.interactionPenaltyUntil).getTime() - Date.now()) / 1000);
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    return {
      blocked: true,
      message: `🔒 Tienes una penalización activa por no pagar tus multas a tiempo.\n⏳ ${days}d ${hours}h restantes.\n💰 Multa pendiente: $${crim.outstandingFine.toLocaleString('en-US')}`
    };
  }

  // Just expired — apply penalty now
  if (crim.outstandingFine > 0 && crim.fineDeadline && Date.now() > new Date(crim.fineDeadline).getTime()) {
    const penaltyEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await CriminalModel.updateOne(
      { userId },
      { $set: { interactionPenaltyUntil: penaltyEnd } }
    );
    return {
      blocked: true,
      message: `🔒 No pagaste tu multa a tiempo. Has sido penalizado por 3 días.\n💰 Multa pendiente: $${crim.outstandingFine.toLocaleString('en-US')}`
    };
  }

  return { blocked: false, message: '' };
}

export async function clearInteractionPenalty(userId: string) {
  await CriminalModel.updateOne(
    { userId },
    { $set: { interactionPenaltyUntil: null } }
  );
}

export async function setOutstandingFine(userId: string, amount: number) {
  if (amount <= 0) {
    await CriminalModel.updateOne(
      { userId },
      { $set: { outstandingFine: 0, fineDeadline: null } }
    );
  } else {
    await CriminalModel.updateOne(
      { userId },
      { $set: { outstandingFine: amount } }
    );
  }
}

export async function setBankYappyBlock(userId: string, durationMs: number) {
  await CriminalModel.updateOne(
    { userId },
    { $set: { bankYappyBlockUntil: new Date(Date.now() + durationMs) } }
  );
}

export async function isBankYappyBlocked(userId: string): Promise<boolean> {
  const crim = await CriminalModel.findOne({ userId }).select('bankYappyBlockUntil');
  if (!crim?.bankYappyBlockUntil) return false;
  if (Date.now() < new Date(crim.bankYappyBlockUntil).getTime()) return true;
  await CriminalModel.updateOne(
    { userId },
    { $set: { bankYappyBlockUntil: null } }
  );
  return false;
}


