/// <reference types="@testing-library/jest-dom" />
import {
  getCatsByHouseholdId,
  getCatById,
  createCat,
  updateCat,
  deleteCat,
  getFeedingLogs,
  getUserById,
  createFeedingLog
} from '@/lib/services/apiService';
import { BaseCats, BaseFeedingLogs, BaseProfile } from '@/lib/types/common';

// Mock data
const mockCats: BaseCats[] = [
  {
    id: '1',
    created_at: new Date(),
    updated_at: new Date(),
    name: 'Whiskers',
    birth_date: new Date('2020-01-01'),
    weight: 4.5,
    household_id: '1',
    owner_id: '1'
  }
];

const mockFeedingLogs: BaseFeedingLogs[] = [
  {
    id: '1',
    created_at: new Date(),
    updated_at: new Date(),
    cat_id: '1',
    household_id: '1',
    meal_type: 'Breakfast',
    amount: 100,
    unit: 'g',
    notes: 'Ate well',
    fed_by: '1',
    fed_at: new Date()
  }
];

const mockProfiles: BaseProfile[] = [
  {
    id: '1',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    email: 'test@example.com',
    updated_at: new Date()
  }
];

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn((key: string) => {
    switch (key) {
      case 'cats':
        return JSON.stringify(mockCats);
      case 'feedingLogs':
        return JSON.stringify(mockFeedingLogs);
      case 'profiles':
        return JSON.stringify(mockProfiles);
      default:
        return null;
    }
  }),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCats }),
    });
  });

  describe('getCatsByHouseholdId', () => {
    it('should return all cats for a household', async () => {
      const result = await getCatsByHouseholdId('1', 'user-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id', mockCats[0].id);
      expect(result[0]).toHaveProperty('name', mockCats[0].name);
      expect(result[0]).toHaveProperty('householdId', mockCats[0].household_id);
      expect(result[0]).toHaveProperty('birthdate');
      expect(result[0]).toHaveProperty('weight', mockCats[0].weight);
      expect(global.fetch).toHaveBeenCalledWith('/api/households/1/cats', expect.objectContaining({ headers: expect.any(Object) }));
    });

    it('should return empty array when no cats found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      const result = await getCatsByHouseholdId('1', 'user-1');
      expect(result).toEqual([]);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not found'),
      });
      await expect(getCatsByHouseholdId('1', 'user-1')).rejects.toThrow();
    });
  });

  describe('getCatById', () => {
    it('should return a cat by id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockCats[0], createdAt: new Date().toISOString() }),
      });
      const result = await getCatById('1');
      expect(result).toHaveProperty('id', mockCats[0].id);
      expect(result).toHaveProperty('name', mockCats[0].name);
    });

    it('should return null on fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      const result = await getCatById('999');
      expect(result).toBeNull();
    });
  });

  describe('createCat', () => {
    it('should create a new cat and update storage', async () => {
      const newCat = {
        name: 'Mittens',
        birthdate: new Date('2021-01-01'),
        weight: 3.2,
        householdId: '1',
        owner_id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        photo_url: null,
        restrictions: null,
        notes: null,
        feedingInterval: null,
        portion_size: null,
        schedules: [],
      };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([]));
      mockLocalStorage.setItem.mockClear();
      const result = await createCat(newCat as any);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Mittens');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should update household cats array if householdId is present', async () => {
      const newCat = {
        name: 'Tiger',
        birthdate: new Date('2022-01-01'),
        weight: 4.0,
        householdId: '1',
        owner_id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        photo_url: null,
        restrictions: null,
        notes: null,
        feedingInterval: null,
        portion_size: null,
        schedules: [],
      };
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify([])) // cats
        .mockReturnValueOnce(JSON.stringify([{ id: '1', cats: [] }])) // households
        .mockReturnValueOnce(JSON.stringify([])); // fallback
      mockLocalStorage.setItem.mockClear();
      await createCat(newCat as any);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateCat', () => {
    it('should update a cat via API and localStorage', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Updated Cat', schedules: [] }),
      });
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([{ id: 1, name: 'Old Cat', schedules: [] }]));
      mockLocalStorage.setItem.mockClear();
      const result = await updateCat('1', { name: 'Updated Cat' });
      expect(result).toHaveProperty('name', 'Updated Cat');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should throw on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      await expect(updateCat('1', { name: 'Fail Cat' })).rejects.toThrow();
    });
  });

  describe('deleteCat', () => {
    it('should delete a cat and update storage', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([{ id: 1, householdId: '1' }]));
      mockLocalStorage.setItem.mockClear();
      await deleteCat('1');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should throw if cat not found', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([]));
      await expect(deleteCat('999')).rejects.toThrow();
    });
  });

  describe('getFeedingLogs', () => {
    it('should return all feeding logs', async () => {
      const result = await getFeedingLogs('1', 'America/Sao_Paulo');
      expect(result).toEqual(mockFeedingLogs);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('feedingLogs');
    });

    it('should return filtered feeding logs', async () => {
      // Assuming filtering logic exists and works as expected based on other params
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockFeedingLogs));
      const result = await getFeedingLogs('1', 'America/Sao_Paulo');
      expect(result).toEqual([mockFeedingLogs[0]]); 
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('feedingLogs');
    });

    it('should return empty array when no logs found', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const result = await getFeedingLogs('1', 'America/Sao_Paulo');
      expect(result).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('feedingLogs');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const result = await getUserById(1, mockProfiles);
      expect(result).toEqual(mockProfiles[0]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('profiles');
    });

    it('should return null when user not found', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const result = await getUserById(999, mockProfiles);
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('profiles');
    });
  });

  describe('createFeedingLog', () => {
    const mockLog = {
      cat_id: '1',
      household_id: '1',
      meal_type: 'Breakfast',
      amount: 100,
      unit: 'g',
      notes: 'Ate well',
      fed_by: '1',
      fed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should create a feeding log and return mapped object', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'log-1',
          cat_id: '1',
          fed_by: '1',
          fed_at: mockLog.fed_at,
          amount: 100,
          notes: 'Ate well',
          meal_type: 'Breakfast',
          household_id: '1',
          feeder: { id: '1', full_name: 'Test User', avatar_url: 'avatar.png' },
          created_at: mockLog.created_at,
        }),
      });
      const result = await createFeedingLog(mockLog as any, '1');
      expect(result).toHaveProperty('id', 'log-1');
      expect(result).toHaveProperty('catId', '1');
      expect(result).toHaveProperty('userId', '1');
      expect(result.user).toEqual({ id: '1', name: 'Test User', avatar: 'avatar.png' });
      expect(result.mealType).toBe('Breakfast');
    });

    it('should throw on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });
      await expect(createFeedingLog(mockLog as any, '1')).rejects.toThrow();
    });

    it('should warn if userId is missing but still attempt API call', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'log-2',
          cat_id: '1',
          fed_by: '1',
          fed_at: mockLog.fed_at,
          amount: 100,
          notes: 'Ate well',
          meal_type: 'Breakfast',
          household_id: '1',
          feeder: { id: '1', full_name: 'Test User', avatar_url: 'avatar.png' },
          created_at: mockLog.created_at,
        }),
      });
      const result = await createFeedingLog(mockLog as any);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('User ID not provided'));
      expect(result).toHaveProperty('id', 'log-2');
      warnSpy.mockRestore();
    });
  });
});

