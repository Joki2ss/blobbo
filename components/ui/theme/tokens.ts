// UI tokens: palette, spacing, radius, typography
// Patch (A) — SXR Managements UI refresh

export const colors = {
  background: '#181A1B', // dark base
  surface: '#232526',    // card bg
  surfaceAlt: '#292B2D', // alt card
  accent: '#2D7DFF',     // blue accent
  accentAlt: '#FF3B30',  // red accent (danger)
  border: '#23272A',
  shadow: 'rgba(0,0,0,0.18)',
  text: '#F3F4F6',
  mutedText: '#A0A4AA',
  chipBg: '#232B3B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
};

export const radius = {
  card: 16,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.1 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: 0.1 },
  h3: { fontSize: 18, fontWeight: '600', letterSpacing: 0.08 },
  section: { fontSize: 16, fontWeight: '600', letterSpacing: 0.06 },
  body: { fontSize: 15, fontWeight: '400', letterSpacing: 0.04 },
  small: { fontSize: 13, fontWeight: '400', letterSpacing: 0.02 },
};
