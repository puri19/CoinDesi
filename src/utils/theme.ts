// utils/theme.ts
import { Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Device type detection ---
export const isTablet = SCREEN_WIDTH >= 768;
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isLargeDevice = SCREEN_WIDTH > 414;

// --- Responsive scaling utilities ---
export const RW = (size: number): number => {
  const baseWidth = isTablet ? 768 : 375;
  const scale = SCREEN_WIDTH / baseWidth;
  return Math.round(size * scale);
};

export const RH = (size: number): number => {
  const baseHeight = isTablet ? 1024 : 812;
  const scale = SCREEN_HEIGHT / baseHeight;
  return Math.round(size * scale);
};

export const RFValue = (fontSize: number): number => {
  const baseHeight = isTablet ? 1024 : 812;
  const heightPercent = (fontSize * SCREEN_HEIGHT) / baseHeight;
  return Math.round(heightPercent);
};

// --- Additional responsive utilities ---
export const getResponsiveSize = (small: number, medium: number, large: number): number => {
  if (isSmallDevice) return small;
  if (isLargeDevice) return large;
  return medium;
};

export const getResponsivePadding = (p: number): number => {
  return isTablet ? RW(p * 2) : RW(p);
};

export const getResponsiveMargin = (p: number): number => {
  return isTablet ? RW(p * 1.5) : RW(p);
};

// --- Safe area utilities ---

// Status bar height (iOS fixed, Android dynamic)
export const getStatusBarHeight = (): number => {
  return Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
};

// Hook to get bottom safe area inset inside components
export const useBottomSafeArea = (): number => {
  const insets = useSafeAreaInsets();
  return insets.bottom;
};

// Static getter for bottom safe area inset outside components
export const getBottomSafeArea = (): number => {
  return initialWindowMetrics?.insets?.bottom || 0;
};

// --- Base theme colors ---
const LIGHT_COLORS = {
  primary: '#0F70FF',
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  accent: '#F59E0B',
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  bullish: '#10B981',
  bearish: '#EF4444',
  neutral: '#6B7280',
  shadow: '#000000',
};

const DARK_COLORS = {
  ...LIGHT_COLORS,
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textLight: '#CBD5E1',
  border: '#334155',
  shadow: '#000000',
};

// --- Theme object factory ---
export const createTheme = (isDark: boolean = false) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return {
    ...colors,

    gradient: {
      primary: ['#2563EB', '#3B82F6', '#60A5FA'],
      secondary: ['#10B981', '#34D399', '#6EE7B7'],
      accent: ['#F59E0B', '#FBBF24', '#FCD34D'],
      dark: ['#1E293B', '#334155', '#475569'],
      crypto: ['#2563EB', '#7C3AED', '#EC4899'],
    },

    shadow: {
      light: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 4,
      },
      medium: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
      },
      heavy: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.16,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 12,
      },
    },

    spacing: {
      xs: RW(4),
      sm: RW(8),
      md: RW(16),
      lg: RW(24),
      xl: RW(32),
      xxl: RW(48),
    },

    borderRadius: {
      sm: RW(4),
      md: RW(8),
      lg: RW(12),
      xl: RW(16),
      xxl: RW(24),
      full: 9999,
    },

    typography: {
      h1: {
        fontSize: RFValue(32),
        fontWeight: '700',
        lineHeight: RFValue(40),
      },
      h2: {
        fontSize: RFValue(28),
        fontWeight: '700',
        lineHeight: RFValue(36),
      },
      h3: {
        fontSize: RFValue(24),
        fontWeight: '600',
        lineHeight: RFValue(32),
      },
      h4: {
        fontSize: RFValue(20),
        fontWeight: '600',
        lineHeight: RFValue(28),
      },
      body1: {
        fontSize: RFValue(16),
        fontWeight: '400',
        lineHeight: RFValue(24),
      },
      body2: {
        fontSize: RFValue(14),
        fontWeight: '400',
        lineHeight: RFValue(20),
      },
      caption: {
        fontSize: RFValue(12),
        fontWeight: '400',
        lineHeight: RFValue(16),
      },
      button: {
        fontSize: RFValue(16),
        fontWeight: '600',
        lineHeight: RFValue(24),
      },
    },
  };
};

// Default light theme
export const THEME = createTheme(false);

// Theme context types
export type ThemeMode = 'light' | 'dark';
export type ThemeContextType = {
  theme: ReturnType<typeof createTheme>;
  isDark: boolean;
  toggleTheme: () => void;
};
