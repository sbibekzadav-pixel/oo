const GREETINGS = /^(hi|hello|hey|namaste|help|start|good\s*(morning|evening|afternoon))$/i;
const THANKS = /thank|dhanyabad/i;
const CALL_INTENT = /\b(call|phone|dial|contact|number|reach)\b/i;
const PRICE_INTENT = /\b(price|cost|rate|charge|how much|fee|package|rs\.?|rupee)\b/i;
const LIST_INTENT = /\b(services?|offer|available|what do you|list|show me|catalog)\b/i;
const RATING_INTENT = /\b(rating|review|star|trusted|reliable)\b/i;
const LOCATION_INTENT = /\b(location|where|city|area|kathmandu|nepal|near)\b/i;
const DURATION_INTENT = /\b(duration|time|hours?|long|take)\b/i;
const DISCOUNT_INTENT = /\b(discount|off|deal|offer|cheap|save)\b/i;

const CATEGORY_ALIASES = {
  cleaning: ['clean', 'cleaning', 'maid', 'deep clean'],
  plumbing: ['plumb', 'plumber', 'pipe', 'leak', 'water'],
  electrical: ['electric', 'electrician', 'wiring', 'power'],
  carpentry: ['carpenter', 'wood', 'furniture', 'carpentry'],
  painting: ['paint', 'painter', 'painting'],
  transport: ['transport', 'move', 'delivery', 'car'],
  healthcare: ['health', 'medical', 'doctor', 'care'],
  beauty: ['beauty', 'salon', 'spa'],
  food: ['food', 'cook', 'catering'],
};

function matchCategory(text) {
  for (const [id, words] of Object.entries(CATEGORY_ALIASES)) {
    if (words.some((w) => text.includes(w)) || text.includes(id)) return id;
  }
  return null;
}

function findServiceByText(text, services) {
  const t = text.toLowerCase();
  return services.find(
    (s) =>
      s.title.toLowerCase().includes(t)
      || t.includes(s.title.toLowerCase().slice(0, 8)),
  );
}

