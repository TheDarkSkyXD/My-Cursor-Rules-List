import { StorageService } from '../../lib/utils/StorageService';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService();
    localStorage.clear();
  });

  it('should store and retrieve a value', () => {
    storage.set('key', 'value');
    expect(storage.get('key')).toBe('value');
  });

  it('should return null for a non-existent key', () => {
    expect(storage.get('nonExistentKey')).toBeNull();
  });

  it('should remove a key', () => {
    storage.set('key', 'value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });

  it('should clear all keys', () => {
    storage.set('key1', 'value1');
    storage.set('key2', 'value2');
    storage.clear();
    expect(storage.get('key1')).toBeNull();
    expect(storage.get('key2')).toBeNull();
  });
});