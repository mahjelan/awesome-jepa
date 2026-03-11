/** User preferences (stored in localStorage). */
export interface UserPreferences {
  /** Default visibility for new feed posts. */
  defaultPostVisibility: 'public' | 'private';
  /** Default visibility when saving a discovery. */
  defaultSaveVisibility: 'public' | 'private';
  /** UI theme. */
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultPostVisibility: 'private',
  defaultSaveVisibility: 'private',
  theme: 'light',
};
