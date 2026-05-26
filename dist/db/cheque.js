import mongoose from "mongoose";
const { Schema } = mongoose;
const chequeSchema = new Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    amount: { type: Number, required: true },
    jid: { type: String, required: true },
    completesAt: { type: Date, required: true },
    processed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
chequeSchema.index({ completesAt: 1, processed: 1 });
const ChequeModel = mongoose.model('Cheque', chequeSchema);
ChequeModel.createCollection();
export async function createCheque(data) {
    return ChequeModel.create(data);
}
export async function getPendingCheques() {
    return ChequeModel.find({ processed: false, completesAt: { $lte: new Date(Date.now() + 15 * 60 * 1000) } }).lean();
}
export async function completeCheque(id) {
    await ChequeModel.updateOne({ _id: id }, { $set: { processed: true } });
}
export async function getAllUnprocessedCheques() {
    return ChequeModel.find({ processed: false }).lean();
}
