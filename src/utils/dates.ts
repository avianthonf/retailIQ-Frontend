/**
 * src/utils/dates.ts
 * Oracle Document sections consumed: 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const parseApiDate = (raw: string | number | Date) => {
  if (raw instanceof Date) {
    return raw;
  }

  return new Date(raw);
};

export const formatDisplayDate = (date: Date | string | number) => dateFormatter.format(parseApiDate(date));

export const formatDisplayDateTime = (date: Date | string | number) => dateTimeFormatter.format(parseApiDate(date));

export const toApiDate = (date: Date) => date.toISOString();

export const formatDate = formatDisplayDate;
