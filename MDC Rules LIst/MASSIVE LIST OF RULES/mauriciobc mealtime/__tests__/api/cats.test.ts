import { NextRequest } from 'next/server';
import { GET as GET_CATS, POST as POST_CAT } from '@/app/api/cats/route';
import { GET as GET_CAT, PUT as PUT_CAT, DELETE as DELETE_CAT } from '@/app/api/cats/[catId]/route';

// In-memory mock for Prisma
const mockPrisma = {
  cat: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('/api/cats route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cats', () => {
    it('returns a list of cats', async () => {
      const cats = [{ id: 1, name: 'Whiskers' }];
      mockPrisma.cat.findMany.mockResolvedValue(cats);
      const request = new NextRequest('http://localhost:3000/api/cats');
      const response = await GET_CATS(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(cats);
    });
    it('handles errors', async () => {
      mockPrisma.cat.findMany.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/cats');
      const response = await GET_CATS(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/cats', () => {
    it('creates a cat with valid data', async () => {
      const newCat = { name: 'Tiger' };
      mockPrisma.cat.create.mockResolvedValue({ id: 2, ...newCat });
      const request = new NextRequest('http://localhost:3000/api/cats', { method: 'POST', body: JSON.stringify(newCat) });
      const response = await POST_CAT(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Tiger');
    });
    it('returns 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/cats', { method: 'POST', body: '{}' });
      const response = await POST_CAT(request);
      expect(response.status).toBe(400);
    });
    it('handles errors', async () => {
      mockPrisma.cat.create.mockRejectedValue(new Error('fail'));
      const newCat = { name: 'Tiger' };
      const request = new NextRequest('http://localhost:3000/api/cats', { method: 'POST', body: JSON.stringify(newCat) });
      const response = await POST_CAT(request);
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/cats/:catId', () => {
    it('returns a cat by id', async () => {
      mockPrisma.cat.findUnique.mockResolvedValue({ id: 1, name: 'Whiskers' });
      const request = new NextRequest('http://localhost:3000/api/cats/1');
      const response = await GET_CAT(request, { params: { catId: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', 1);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.cat.findUnique.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/cats/999');
      const response = await GET_CAT(request, { params: { catId: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.cat.findUnique.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/cats/1');
      const response = await GET_CAT(request, { params: { catId: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/cats/:catId', () => {
    it('updates a cat with valid data', async () => {
      mockPrisma.cat.update.mockResolvedValue({ id: 1, name: 'Updated' });
      const request = new NextRequest('http://localhost:3000/api/cats/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_CAT(request, { params: { catId: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Updated');
    });
    it('returns 404 if not found', async () => {
      mockPrisma.cat.update.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/cats/999', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_CAT(request, { params: { catId: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.cat.update.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/cats/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_CAT(request, { params: { catId: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/cats/:catId', () => {
    it('deletes a cat by id', async () => {
      mockPrisma.cat.delete.mockResolvedValue({ id: 1 });
      const request = new NextRequest('http://localhost:3000/api/cats/1', { method: 'DELETE' });
      const response = await DELETE_CAT(request, { params: { catId: '1' } });
      expect(response.status).toBe(200);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.cat.delete.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/cats/999', { method: 'DELETE' });
      const response = await DELETE_CAT(request, { params: { catId: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.cat.delete.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/cats/1', { method: 'DELETE' });
      const response = await DELETE_CAT(request, { params: { catId: '1' } });
      expect(response.status).toBe(500);
    });
  });
}); 