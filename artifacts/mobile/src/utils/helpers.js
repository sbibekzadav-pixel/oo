// OrderMe Utility Helpers

export const formatPrice = (price) => {
  if (!price || price === 0) return 'Free';
  return `Rs. ${price.toLocaleString()}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'confirmed': return '#3b82f6';
    case 'in_progress': return '#8b5cf6';
    case 'completed': return '#10b981';
    case 'cancelled': return '#ef4444';
    default: return '#94a3b8';
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

export const generateBookingId = () => {
  return 'OM' + Math.random().toString(36).substr(2, 8).toUpperCase();
};

export const getTimeSlots = () => {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h;
    slots.push(`${displayH}:00 ${ampm}`);
    if (h < 20) slots.push(`${displayH}:30 ${ampm}`);
  }
  return slots;
};

export const getUpcomingDates = (count = 7) => {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      date: d,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return dates;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const getDistanceText = (distance) => {
  if (distance < 1) return `${Math.round(distance * 1000)}m away`;
  return `${distance.toFixed(1)}km away`;
};
