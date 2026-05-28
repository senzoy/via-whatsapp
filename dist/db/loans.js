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
export async function getPendingLoans(userId) {
    return LoanModel.find({ userId, status: 'pending' }).sort({ dueAt: 1 }).lean();
}
export async function getLoansTotalDue(userId) {
    const result = await LoanModel.aggregate([
        { $match: { userId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
    ]);
    return result[0]?.total ?? 0;
}
export async function payLoan(loanId) {
    await LoanModel.updateOne({ _id: loanId, status: 'pending' }, { $set: { remainingBalance: 0, status: 'paid', paidAt: new Date() } });
}
export async function reduceLoanBalance(loanId, amount) {
    const loan = await LoanModel.findOne({ _id: loanId });
    if (!loan)
        return null;
    const newBalance = Math.max(0, loan.remainingBalance - amount);
    if (newBalance <= 0) {
        await LoanModel.updateOne({ _id: loanId }, { $set: { remainingBalance: 0, status: 'paid', paidAt: new Date() } });
        return 0;
    }
    await LoanModel.updateOne({ _id: loanId }, { $set: { remainingBalance: newBalance } });
    return newBalance;
}
