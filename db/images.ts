import mongoose, { model, Schema } from "mongoose";

const imageRecordSchema = new Schema({
  lib: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  timeStamp: { type: Date, default: Date.now }
});

const ImageRecordModel = model('ImageRecord', imageRecordSchema);

export async function saveImageRecord(lib: string, filename: string, path: string) {
  const doc = new ImageRecordModel({ lib, filename, path });
  await doc.save();
  return doc;
}

export async function getImagesByLib(lib: string) {
  return await ImageRecordModel.find({ lib }).sort({ timeStamp: -1 });
}
