import { useState, useEffect } from 'react';

export interface UserPreferences {
  categories: string[];
  location: string;
  experience: string;
  remote: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  categories: [],
  location: '',
  experience: '',
  remote: '',
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jobwall_preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when preferences change
  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    try {
      localStorage.setItem('jobwall_preferences', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save preferences to localStorage', error);
    }
  };

  return {
    preferences,
    updatePreferences,
    isLoaded,
  };
}
