import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  preferences: JSON.parse(localStorage.getItem('themePreferences') || '{}'),
};

// Action types
const ThemeActionTypes = {
  SET_THEME: 'SET_THEME',
  SET_PREFERENCE: 'SET_PREFERENCE',
  RESET_PREFERENCES: 'RESET_PREFERENCES',
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case ThemeActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    
    case ThemeActionTypes.SET_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value,
        },
      };
    
    case ThemeActionTypes.RESET_PREFERENCES:
      return {
        ...state,
        preferences: {},
      };
    
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Theme configuration
const themes = {
  light: {
    name: 'Light',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#ffffff',
      surface: '#f9fafb',
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        muted: '#9ca3af',
      },
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#9ca3af',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#111827',
      surface: '#1f2937',
      text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        muted: '#6b7280',
      },
    },
  },
  system: {
    name: 'System',
    colors: null, // Will use system preference
  },
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(state.theme);
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('themePreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Apply theme to document
  const applyTheme = (themeName) => {
    const root = document.documentElement;
    
    if (themeName === 'system') {
      // Use system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      root.className = systemTheme;
    } else {
      root.className = themeName;
    }
    
    // Apply custom CSS properties if theme has colors
    const theme = themes[themeName === 'system' ? 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
      themeName
    ];
    
    if (theme?.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            root.style.setProperty(`--color-${key}-${subKey}`, subValue);
          });
        } else {
          root.style.setProperty(`--color-${key}`, value);
        }
      });
    }
  };

  // Set theme
  const setTheme = (themeName) => {
    if (themes[themeName]) {
      dispatch({ type: ThemeActionTypes.SET_THEME, payload: themeName });
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Set preference
  const setPreference = (key, value) => {
    dispatch({
      type: ThemeActionTypes.SET_PREFERENCE,
      payload: { key, value },
    });
  };

  // Get preference
  const getPreference = (key, defaultValue = null) => {
    return state.preferences[key] ?? defaultValue;
  };

  // Reset preferences
  const resetPreferences = () => {
    dispatch({ type: ThemeActionTypes.RESET_PREFERENCES });
    localStorage.removeItem('themePreferences');
  };

  // Get current theme colors
  const getCurrentTheme = () => {
    if (state.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return themes[systemTheme];
    }
    return themes[state.theme];
  };

  // Check if dark mode is active
  const isDarkMode = () => {
    if (state.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return state.theme === 'dark';
  };

  // Get available themes
  const getAvailableThemes = () => {
    return Object.keys(themes).map(key => ({
      key,
      name: themes[key].name,
    }));
  };

  // Listen to system theme changes
  useEffect(() => {
    if (state.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [state.theme]);

  const value = {
    ...state,
    themes,
    setTheme,
    toggleTheme,
    setPreference,
    getPreference,
    resetPreferences,
    getCurrentTheme,
    isDarkMode,
    getAvailableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;