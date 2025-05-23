import { NextRequest } from 'next/server';
import { GET as GET_PROFILE, PUT as PUT_PROFILE, DELETE as DELETE_PROFILE } from '@/app/api/profile/[idOrUsername]/route';

// In-memory mock for Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('/api/profile/:idOrUsername route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profile/:idOrUsername', () => {
    it('returns a profile by idOrUsername', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, username: 'john' });
      const request = new NextRequest('http://localhost:3000/api/profile/john');
      const response = await GET_PROFILE(request, { params: { idOrUsername: 'john' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('username', 'john');
    });
    it('returns 404 if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/profile/unknown');
      const response = await GET_PROFILE(request, { params: { idOrUsername: 'unknown' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/profile/john');
      const response = await GET_PROFILE(request, { params: { idOrUsername: 'john' } });
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/profile/:idOrUsername', () => {
    it('updates a profile with valid data', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 1, username: 'john', fullName: 'John Doe' });
      const request = new NextRequest('http://localhost:3000/api/profile/john', { method: 'PUT', body: JSON.stringify({ fullName: 'John Doe' }) });
      const response = await PUT_PROFILE(request, { params: { idOrUsername: 'john' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('fullName', 'John Doe');
    });
    it('returns 404 if not found', async () => {
      mockPrisma.user.update.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/profile/unknown', { method: 'PUT', body: JSON.stringify({ fullName: 'John Doe' }) });
      const response = await PUT_PROFILE(request, { params: { idOrUsername: 'unknown' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/profile/john', { method: 'PUT', body: JSON.stringify({ fullName: 'John Doe' }) });
      const response = await PUT_PROFILE(request, { params: { idOrUsername: 'john' } });
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/profile/:idOrUsername', () => {
    it('deletes a profile by idOrUsername', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });
      const request = new NextRequest('http://localhost:3000/api/profile/john', { method: 'DELETE' });
      const response = await DELETE_PROFILE(request, { params: { idOrUsername: 'john' } });
      expect(response.status).toBe(200);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.user.delete.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/profile/unknown', { method: 'DELETE' });
      const response = await DELETE_PROFILE(request, { params: { idOrUsername: 'unknown' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/profile/john', { method: 'DELETE' });
      const response = await DELETE_PROFILE(request, { params: { idOrUsername: 'john' } });
      expect(response.status).toBe(500);
    });
  });
}); 