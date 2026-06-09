import { downloadMediaMessage } from 'baileys';
import type { WAMessage } from 'baileys';
import * as fs from 'fs/promises';
import * as path from 'path';
import P from 'pino';
import { saveImageRecord } from '../db/images.js';

const MEDIA_DIR = path.join(process.cwd(), 'media', 'images');

async function ensureDir() {
  try {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating media directory', err);
  }
}

export async function handleIncomingImage(lib: string, msg: WAMessage) {
  try {
    await ensureDir();
    
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      { },
      { logger: P({ level: 'silent' }) as any }
    );

    if (Buffer.isBuffer(buffer)) {
      const filename = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
      const filepath = path.join(MEDIA_DIR, filename);

      await fs.writeFile(filepath, buffer);
      await saveImageRecord(lib, filename, filepath);
      
      console.log(`📸 Imagen guardada: ${filename} de ${lib}`);
    }
  } catch (error) {
    console.error('Error handling incoming image:', error);
  }
}
