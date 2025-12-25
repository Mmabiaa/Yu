import React, { createContext, useContext, useState, ReactNode } from 'react';

export const darkTheme = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#666666',
  
  // Accent colors
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#6D28D9',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  green: '#10B981',
  greenLight: '#34D399',
  orange: '#F59E0B',
  red: '#EF4444',
  
  // Status colors
  online: '#10B981',
  offline: '#6B7280',
  
  // UI elements
  selected: '#8B5CF6',
  unselected: '#2A2A2A',
  border: '#333333',
  
  // Additional UI colors
  cardBackground: '#1C1C2E',
  cardBorder: '#2A2A3E',
  selectedCardBackground: '#2D1B69',
  selectedCardBorder: '#8B5CF6',
};

export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceLight: '#FAFAFA',
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Accent colors
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#6D28D9',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  green: '#10B981',
  greenLight: '#34D399',
  orange: '#F59E0B',
  red: '#EF4444',
  
  // Status colors
  online: '#10B981',
  offline: '#6B7280',
  
  // UI elements
  selected: '#8B5CF6',
  unselected: '#F5F5F5',
  border: '#E5E5E5',
  
  // Additional UI colors
  cardBackground: '#F9F9FB',
  cardBorder: '#E8E8F0',
  selectedCardBackground: '#EDE9FE',
  selectedCardBorder: '#8B5CF6',
};

export type Theme = typeof darkTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};