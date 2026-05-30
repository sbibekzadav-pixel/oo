// Theme Colors - OrderMe Design System
export const COLORS = {
  primary: '#1a56db',
  primaryDark: '#1341b0',
  primaryLight: '#e8f0fd',
  secondary: '#f59e0b',
  secondaryDark: '#d97706',
  secondaryLight: '#fef3c7',
  accent: '#10b981',
  accentLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',

  background: '#f0f4ff',
  surface: '#ffffff',
  surfaceAlt: '#f8faff',
  card: '#ffffff',
  border: '#e2e8f0',
  divider: '#f1f5f9',

  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  textWhite: '#ffffff',
  textMuted: '#cbd5e1',

  gradientBlue: ['#1a56db', '#3b82f6'],
  gradientOrange: ['#f59e0b', '#f97316'],
  gradientGreen: ['#10b981', '#059669'],
  gradientPurple: ['#8b5cf6', '#7c3aed'],
  gradientPink: ['#ec4899', '#db2777'],
  gradientCard: ['#ffffff', '#f8faff'],

  shadow: 'rgba(26, 86, 219, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusRound: 50,

  fontXs: 10,
  fontSm: 12,
  fontMd: 14,
  fontBase: 16,
  fontLg: 18,
  fontXl: 20,
  fontXxl: 24,
  fontTitle: 28,
  fontHero: 32,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};
