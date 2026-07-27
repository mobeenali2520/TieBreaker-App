export const OPTION_COLORS = [
  { name: 'Indigo', value: '#6366f1', light: '#e0e7ff', border: '#818cf8' },
  { name: 'Emerald', value: '#10b981', light: '#d1fae5', border: '#34d399' },
  { name: 'Amber', value: '#f59e0b', light: '#fef3c7', border: '#fbbf24' },
  { name: 'Rose', value: '#f43f5e', light: '#ffe4e6', border: '#fb7185' },
  { name: 'Cyan', value: '#06b6d4', light: '#cffaff', border: '#22d3ee' },
  { name: 'Violet', value: '#8b5cf6', light: '#ede9fe', border: '#a78bfa' },
  { name: 'Teal', value: '#14b8a6', light: '#ccfbf1', border: '#2dd4bf' },
  { name: 'Orange', value: '#ea580c', light: '#ffedd5', border: '#fb923c' },
];

export function getRandomColor(index?: number): string {
  if (typeof index === 'number') {
    return OPTION_COLORS[index % OPTION_COLORS.length].value;
  }
  return OPTION_COLORS[Math.floor(Math.random() * OPTION_COLORS.length)].value;
}
