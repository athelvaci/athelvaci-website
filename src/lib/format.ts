/** Escape HTML, then turn ~~old value~~ into a struck-through before/after marker. */
export function inline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/~~(.+?)~~/g, '<s>$1</s>');
}

/** Rough reading time in minutes (200 words per minute, never less than 1). */
export function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const formatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDate = (date: Date): string => formatter.format(date);
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** Same markup as `inline`, but drops the struck-through "before" markers (for the resume). */
export function plain(text: string): string {
  return text.replace(/~~(.+?)~~/g, '$1');
}
