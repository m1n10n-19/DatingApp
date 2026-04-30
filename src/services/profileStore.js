const STORAGE_KEY = 'complement.profiles.v1';

/**
 * List all saved profiles from localStorage.
 * @returns {import('../../shared/schema.js').Profile[]}
 */
export function listProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('profileStore: failed to read profiles, returning empty list', e);
    return [];
  }
}

/**
 * Get a single profile by id.
 * @param {string} id
 * @returns {import('../../shared/schema.js').Profile | null}
 */
export function getProfile(id) {
  try {
    const profiles = listProfiles();
    return profiles.find((p) => p.id === id) || null;
  } catch (e) {
    console.warn('profileStore: failed to get profile', e);
    return null;
  }
}

/**
 * Save a profile. If a profile with the same id exists, replace it; otherwise append.
 * @param {import('../../shared/schema.js').Profile} profile
 * @returns {import('../../shared/schema.js').Profile}
 */
export function saveProfile(profile) {
  try {
    const profiles = listProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn('profileStore: failed to save profile (possibly quota exceeded)', e);
  }
  return profile;
}

/**
 * Delete a profile by id.
 * @param {string} id
 * @returns {boolean} true if removed, false if not found
 */
export function deleteProfile(id) {
  try {
    const profiles = listProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    profiles.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch (e) {
    console.warn('profileStore: failed to delete profile', e);
    return false;
  }
}

/**
 * Remove all saved profiles.
 */
export function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('profileStore: failed to clear storage', e);
  }
}

export { STORAGE_KEY };
