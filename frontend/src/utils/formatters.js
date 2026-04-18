import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format date
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return '';
  }
};

// Format time
export const formatTime = (time) => {
  if (!time) return '';
  try {
    return format(parseISO(`2000-01-01T${time}`), 'hh:mm a');
  } catch (error) {
    return time;
  }
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return '';
  }
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Format date and time
export const formatDateTime = (date, formatStr = 'MMM dd, yyyy hh:mm a') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return '';
  }
};

/** Pet age stored as months (number) → e.g. "3 months" */
export const formatPetAgeMonths = (age) => {
  if (age == null || age === '' || Number.isNaN(Number(age))) return '—';
  const n = Math.floor(Number(age));
  return `${n} month${n === 1 ? '' : 's'}`;
};

/** API snake_case payment_method → readable label */
export const formatPaymentMethod = (method) => {
  if (method == null || method === '') return '—';
  const labels = {
    cash_on_delivery: 'Cash On Delivery',
    bank_transfer: 'Bank Transfer',
    card: 'Credit / Debit Card',
  };
  const key = String(method).toLowerCase().trim().replace(/\s+/g, '_');
  if (labels[key]) return labels[key];
  return String(method)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

