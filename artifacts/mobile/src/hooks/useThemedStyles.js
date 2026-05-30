import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export function useThemedStyles(factory) {
  const { colors, shadows, isDark, mode } = useTheme();
  return useMemo(() => factory(colors, shadows, isDark), [colors, shadows, isDark, mode, factory]);
}
