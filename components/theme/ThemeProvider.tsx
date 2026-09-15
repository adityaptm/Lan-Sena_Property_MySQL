'use client';

// Reverted to clean light mode by default
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return { theme: 'light', resolvedTheme: 'light', setTheme: () => {}, toggleTheme: () => {} };
}
