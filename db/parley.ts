import mongoose from "mongoose";

const PARLEY_URI = 'mongodb+srv://knightz0e507_db_user:vrArsyEN0UwrvMYp@cluster0.njpyemd.mongodb.net/warzone-parleys';

const parleyConn = mongoose.createConnection(PARLEY_URI);

const ticketSchema = new mongoose.Schema({}, { strict: false, collection: 'bets' });

const TicketModel = parleyConn.model('Ticket', ticketSchema);

export async function findTicketByCode(code: string) {
  return TicketModel.findOne({ ticketCode: code.toUpperCase() });
}

export async function linkTicketToUser(ticketId: string, lib: string) {
  return TicketModel.updateOne(
    { _id: ticketId },
    { $set: { userLib: lib, wagerPaidAt: new Date() } }
  );
}
