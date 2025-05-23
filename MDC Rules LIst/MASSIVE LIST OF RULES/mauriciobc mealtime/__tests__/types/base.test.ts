import '@testing-library/jest-dom';
import { BaseCats, BaseFeedingLogs, BaseProfile, ID } from '@/lib/types/common';

describe('BaseCats', () => {
  it('should create a valid BaseCats object', () => {
    const cat: BaseCats = {
      id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      name: 'Whiskers',
      birth_date: new Date('2020-01-01'),
      weight: 4.5,
      household_id: '1',
      owner_id: '1'
    };
    expect(cat).toBeDefined();
    expect(cat.id).toBe('1');
    expect(cat.name).toBe('Whiskers');
  });

  it('should handle optional fields', () => {
    const cat: BaseCats = {
      id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      name: 'Whiskers',
      household_id: '1',
      owner_id: '1'
    };
    expect(cat).toBeDefined();
    expect(cat.birth_date).toBeUndefined();
    expect(cat.weight).toBeUndefined();
  });
});

describe('BaseFeedingLogs', () => {
  it('should create a valid BaseFeedingLogs object', () => {
    const log: BaseFeedingLogs = {
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
    };
    expect(log).toBeDefined();
    expect(log.id).toBe('1');
    expect(log.meal_type).toBe('Breakfast');
  });

  it('should handle optional fields', () => {
    const log: BaseFeedingLogs = {
      id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      cat_id: '1',
      household_id: '1',
      meal_type: 'Breakfast',
      amount: 100,
      unit: 'g',
      fed_at: new Date()
    };
    expect(log).toBeDefined();
    expect(log.notes).toBeUndefined();
    expect(log.fed_by).toBeUndefined();
  });
});

describe('BaseProfile', () => {
  it('should create a valid BaseProfile object', () => {
    const profile: BaseProfile = {
      id: '1',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      email: 'test@example.com',
      updated_at: new Date()
    };
    expect(profile).toBeDefined();
    expect(profile.id).toBe('1');
    expect(profile.username).toBe('testuser');
  });

  it('should handle optional fields', () => {
    const profile: BaseProfile = {
      id: '1'
    };
    expect(profile).toBeDefined();
    expect(profile.username).toBeUndefined();
    expect(profile.full_name).toBeUndefined();
    expect(profile.avatar_url).toBeUndefined();
    expect(profile.email).toBeUndefined();
    expect(profile.updated_at).toBeUndefined();
  });
});

describe('ID type', () => {
  it('should accept number values', () => {
    const id: ID = 1;
    expect(id).toBe(1);
  });

  it('should accept string values', () => {
    const id: ID = '1';
    expect(id).toBe('1');
  });
}); 