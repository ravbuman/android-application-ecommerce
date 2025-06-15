import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const THEME_KEY = 'user_theme';
const THEME_MODE_KEY = 'user_theme_mode'; // New key for dark/light mode preference

// Color themes with original Classic as first/default
const colorThemes = [
  {
    key: 'classic',
    label: 'Classic',
    light: {
      mode: 'light',
      background: '#fff',
      card: '#f8f8f8',
      surface: '#fff',
      primary: '#1a7f3c', // Green
      secondary: '#333',
      accent: '#1a7f3c',
      text: '#18191c',
      shadow: 'rgba(0,0,0,0.08)',
      border: '#e0e0e0',
      input: '#fff',
      placeholder: '#888',
      link: '#1a7f3c',
      primaryDark: '#145c2a',
      // Added soft cloud variables for consistency
      cloudHighlight: '#f0f0f0',
      subtleShadow: 'rgba(0,0,0,0.05)',
      success: '#1a7f3c',
      warning: '#d97706',
      error: '#dc2626',
    },
    dark: {
      mode: 'dark',
      background: '#18191c',
      card: '#23242a',
      surface: '#23242a',
      primary: '#1a7f3c',
      secondary: '#fff',
      accent: '#1a7f3c',
      text: '#fff',
      shadow: 'rgba(0,0,0,0.5)',
      border: '#23242a',
      input: '#23242a',
      placeholder: '#888',
      link: '#1a7f3c',
      primaryDark: '#145c2a',
      // Added dark mode variables
      cloudHighlight: '#2a2a2a',
      subtleShadow: 'rgba(0,0,0,0.2)',
      success: '#1a7f3c',
      warning: '#d97706',
      error: '#dc2626',
    }
  },
  {
    key: 'sky',
    label: 'Sky Cloud',
    light: {
      mode: 'light',
      background: '#f8fafc',
      card: '#ffffff',
      surface: '#ffffff',
      primary: '#7dd3fc',
      secondary: '#475569',
      accent: '#38bdf8',
      text: '#1e293b',
      shadow: 'rgba(149, 157, 165, 0.1)',
      border: '#e2e8f0',
      input: '#ffffff',
      placeholder: '#94a3b8',
      link: '#38bdf8',
      primaryDark: '#0ea5e9',
      cloudHighlight: '#f0f9ff',
      subtleShadow: 'rgba(100, 100, 100, 0.05)',
      success: '#86efac',
      warning: '#fcd34d',
      error: '#fca5a5',
    },
    dark: {
      mode: 'dark',
      background: '#0f172a',
      card: '#1e293b',
      surface: '#1e293b',
      primary: '#7dd3fc',
      secondary: '#e2e8f0',
      accent: '#38bdf8',
      text: '#f8fafc',
      shadow: 'rgba(0, 0, 0, 0.3)',
      border: '#334155',
      input: '#1e293b',
      placeholder: '#64748b',
      link: '#38bdf8',
      primaryDark: '#0ea5e9',
      cloudHighlight: '#1e3a8a',
      subtleShadow: 'rgba(0, 0, 0, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    }
  },
  {
    key: 'mint',
    label: 'Mint Cloud',
    light: {
      mode: 'light',
      background: '#f0fdfa',
      card: '#ffffff',
      surface: '#ffffff',
      primary: '#5eead4',
      secondary: '#475569',
      accent: '#2dd4bf',
      text: '#1e293b',
      shadow: 'rgba(149, 157, 165, 0.1)',
      border: '#e2e8f0',
      input: '#ffffff',
      placeholder: '#94a3b8',
      link: '#2dd4bf',
      primaryDark: '#14b8a6',
      cloudHighlight: '#ccfbf1',
      subtleShadow: 'rgba(100, 100, 100, 0.05)',
      success: '#86efac',
      warning: '#fcd34d',
      error: '#fca5a5',
    },
    dark: {
      mode: 'dark',
      background: '#042f2e',
      card: '#134e4a',
      surface: '#134e4a',
      primary: '#5eead4',
      secondary: '#e2e8f0',
      accent: '#2dd4bf',
      text: '#f8fafc',
      shadow: 'rgba(0, 0, 0, 0.3)',
      border: '#334155',
      input: '#134e4a',
      placeholder: '#64748b',
      link: '#2dd4bf',
      primaryDark: '#14b8a6',
      cloudHighlight: '#0d9488',
      subtleShadow: 'rgba(0, 0, 0, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    }
  },
  {
    key: 'lavender',
    label: 'Lavender Mist',
    light: {
      mode: 'light',
      background: '#f8fafc',
      card: '#ffffff',
      surface: '#ffffff',
      primary: '#c4b5fd',
      secondary: '#475569',
      accent: '#a78bfa',
      text: '#1e293b',
      shadow: 'rgba(149, 157, 165, 0.1)',
      border: '#e2e8f0',
      input: '#ffffff',
      placeholder: '#94a3b8',
      link: '#a78bfa',
      primaryDark: '#8b5cf6',
      cloudHighlight: '#ede9fe',
      subtleShadow: 'rgba(100, 100, 100, 0.05)',
      success: '#86efac',
      warning: '#fcd34d',
      error: '#fca5a5',
    },
    dark: {
      mode: 'dark',
      background: '#1e1b4b',
      card: '#312e81',
      surface: '#312e81',
      primary: '#c4b5fd',
      secondary: '#e2e8f0',
      accent: '#a78bfa',
      text: '#f8fafc',
      shadow: 'rgba(0, 0, 0, 0.3)',
      border: '#334155',
      input: '#312e81',
      placeholder: '#64748b',
      link: '#a78bfa',
      primaryDark: '#8b5cf6',
      cloudHighlight: '#4c1d95',
      subtleShadow: 'rgba(0, 0, 0, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    }
  },
  {
    key: 'blush',
    label: 'Blush Sky',
    light: {
      mode: 'light',
      background: '#fff1f2',
      card: '#ffffff',
      surface: '#ffffff',
      primary: '#fda4af',
      secondary: '#475569',
      accent: '#fb7185',
      text: '#1e293b',
      shadow: 'rgba(149, 157, 165, 0.1)',
      border: '#e2e8f0',
      input: '#ffffff',
      placeholder: '#94a3b8',
      link: '#fb7185',
      primaryDark: '#f43f5e',
      cloudHighlight: '#ffe4e6',
      subtleShadow: 'rgba(100, 100, 100, 0.05)',
      success: '#86efac',
      warning: '#fcd34d',
      error: '#fca5a5',
    },
    dark: {
      mode: 'dark',
      background: '#4c0519',
      card: '#831843',
      surface: '#831843',
      primary: '#fda4af',
      secondary: '#e2e8f0',
      accent: '#fb7185',
      text: '#f8fafc',
      shadow: 'rgba(0, 0, 0, 0.3)',
      border: '#334155',
      input: '#831843',
      placeholder: '#64748b',
      link: '#fb7185',
      primaryDark: '#f43f5e',
      cloudHighlight: '#9f1239',
      subtleShadow: 'rgba(0, 0, 0, 0.2)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    }
  }
];
function getThemeByKey(key, mode) {
  const found = colorThemes.find(t => t.key === key);
  if (!found) return colorThemes[0][mode];
  return found[mode];
}

const ThemeContext = createContext({
  theme: colorThemes[0].light,
  setTheme: () => {},
  setThemeMode: () => {}, // New function
  colorThemes,
  selectedThemeKey: 'classic',
  isDarkMode: false,
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [selectedThemeKey, setSelectedThemeKey] = useState('classic');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [theme, setThemeState] = useState(getThemeByKey('classic', isDarkMode ? 'dark' : 'light'));

  // Load saved theme preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedMode] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(THEME_MODE_KEY),
        ]);
        
        if (savedTheme && colorThemes.find(t => t.key === savedTheme)) {
          setSelectedThemeKey(savedTheme);
        }
        
        if (savedMode) {
          setIsDarkMode(savedMode === 'dark');
        }
        
        const mode = savedMode === 'dark' || (!savedMode && colorScheme === 'dark') ? 'dark' : 'light';
        const themeKey = savedTheme || 'classic';
        setThemeState(getThemeByKey(themeKey, mode));
      } catch (e) {
        console.error('Failed to load theme preferences', e);
      }
    };
    
    loadPreferences();
    
    const listener = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      AsyncStorage.getItem(THEME_MODE_KEY).then(savedMode => {
        // Only follow system if user hasn't set a preference
        if (!savedMode) {
          setIsDarkMode(newScheme === 'dark');
          AsyncStorage.getItem(THEME_KEY).then(savedTheme => {
            setThemeState(getThemeByKey(
              savedTheme || 'classic',
              newScheme === 'dark' ? 'dark' : 'light'
            ));
          });
        }
      });
    });
    
    return () => listener.remove();
  }, [colorScheme]);

  const setTheme = async (key) => {
    setSelectedThemeKey(key);
    await AsyncStorage.setItem(THEME_KEY, key);
    setThemeState(getThemeByKey(key, isDarkMode ? 'dark' : 'light'));
  };

  const setThemeMode = async (darkMode) => {
    setIsDarkMode(darkMode);
    await AsyncStorage.setItem(THEME_MODE_KEY, darkMode ? 'dark' : 'light');
    setThemeState(getThemeByKey(selectedThemeKey, darkMode ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      setThemeMode,
      colorThemes, 
      selectedThemeKey,
      isDarkMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export { ThemeContext };