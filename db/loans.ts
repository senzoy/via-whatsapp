import mongoose from "mongoose";

const { Schema } = mongoose;

const loanSchema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  termDays: { type: Number, required: true },
  totalRepayment: { type: Number, required: true },
  remainingBalance: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  dueAt: { type: Date, required: true },
  notes: { type: String, default: '' },
  issuedAt: { type: Date, default: Date.now },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

loanSchema.index({ userId: 1, status: 1 });

const LoanModel = mongoose.model('Loan', loanSchema);
LoanModel.createCollection();

export interface LoanDoc {
  _id: string;
  userId: string;
  amount: number;
  interestRate: number;
  termDays: number;
  totalRepayment: number;
  remainingBalance: number;
  status: 'pending' | 'paid' | 'overdue';
  dueAt: Date;
  notes: string;
  issuedAt: Date;
  paidAt: Date | null;
}

export async function getPendingLoans(userId: string): Promise<any[]> {
  return LoanModel.find({ userId, remainingBalance: { $gt: 0 } }).sort({ dueAt: 1 }).lean();
}

export async function getLoansTotalDue(userId: string): Promise<number> {
  const result = await LoanModel.aggregate([
    { $match: { userId, remainingBalance: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
  ]);
  return result[0]?.total ?? 0;
}

export async function payLoan(loanId: string) {
  await LoanModel.updateOne(
    { _id: loanId },
    { $set: { remainingBalance: 0, status: 'paid', paidAt: new Date() } }
  );
}

export async function reduceLoanBalance(loanId: string, amount: number) {
  const loan = await LoanModel.findOne({ _id: loanId });
  if (!loan) return null;
  const newBalance = Math.max(0, loan.remainingBalance - amount);
  if (newBalance <= 0) {
    await LoanModel.updateOne(
      { _id: loanId },
      { $set: { remainingBalance: 0, status: 'paid', paidAt: new Date() } }
    );
    return 0;
  }
  await LoanModel.updateOne(
    { _id: loanId },
    { $set: { remainingBalance: newBalance } }
  );
  return newBalance;
}
