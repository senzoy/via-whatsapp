import mongoose, { model, Types } from "mongoose";
import dotenv from 'dotenv';

dotenv.config()


mongoose.connect(process.env.DB || '')
const { Schema } = mongoose

const verify = new Schema({
    discord: {
        id: String,
        tag: String,
        auth: {
            accessToken: String,
        },
        expires: Date,
        authenticated: Boolean
    }
})

const VerifyModel = mongoose.model('Verify', verify)

export async function setVerified(token: string) {
    await VerifyModel.updateOne({ 'discord.auth.accessToken': token }, { $set: { 'discord.authenticated': true } })
    return
}

export async function getVerifyUser(token: string) {
    return await VerifyModel.findOne({ 'discord.auth.accessToken': token })
}