function findServicesFuzzy(text, services, limit = 5) {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  const scored = services
    .map((s) => {
      const hay = `${s.title} ${s.categoryLabel} ${s.description}`.toLowerCase();
      const score = words.reduce((n, w) => (hay.includes(w) ? n + 1 : n), 0);
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.s);
}

function formatServiceSummary(service, provider) {
  const pkg = service.packages?.[0];
  const price = pkg?.price ?? service.price;
  const lines = [
    `**${service.title}** (${service.categoryLabel})`,
    service.description,
    '',
    `💰 From Rs. ${price?.toLocaleString?.() ?? price}${service.discount ? ` · ${service.discount}% off` : ''}`,
    `⭐ ${service.rating}/5 (${service.reviewCount} reviews)`,
    `⏱ ${service.duration || 'Flexible'}`,
    `📍 ${service.location || 'Nepal'}`,
  ];
  if (provider) {
    lines.push(`👤 Provider: ${provider.name} · ${provider.phone || 'Phone on request'}`);
  }
  if (service.packages?.length > 1) {
    lines.push(
      '',
      'Packages:',
      ...service.packages.map(
        (p) => `• ${p.name}: Rs. ${p.price.toLocaleString()} — ${(p.features || []).slice(0, 3).join(', ')}`,
      ),
    );
  }
  return lines.join('\n');
}

function buildServiceCards(services, getProvider) {
  return services.slice(0, 4).map((service) => ({
    service,
    provider: getProvider(service.providerId),
  }));
}

function listByCategory(categoryId, services, getProvider) {
  const list = services.filter((s) => s.category === categoryId).slice(0, 6);
  if (!list.length) {
    return { text: 'No services found in that category right now. Try another category or ask for "all services".' };
  }
  const label = list[0].categoryLabel || categoryId;
  const lines = list.map((s) => {
    const p = getProvider(s.providerId);
    const price = s.packages?.[0]?.price ?? s.price;
    return `• **${s.title}** — Rs. ${price?.toLocaleString?.()} · ⭐ ${s.rating}${p?.phone ? ` · 📞 ${p.phone}` : ''}`;
  });
  return {
    text: `Here are our **${label}** services:\n\n${lines.join('\n')}\n\nTap a card below for details, or say "call ${list[0].title}" to phone the provider.`,
    serviceCards: buildServiceCards(list, getProvider),
    suggestions: ['Call provider', 'Cheapest option', 'All services'],
  };
}

function serviceDetailReply(service, getProvider) {
  const provider = getProvider(service.providerId);
  return {
    text: formatServiceSummary(service, provider),
    serviceCards: [{ service, provider }],
    suggestions: ['Call now', 'Other services', 'Provider info'],
    actions: provider?.phone ? [{ type: 'call', label: 'Call Now', provider, service }] : [],
  };
}

/**
 * @param {string} input
 * @param {{ services, providers, serviceCategories, getProvider, focusService?, focusProvider? }} ctx
 */
export function getChatbotReply(input, ctx) {
  const { services, getProvider, focusService, focusProvider } = ctx;
  const text = (input || '').trim();
  const lower = text.toLowerCase();

  if (!text) {
    return { text: 'Please type a message or tap a suggestion below.' };
  }

  if (GREETINGS.test(lower)) {
    const firstName = ctx.userName ? `, ${ctx.userName.split(' ')[0]}` : '';
    return {
      text: `Namaste${firstName}! 🙏 Welcome to OrderMe.\n\nI'm Priya, your home services guide here in Nepal. Need a cleaner, plumber, electrician — or anything for your home? Just ask and I'll find the right person for you right away!`,
      suggestions: ['All services', 'Cleaning prices', 'Call plumber', 'Best rated'],
    };
  }

  if (THANKS.test(lower)) {
    const firstName = ctx.userName ? `, ${ctx.userName.split(' ')[0]}` : '';
    return {
      text: `You're welcome${firstName}! 😊 I'm always here if you need anything — prices, bookings, or a provider's number.`,
      suggestions: ['All services', 'Call provider'],
    };
  }

  if (CALL_INTENT.test(lower) || lower.startsWith('call ')) {
    const target =
      focusService
      || findServiceByText(lower.replace(/.*call\s*/, ''), services)
      || findServicesFuzzy(lower, services, 1)[0];
    const provider = target
      ? getProvider(target.providerId)
      : focusProvider;
    const phone = provider?.phone;
    if (phone) {
      return {
        text: `Calling **${provider.name}** for ${target?.title || 'your request'}.\n\n📞 ${phone}\n\nYour phone app should open shortly.`,
        actions: [{ type: 'call', label: 'Call Now', provider, service: target }],
      };
    }
    return { text: 'I couldn\'t find a phone number for that provider. Try asking about a specific service (e.g. "call home cleaning").' };
  }

  if (focusService && (PRICE_INTENT.test(lower) || lower.includes(focusService.title.toLowerCase()))) {
    return serviceDetailReply(focusService, getProvider);
  }

  if (focusProvider && /\b(provider|who|about)\b/i.test(lower)) {
    const provServices = services.filter((s) => s.providerId === focusProvider.id);
    return {
      text: `**${focusProvider.name}**\n${focusProvider.title || 'Verified provider'}\n⭐ ${focusProvider.rating} (${focusProvider.reviewCount} reviews)\n📞 ${focusProvider.phone}\n📍 ${focusProvider.location || 'Nepal'}\n\nServices: ${provServices.map((s) => s.title).join(', ') || 'Various'}`,
      actions: [{ type: 'call', label: 'Call Provider', provider: focusProvider }],
      serviceCards: buildServiceCards(provServices, getProvider),
    };
  }

  const categoryId = matchCategory(lower);
  if (categoryId) {
    if (PRICE_INTENT.test(lower)) {
      const catServices = services.filter((s) => s.category === categoryId);
      const cheapest = [...catServices].sort(
        (a, b) => (a.packages?.[0]?.price ?? a.price) - (b.packages?.[0]?.price ?? b.price),
      )[0];
      if (cheapest) return serviceDetailReply(cheapest, getProvider);
    }
    return listByCategory(categoryId, services, getProvider);
  }

  if (LIST_INTENT.test(lower) || lower === 'all') {
    const top = [...services].sort((a, b) => (b.booked || 0) - (a.booked || 0)).slice(0, 8);
    const lines = top.map((s) => {
      const price = s.packages?.[0]?.price ?? s.price;
      return `• **${s.title}** (${s.categoryLabel}) — Rs. ${price?.toLocaleString?.()}`;
    });
    return {
      text: `We offer **${services.length}+ services** across Nepal:\n\n${lines.join('\n')}\n\nAsk about any name, category, or say "call" + service name.`,
      serviceCards: buildServiceCards(top, getProvider),
      suggestions: ['Cleaning', 'Plumbing', 'Electrical', 'Call provider'],
    };
  }

  if (PRICE_INTENT.test(lower) || DISCOUNT_INTENT.test(lower)) {
    const match = findServiceByText(lower, services) || findServicesFuzzy(lower, services, 1)[0];
    if (match) return serviceDetailReply(match, getProvider);
    const affordable = [...services]
      .sort((a, b) => (a.packages?.[0]?.price ?? a.price) - (b.packages?.[0]?.price ?? b.price))
      .slice(0, 4);
    return {
      text: `Here are some affordable options:\n\n${affordable
        .map((s) => {
          const p = s.packages?.[0]?.price ?? s.price;
          return `• **${s.title}** — from Rs. ${p?.toLocaleString?.()}`;
        })
        .join('\n')}`,
      serviceCards: buildServiceCards(affordable, getProvider),
    };
  }

  if (RATING_INTENT.test(lower) || /\b(best|top|popular)\b/i.test(lower)) {
    const top = [...services].sort((a, b) => b.rating - a.rating || (b.booked || 0) - (a.booked || 0)).slice(0, 5);
    return {
      text: `Top-rated services on OrderMe:\n\n${top
        .map((s) => `• **${s.title}** — ⭐ ${s.rating} (${s.reviewCount} reviews)`)
        .join('\n')}`,
      serviceCards: buildServiceCards(top, getProvider),
    };
  }

  if (LOCATION_INTENT.test(lower)) {
    return {
      text: `OrderMe serves major cities in Nepal including **Kathmandu, Biratnagar, Dharan**, and more. Each service listing shows its area — ask "services in Kathmandu" or pick a service for exact location.`,
      suggestions: ['All services', 'Cleaning', 'Call provider'],
    };
  }

  if (DURATION_INTENT.test(lower)) {
    const match = findServiceByText(lower, services) || focusService;
    if (match) {
      return {
        text: `**${match.title}** usually takes **${match.duration || '2–4 hours'}**, depending on package and home size.`,
        serviceCards: [{ service: match, provider: getProvider(match.providerId) }],
      };
    }
    return { text: 'Duration varies by service — deep cleaning 4–6h, plumbing 2–3h, etc. Name a service for an exact estimate.' };
  }

  const direct = findServiceByText(lower, services);
  if (direct) return serviceDetailReply(direct, getProvider);

  const fuzzy = findServicesFuzzy(lower, services, 4);
  if (fuzzy.length) {
    return {
      text: `I found these services related to "${text}":\n\n${fuzzy
        .map((s) => `• **${s.title}** (${s.categoryLabel})`)
        .join('\n')}\n\nTap a card or ask for prices / call.`,
      serviceCards: buildServiceCards(fuzzy, getProvider),
      suggestions: ['Call now', 'Prices', 'All services'],
    };
  }

  return {
    text: `Hmm, I didn't quite catch that — "${text}" doesn't match any service I know of. But I'm here! Try something like:\n• "house cleaning prices"\n• "need a plumber"\n• "call electrician"\n\nOr just pick one of the options below. 😊`,
    suggestions: ['All services', 'Cleaning', 'Plumbing', 'Call provider', 'Best rated'],
  };
}

export function getWelcomeMessage(userName) {
  const firstName = userName ? userName.split(' ')[0] : null;
  const greeting = firstName ? `Namaste, **${firstName}**! 🙏` : 'Namaste! 🙏';
  return {
    text: `${greeting} I'm Priya from **OrderMe** — your home services desk in Nepal.\n\nJust tell me what you need — cleaning, plumbing, AC repair, beauty, electrician — and I'll find the right provider and their number for you straight away. What can I help you with today?`,
    suggestions: ['All services', 'Cleaning prices', 'Call plumber', 'Best rated'],
  };
}

export function getServiceIntro(service, provider) {
  return {
    text: `You're asking about **${service.title}**.\n\n${formatServiceSummary(service, provider)}\n\nWant to call the provider or see another service?`,
    serviceCards: [{ service, provider }],
    suggestions: ['Call now', 'Other packages', 'Similar services'],
    actions: provider?.phone ? [{ type: 'call', label: 'Call Now', provider, service }] : [],
  };
}

export function getProviderIntro(provider, services) {
  const list = services.filter((s) => s.providerId === provider.id);
  return {
    text: `Chat about **${provider.name}** (${provider.title || 'Provider'}).\n\n⭐ ${provider.rating} · 📞 ${provider.phone}\n\nServices: ${list.map((s) => s.title).join(', ') || '—'}`,
    serviceCards: buildServiceCards(list, () => provider),
    suggestions: ['Call now', 'Service prices', 'All services'],
    actions: [{ type: 'call', label: 'Call Provider', provider }],
  };
}
