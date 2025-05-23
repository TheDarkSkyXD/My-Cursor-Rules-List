import { NextRequest } from 'next/server';
import { GET as GET_STATISTICS } from '@/app/api/statistics/route';

// In-memory mock for Prisma
const mockPrisma = {
  statistics: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('/api/statistics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/statistics', () => {
    it('returns a list of statistics', async () => {
      const stats = [{ id: 1, value: 42 }];
      mockPrisma.statistics.findMany.mockResolvedValue(stats);
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET_STATISTICS(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(stats);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.statistics.findMany.mockResolvedValue([]);
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET_STATISTICS(request);
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.statistics.findMany.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET_STATISTICS(request);
      expect(response.status).toBe(500);
    });
  });
}); 