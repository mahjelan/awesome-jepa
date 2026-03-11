import type { UserPreferences } from '../types/settings';
import { DEFAULT_PREFERENCES } from '../types/settings';

const PREFS_KEY = 'aix_preferences';

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      defaultPostVisibility: parsed.defaultPostVisibility ?? DEFAULT_PREFERENCES.defaultPostVisibility,
      defaultSaveVisibility: parsed.defaultSaveVisibility ?? DEFAULT_PREFERENCES.defaultSaveVisibility,
      theme: parsed.theme ?? DEFAULT_PREFERENCES.theme,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  const current = loadPreferences();
  const next = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
}

export function clearPreferences(): void {
  localStorage.removeItem(PREFS_KEY);
}