describe('getData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns parsed array from localStorage', async () => {
    const data = [{ id: 1, name: 'Test' }];
    localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(data));
    const result = await getData('testKey');
    expect(result).toEqual(data);
  });
  it('returns empty array if localStorage is empty', async () => {
    localStorage.getItem = jest.fn().mockReturnValue('');
    const result = await getData('testKey');
    expect(result).toEqual([]);
  });
  it('returns empty array if parsed value is not an array', async () => {
    localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify({ foo: 'bar' }));
    const result = await getData('testKey');
    expect(result).toEqual([]);
  });
  it('returns empty array and removes item if JSON.parse fails', async () => {
    localStorage.getItem = jest.fn().mockReturnValue('not-json');
    localStorage.removeItem = jest.fn();
    const result = await getData('testKey');
    expect(result).toEqual([]);
    expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
  });
  it('returns empty array if localStorage throws', async () => {
    localStorage.getItem = jest.fn(() => { throw new Error('fail'); });
    const result = await getData('testKey');
    expect(result).toEqual([]);
  });
});

describe('setData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('sets and returns data in localStorage', async () => {
    localStorage.setItem = jest.fn();
    const data = [{ id: 1, name: 'Test' }];
    const result = await setData('testKey', data);
    expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(data));
    expect(result).toEqual(data);
  });
  it('throws and logs error if setItem fails', async () => {
    localStorage.setItem = jest.fn(() => { throw new Error('fail'); });
    const data = [{ id: 1 }];
    await expect(setData('testKey', data)).rejects.toThrow('Failed to save testKey');
  });
}); 