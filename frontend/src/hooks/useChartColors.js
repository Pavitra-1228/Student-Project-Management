import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const NAMES = ['ink', 'muted', 'line', 'surface', 'brand', 'accent', 'sun', 'todo', 'progress', 'review', 'done'];

export function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      NAMES.map((name) => [name, `rgb(${styles.getPropertyValue(`--${name}`).trim().split(/\s+/).join(',')})`])
    );
  }, [theme]);
}
