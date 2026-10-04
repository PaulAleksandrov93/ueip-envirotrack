export const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  const [year, month, day] = String(isoDate).slice(0, 10).split('-');
  return `${day}.${month}.${year}`;
};

export const formatTime = (time) => (time ? String(time).slice(0, 5) : '—');

export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
};

export const isOutOfRange = (value, min, max) => {
  const num = toNumber(value);
  const lo = toNumber(min);
  const hi = toNumber(max);
  if (num === null) return false;
  return (lo !== null && num < lo) || (hi !== null && num > hi);
};

export const formatValue = (value, digits) => {
  const num = toNumber(value);
  if (num === null) return '—';
  return digits === undefined ? String(num).replace('.', ',') : num.toFixed(digits).replace('.', ',');
};

export const shortName = (person) =>
  person ? `${person.last_name} ${person.first_name ? `${person.first_name[0]}.` : ''}` : 'Не указан';
