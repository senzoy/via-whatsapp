import mongoose, { model, Schema } from "mongoose";

const typedMessageSchema = new Schema({
  lib: { type: String, required: true },
  type: { type: String, required: true }, // 'Análisis', 'Pregunta', 'Pick'
  content: { type: String, required: true },
  timeStamp: { type: Date, default: Date.now }
});

const TypedMessageModel = model('TypedMessage', typedMessageSchema);

export async function saveTypedMessage(lib: string, type: string, content: string) {
  const doc = new TypedMessageModel({ lib, type, content });
  await doc.save();
  return doc;
}

export async function getTypedMessagesByLib(lib: string) {
  return await TypedMessageModel.find({ lib }).sort({ timeStamp: -1 });
}

export async function getTypedMessagesByType(type: string) {
  return await TypedMessageModel.find({ type }).sort({ timeStamp: -1 });
}

export async function getAllTypedMessages() {
  return await TypedMessageModel.find().sort({ timeStamp: -1 });
}
