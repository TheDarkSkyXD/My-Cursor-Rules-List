import { NextRequest } from 'next/server';
import { GET } from './route';
import prisma from "@/lib/prisma";

// Mock prisma findMany
jest.mock('@/lib/prisma', () => ({
  feeding_logs: {
    findMany: jest.fn(),
  },
}));

describe('Feeding Stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock data setup
  const mockFeedings = [
    {
      id: '1',
      meal_type: 'Breakfast',
      amount: 100,
      fed_at: new Date('2023-01-01T08:00:00Z'),
      cat_id: 'cat-1',
      cat: { name: 'Whiskers' }
    },
    {
      id: '2',
      meal_type: 'Dinner',
      amount: 150,
      fed_at: new Date('2023-01-01T18:00:00Z'),
      cat_id: 'cat-1',
      cat: { name: 'Whiskers' }
    },
    {
      id: '3',
      meal_type: 'Breakfast',
      amount: 90,
      fed_at: new Date('2023-01-02T08:00:00Z'),
      cat_id: 'cat-2',
      cat: { name: 'Mittens' }
    },
    {
      id: '4',
      meal_type: 'Snack',
      amount: 50,
      fed_at: new Date('2023-01-02T14:00:00Z'),
      cat_id: 'cat-1',
      cat: { name: 'Whiskers' }
    },
  ];

  it('should return 401 if no user ID is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/feedings/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Authentication required',
      details: 'User ID is missing'
    });
  });

  it('should return 400 for invalid query parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/feedings/stats?days=invalid');
    request.headers.set = jest.fn().mockImplementation((name, value) => {});
    request.headers.get = jest.fn().mockImplementation((name) => {
      if (name === 'X-User-ID') return 'user-1';
      return null;
    });
    
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should return statistics for all cats', async () => {
    // Mock the current date to have predictable results
    const realDate = Date;
    global.Date = class extends Date {
      constructor(date?: any) {
        if (date) {
          super(date);
        } else {
          super('2023-01-07T00:00:00Z');
        }
      }
    } as any;

    (prisma.feeding_logs.findMany as jest.Mock).mockResolvedValue(mockFeedings);
    
    const request = new NextRequest('http://localhost:3000/api/feedings/stats?days=7');
    request.headers.get = jest.fn().mockImplementation((name) => {
      if (name === 'X-User-ID') return 'user-1';
      return null;
    });
    
    const response = await GET(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.period.days).toBe(7);
    expect(data.totals.feedings).toBe(4);
    expect(data.totals.dailyAverage).toBe(0.57); // 4 feedings / 7 days
    
    // Reset Date
    global.Date = realDate;
  });

  it('should return statistics for a specific cat', async () => {
    // Mock the current date
    const realDate = Date;
    global.Date = class extends Date {
      constructor(date?: any) {
        if (date) {
          super(date);
        } else {
          super('2023-01-07T00:00:00Z');
        }
      }
    } as any;

    (prisma.feeding_logs.findMany as jest.Mock).mockResolvedValue([
      mockFeedings[0], mockFeedings[1], mockFeedings[3]
    ]);
    
    const request = new NextRequest('http://localhost:3000/api/feedings/stats?catId=cat-1&days=7');
    request.headers.get = jest.fn().mockImplementation((name) => {
      if (name === 'X-User-ID') return 'user-1';
      return null;
    });
    
    const response = await GET(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.totals.feedings).toBe(3);
    expect(data.catStats.length).toBe(1);
    expect(data.catStats[0].id).toBe('cat-1');
    expect(data.catStats[0].name).toBe('Whiskers');
    expect(data.catStats[0].totalFeedings).toBe(3);
    
    // Reset Date
    global.Date = realDate;
  });

  it('should handle errors gracefully', async () => {
    (prisma.feeding_logs.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
    
    const request = new NextRequest('http://localhost:3000/api/feedings/stats');
    request.headers.get = jest.fn().mockImplementation((name) => {
      if (name === 'X-User-ID') return 'user-1';
      return null;
    });
    
    const response = await GET(request);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch feeding statistics');
    expect(data.details).toBe('Database connection failed');
  });
}); 