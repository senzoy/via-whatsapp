import { saveTypedMessage } from '../db/typedMessages.js';

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function analyzeAndSaveMessage(lib: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const firstWordMatch = trimmed.match(/^(\S+)/);
  if (!firstWordMatch || !firstWordMatch[1]) return;

  const firstWord = firstWordMatch[1] as string;
  const normalizedFirstWord = normalizeText(firstWord);

  let type: string | null = null;
  let remainingText = trimmed;

  if (normalizedFirstWord === 'analisis' || trimmed.startsWith('#')) {
    type = 'Análisis';
    if (trimmed.startsWith('#')) {
      remainingText = trimmed.substring(1).trim();
    } else {
      remainingText = trimmed.substring(firstWord.length).trim();
    }
  } 
  else if (normalizedFirstWord === 'pregunta' || trimmed.startsWith('?')) {
    type = 'Pregunta';
    if (trimmed.startsWith('?')) {
      remainingText = trimmed.substring(1).trim();
    } else {
      remainingText = trimmed.substring(firstWord.length).trim();
    }
  } 
  else if (normalizedFirstWord === 'pick' || trimmed.startsWith('$')) {
    type = 'Pick';
    if (trimmed.startsWith('$')) {
      remainingText = trimmed.substring(1).trim();
    } else {
      remainingText = trimmed.substring(firstWord.length).trim();
    }
  }

  if (type && remainingText.length > 0) {
    try {
      await saveTypedMessage(lib, type, remainingText);
    } catch (e) {
      console.error("Error saving typed message:", e);
    }
  }
}
