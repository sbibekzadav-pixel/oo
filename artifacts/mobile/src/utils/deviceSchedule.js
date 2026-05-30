/** Booking dates/times from the user's device clock and locale. */

export function getDeviceBookingDates(count = 14) {
  const locale = undefined;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      date: `${y}-${m}-${day}`,
      day: d.toLocaleDateString(locale, { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString(locale, { month: 'short' }),
      isToday: i === 0,
    };
  });
}

export function getDeviceTimeSlots() {
  const slots = [];
  for (let hour = 8; hour <= 18; hour += 1) {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    slots.push(d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }));
  }
  return slots;
}

export function formatDeviceDateTime(isoDate, timeLabel) {
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} · ${timeLabel}`;
  } catch {
    return `${isoDate} · ${timeLabel}`;
  }
}

export function relativeTimeFromNow(isoOrMs) {
  const then = typeof isoOrMs === 'number' ? isoOrMs : new Date(isoOrMs).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(then).toLocaleDateString();
}
