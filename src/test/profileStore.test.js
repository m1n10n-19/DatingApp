import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listProfiles, getProfile, saveProfile, deleteProfile, clearAll, STORAGE_KEY } from '../services/profileStore';

function createMockLocalStorage() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    _store: store,
  };
}

describe('profileStore', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('listProfiles returns [] when storage is empty', () => {
    expect(listProfiles()).toEqual([]);
  });

  it('save + list returns array of 1', () => {
    const profile = { id: 'test-1', name: 'Test', gender: 'male', moduleAnswers: { core: ['', '', ''] }, enabledModules: [], schemaVersion: 1, createdAt: '2025-01-01T00:00:00.000Z' };
    saveProfile(profile);
    const result = listProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-1');
    expect(result[0].name).toBe('Test');
  });

  it('save with existing id replaces (not duplicates)', () => {
    const profile1 = { id: 'test-1', name: 'Original', gender: 'male', moduleAnswers: { core: ['', '', ''] }, enabledModules: [], schemaVersion: 1, createdAt: '2025-01-01T00:00:00.000Z' };
    const profile2 = { id: 'test-1', name: 'Updated', gender: 'male', moduleAnswers: { core: ['a', 'b', 'c'] }, enabledModules: ['kokology'], schemaVersion: 1, createdAt: '2025-01-01T00:00:00.000Z' };
    saveProfile(profile1);
    saveProfile(profile2);
    const result = listProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Updated');
  });

  it('getProfile returns the profile by id, null if not found', () => {
    const profile = { id: 'test-1', name: 'Test', gender: 'female', moduleAnswers: { core: ['', '', ''] }, enabledModules: [], schemaVersion: 1, createdAt: '2025-01-01T00:00:00.000Z' };
    saveProfile(profile);
    expect(getProfile('test-1')).toEqual(profile);
    expect(getProfile('nonexistent')).toBeNull();
  });

  it('deleteProfile returns true when removed, false if not found', () => {
    const profile = { id: 'test-1', name: 'Test', gender: 'male', moduleAnswers: { core: ['', '', ''] }, enabledModules: [], schemaVersion: 1, createdAt: '2025-01-01T00:00:00.000Z' };
    saveProfile(profile);
    expect(deleteProfile('test-1')).toBe(true);
    expect(listProfiles()).toHaveLength(0);
    expect(deleteProfile('test-1')).toBe(false);
  });

  it('corruption recovery: invalid JSON returns [] and logs warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockStorage._store.set(STORAGE_KEY, '{{not valid json');
    const result = listProfiles();
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
