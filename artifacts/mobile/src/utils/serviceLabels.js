/** Nepali display labels for orderme.com.np service slugs. */
export const SERVICE_LABELS_NE = {
  'home-decor': 'घर सजावट',
  biryani: 'बिरयानी',
  sekuwa: 'सेकुवा',
  grocery: 'किराना',
  'civil-engineer': 'सिविल इन्जिनियर',
  'coffee-shop': 'कफी पसल',
  'tuition-teacher': 'ट्युसन शिक्षक',
  'room-rent': 'कोठा भाडा',
  'ghar-jagga': 'घर जग्गा',
  hiace: 'हाइएस',
  'custom-agent': 'कस्टम एजेन्ट',
  hospital: 'अस्पताल',
  'sweets-store': 'मिठाई पसल',
  'gas-store': 'ग्यास पसल',
  'home-appliance': 'घरेलु उपकरण',
  'bike-ride': 'बाइक सवारी',
  'local-bus': 'स्थानीय बस',
  'day-night-bus': 'दिन/रात बस',
  'eye-care': 'आँखा उपचार',
  'cinema-theater': 'सिनेमा/थिएटर',
  garmemt: 'गार्मेन्ट',
  'cloth-store': 'कपडा पसल',
  'tv-repair': 'टिभी मर्मत',
  'it-solution': 'आईटी समाधान',
  'hardware-store': 'हार्डवेयर पसल',
  'car-decoratoir': 'कार सजावट',
  'photo-studio': 'फोटो स्टुडियो',
  'tiles-marble': 'टाइल्स र मार्बल',
  'fitness-center': 'फिटनेस सेन्टर',
  'car-rent': 'कार भाडा',
  'cement-mixture-truck': 'सिमेन्ट मिक्सर ट्रक',
  transport: 'यातायात',
  courier: 'कुरियर',
  'flight-ticket': 'उडान टिकट',
  ev: 'इलेक्ट्रिक गाडी',
  'tax-conslultant': 'कर सल्लाहकार',
  meat: 'मासु',
  'auto-city': 'अटो/सिटी',
  taxi: 'ट्याक्सी',
  painter: 'पेन्टर',
  plumber: 'प्लम्बर',
  electrician: 'इलेक्ट्रिसियन',
  'mobile-care': 'मोबाइल केयर',
  jeweler: 'ज्वेलर्स',
  saloon: 'सलुन',
  beautician: 'ब्युटिसियन',
  bakery: 'बेकरी',
  'blood-bank': 'रक्त बैंक',
  ambulance: 'एम्बुलेन्स',
  resturant: 'रेस्टुरेन्ट',
  hotel: 'होटेल',
  radiologist: 'रेडियोlogist',
  carpenter: 'सिकर्मी',
  'car-workshop': 'कार वर्कसप',
  'false-ceiling-mistri': 'झूलो पर्दा मिस्त्री',
  'grill-mistri': 'ग्रिल मिस्त्री',
  pharmacy: 'फार्मेसी',
  'raj-mistri': 'राज मिस्त्री',
  'ac-expert': 'एसी विशेषज्ञ',
  'tent-and-sound': 'टेन्ट र साउन्ड',
  kabadiwala: 'कबाडीवाला',
  doctor: 'डाक्टर',
  dentist: 'दन्त चिकित्सक',
  boutique: 'बुटिक',
  tailor: 'दर्जी',
  'bike-mistri': 'बाइक मिस्त्री',
  'dance-center': 'नृत्य केन्द्र',
  'photo-grapher': 'फोटोग्राफर',
  'event-manager': 'कार्यक्रम व्यवस्थापक',
  scorpio: 'स्कorpio',
};

/** Section id → Nepali label (English fallback via translations). */
export const SECTION_LABELS_NE = {
  all: 'सबै',
  'home-repair': 'घर, सफाई र मर्मत',
  transport: 'सवारी र यातायात',
  health: 'स्वास्थ्य र चिकित्सा',
  food: 'खाना र किराना',
  retail: 'किनमेल र फेसन',
  professional: 'व्यावसायिक सेवा',
  property: 'घर जग्गा र भाडा',
  events: 'कार्यक्रम र मनोरञ्जन',
  other: 'थप सेवाहरू',
};

export function getLocalizedServiceLabel(slug, englishLabel, language = 'en') {
  if (language === 'ne' && slug && SERVICE_LABELS_NE[slug]) {
    return SERVICE_LABELS_NE[slug];
  }
  return englishLabel || slug || '';
}

export function getLocalizedSectionLabel(sectionId, englishLabel, language = 'en') {
  if (language === 'ne' && sectionId && SECTION_LABELS_NE[sectionId]) {
    return SECTION_LABELS_NE[sectionId];
  }
  return englishLabel || sectionId || '';
}

/** Lowercase search terms for voice/type filter (English + Nepali). */
export function getServiceSearchTerms(slug, englishLabel, language = 'en') {
  const terms = new Set();
  const en = (englishLabel || '').toLowerCase();
  const slugSpaced = (slug || '').replace(/-/g, ' ').toLowerCase();
  if (en) terms.add(en);
  if (slugSpaced) terms.add(slugSpaced);
  if (language === 'ne' && slug && SERVICE_LABELS_NE[slug]) {
    terms.add(SERVICE_LABELS_NE[slug].toLowerCase());
  }
  return [...terms];
}
