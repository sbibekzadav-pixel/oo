import { nvidiaChatCompletion, isNvidiaAiConfigured } from './nvidiaChat';

const NEPALESE_SERVICE_MAP = [
  { keywords: ['clean', 'cleaning', 'safa', 'puchne', 'room', 'kotha', 'toilet', 'ghar'], corrected: 'Cleaning' },
  { keywords: ['plumb', 'plumber', 'pipe', 'tap', 'dhara', 'pani', 'leak', 'toilet pipe'], corrected: 'Plumbing' },
  { keywords: ['electr', 'light', 'fan', 'switch', 'wire', 'line', 'short', 'current', 'batti'], corrected: 'Electrical' },
  { keywords: ['paint', 'color', 'painting', 'rang', 'wall', 'kotha rangne'], corrected: 'Painting' },
  { keywords: ['carpenter', 'wood', 'furniture', 'daraj', 'table', 'kath'], corrected: 'Carpentry' },
  { keywords: ['ac', 'fridge', 'refrigerator', 'cooling', 'cooling fan', 'air condition'], corrected: 'AC & Appliance Repair' },
  { keywords: ['salon', 'hair', 'makeup', 'beauty', 'massage', 'facial', 'shringar'], corrected: 'Beauty & Salon' },
  { keywords: ['computer', 'laptop', 'wifi', 'router', 'internet', 'hardware'], corrected: 'IT & Device Support' },
];

/**
 * Perform local keyword mapping fallback.
 * @param {string} rawText 
 * @returns {string}
 */
export function localCorrectVoiceQuery(rawText) {
  const query = (rawText || '').toLowerCase().trim();
  if (!query) return '';

  for (const item of NEPALESE_SERVICE_MAP) {
    for (const kw of item.keywords) {
      if (query.includes(kw)) {
        return item.corrected;
      }
    }
  }

  // Capitalize first letter of each word as default fallback
  return query
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Correct spoken query using NVIDIA LLM or local fallback.
 * @param {string} rawText 
 * @returns {Promise<string>}
 */
export async function aiCorrectVoiceQuery(rawText) {
  const trimmed = (rawText || '').trim();
  if (!trimmed) return '';

  if (!isNvidiaAiConfigured()) {
    return localCorrectVoiceQuery(trimmed);
  }

  const prompt = `You are a Speech Correction AI for OrderMe (Home Services App in Nepal).
The user spoke a search query: "${trimmed}".
Because of speech recognition errors, phonetic spelling, or Romanized Nepali/English mix, the words might be slightly incorrect.
Identify the home service category or search term they intended (e.g. plumbing, cleaning, painting, electrician, appliance repair, beauty).
Return ONLY the corrected, clean search query (proper English, max 3 words). Do not include any explanations, greetings, or punctuation.

Example inputs and outputs:
- "need a plamber" -> "Plumbing"
- "room safa garne" -> "Cleaning"
- "ghar painting" -> "Painting"
- "ac bigryo" -> "AC Repair"
- "light short bhayo" -> "Electrician"
- "daraj mirmari" -> "Carpentry"
- "hair cut at home" -> "Beauty & Salon"

Input: "${trimmed}"
Output:`;

  try {
    const aiResponse = await nvidiaChatCompletion({
      userMessage: prompt,
      knowledge: 'Official Categories: Cleaning, Plumbing, Electrical, Painting, Carpentry, AC & Appliance Repair, Beauty & Salon, IT & Device Support.',
      history: [],
      focusNote: 'Task: Correct voice input transcript'
    });

    const cleanResult = aiResponse.replace(/["'‘’. Output:]/g, '').trim();
    return cleanResult || localCorrectVoiceQuery(trimmed);
  } catch (e) {
    console.warn('Voice query AI correction failed, using local corrector:', e?.message);
    return localCorrectVoiceQuery(trimmed);
  }
}
