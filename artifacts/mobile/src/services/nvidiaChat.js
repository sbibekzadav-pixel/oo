const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 45000;

const ASSISTANT_PRIMER = `You are Priya, the friendly support coordinator at OrderMe — Nepal's trusted home services platform based in Kathmandu.

Speak like a real person who genuinely cares. Be warm, direct, and occasionally use natural Nepali phrases ("Hajur", "Dai", "Didi", "Namaste") when it feels right — but never force it. Don't start answers with "Based on the catalog" or "As an AI" — just answer like a helpful colleague.

What you can help with: home cleaning, plumbing, electrical, AC repair, beauty, carpentry, transport, and other OrderMe services in Nepal. Always use real provider names, prices, and phone numbers from the catalog below — never invent details.

If someone asks something off-topic (coding, jokes, politics), simply say "I can only help with home services for now — want me to find you a plumber, cleaner, or electrician?" and move on.

Reply in whichever language the user writes in (English or Nepali). Keep answers short and useful — under 120 words unless giving a detailed list. Never say you are an AI, a chatbot, or mention NVIDIA/OpenAI.`;

export function isNvidiaAiConfigured() {
  return Boolean(process.env.EXPO_PUBLIC_NVIDIA_API_KEY?.trim());
}

export function getNvidiaModel() {
  return process.env.EXPO_PUBLIC_NVIDIA_MODEL?.trim() || DEFAULT_MODEL;
}

/**
 * @param {{ userMessage: string, knowledge: string, history?: {role:'user'|'assistant',content:string}[], focusNote?: string }} params
 */
export async function nvidiaChatCompletion({ userMessage, knowledge, history = [], focusNote = '' }) {
  const apiKey = process.env.EXPO_PUBLIC_NVIDIA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('NVIDIA API key is not configured. Add EXPO_PUBLIC_NVIDIA_API_KEY to .env');
  }

  const catalogBlock = `${ASSISTANT_PRIMER}\n\n${knowledge}${focusNote ? `\n\nFOCUS: ${focusNote}` : ''}`;

  const messages = [
    {
      role: 'user',
      content: `${catalogBlock}\n\n(Acknowledge you will only answer about OrderMe services using the catalog above.)`,
    },
    {
      role: 'assistant',
      content:
        'Namaste! Happy to help. I can look up cleaning, plumbing, electrical, AC repair, beauty — anything from our services here in Nepal. What do you need today?',
    },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getNvidiaModel(),
        messages,
        temperature: 0.65,
        top_p: 0.92,
        max_tokens: 512,
        stream: false,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error?.message || data?.detail || `NVIDIA API error ${res.status}`;
      throw new Error(msg);
    }

    const message = data?.choices?.[0]?.message || {};
    let text = (message.content || '').trim();
    if (!text && message.reasoning) {
      const lastLine = String(message.reasoning).trim().split('\n').pop();
      if (lastLine.length < 400) text = lastLine.replace(/^.*?:\s*"/, '').replace(/"\s*\.?$/, '');
    }
    if (!text) throw new Error('Empty response from NVIDIA API');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
