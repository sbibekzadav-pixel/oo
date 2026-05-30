import { buildAppKnowledge, matchServicesInText, ORDERME_SCOPE_REPLY } from './appKnowledge';
import { nvidiaChatCompletion, isNvidiaAiConfigured } from './nvidiaChat';
import { getChatbotReply } from './chatbotEngine';

const OFF_TOPIC =
  /\b(joke|poem|essay|homework|python|javascript|code|bitcoin|stock|politics|president|weather forecast|recipe unrelated|movie|game cheat)\b/i;

const CALL_INTENT = /\b(call|phone|dial|contact|number|reach)\b/i;

function buildFocusNote(focusService, focusProvider) {
  if (focusService) {
    return `User is viewing service "${focusService.title}" (id ${focusService.id}, ${focusService.categoryLabel}).`;
  }
  if (focusProvider) {
    return `User is viewing provider "${focusProvider.name}" (id ${focusProvider.id}), phone ${focusProvider.phone}.`;
  }
  return '';
}

function defaultSuggestions() {
  return ['All services', 'Cleaning prices', 'Call plumber', 'Best rated'];
}

function enrichReply(text, ctx) {
  const { services, getProvider } = ctx;
  let serviceCards = matchServicesInText(text, services, getProvider, 4);

  const actions = [];
  if (CALL_INTENT.test(text)) {
    const card = serviceCards[0];
    const provider = card?.provider;
    if (provider?.phone) {
      actions.push({
        type: 'call',
        label: 'Call Now',
        provider,
        service: card?.service,
      });
      actions.push({
        type: 'message',
        label: 'Message',
        provider,
        service: card?.service,
      });
    }
  }

  if (!serviceCards.length) {
    const fuzzy = getChatbotReply(text, ctx);
    if (fuzzy.serviceCards?.length) serviceCards = fuzzy.serviceCards;
  }

  return {
    text,
    serviceCards,
    suggestions: defaultSuggestions(),
    actions,
  };
}

/**
 * @param {string} userText
 * @param {object} ctx - catalog + getProvider + focusService + focusProvider + userName
 * @param {{ role: string, text: string }[]} chatHistory
 */
export async function getAssistantReply(userText, ctx, chatHistory = []) {
  const trimmed = (userText || '').trim();
  if (!trimmed) {
    return { text: 'Please type a message or tap a suggestion below.' };
  }

  if (OFF_TOPIC.test(trimmed) && !/\b(clean|plumb|electric|service|orderme|nepal|rs)\b/i.test(trimmed)) {
    return {
      text: ORDERME_SCOPE_REPLY,
      suggestions: defaultSuggestions(),
    };
  }

  if (CALL_INTENT.test(trimmed)) {
    const rule = getChatbotReply(trimmed, ctx);
    if (rule.actions?.length) return rule;
  }

  if (!isNvidiaAiConfigured()) {
    return getChatbotReply(trimmed, ctx);
  }

  try {
    const knowledge = buildAppKnowledge(ctx);
    const history = chatHistory
      .filter((m) => m.text && (m.role === 'user' || m.role === 'bot'))
      .slice(-12)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    const aiText = await nvidiaChatCompletion({
      userMessage: trimmed,
      knowledge,
      history,
      focusNote: buildFocusNote(ctx.focusService, ctx.focusProvider),
    });

    return enrichReply(aiText, ctx);
  } catch (e) {
    console.warn('OrderMe assistant fallback:', e?.message);
    return getChatbotReply(trimmed, ctx);
  }
}

export { isNvidiaAiConfigured };
