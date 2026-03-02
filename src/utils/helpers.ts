import { POLITICAL_GROUP_COLORS, COUNTRY_FLAGS } from '../types';

export function getGroupColor(groupShort: string): string {
  return POLITICAL_GROUP_COLORS[groupShort] || '#888888';
}

export function getCountryFlag(countryCode: string): string {
  return COUNTRY_FLAGS[countryCode] || '';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function percentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
