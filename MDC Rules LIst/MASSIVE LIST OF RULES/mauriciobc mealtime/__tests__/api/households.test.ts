import { NextRequest } from 'next/server';
import { GET as GET_HOUSEHOLDS, POST as POST_HOUSEHOLD } from '@/app/api/households/route';
import { GET as GET_HOUSEHOLD, PUT as PUT_HOUSEHOLD, DELETE as DELETE_HOUSEHOLD } from '@/app/api/households/[id]/route';

// In-memory mock for Prisma
const mockPrisma = {
  household: {
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

describe('/api/households route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/households', () => {
    it('returns a list of households', async () => {
      const households = [{ id: 1, name: 'Home' }];
      mockPrisma.household.findMany.mockResolvedValue(households);
      const request = new NextRequest('http://localhost:3000/api/households');
      const response = await GET_HOUSEHOLDS(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(households);
    });
    it('handles errors', async () => {
      mockPrisma.household.findMany.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/households');
      const response = await GET_HOUSEHOLDS(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/households', () => {
    it('creates a household with valid data', async () => {
      const newHousehold = { name: 'Family' };
      mockPrisma.household.create.mockResolvedValue({ id: 2, ...newHousehold });
      const request = new NextRequest('http://localhost:3000/api/households', { method: 'POST', body: JSON.stringify(newHousehold) });
      const response = await POST_HOUSEHOLD(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Family');
    });
    it('returns 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/households', { method: 'POST', body: '{}' });
      const response = await POST_HOUSEHOLD(request);
      expect(response.status).toBe(400);
    });
    it('handles errors', async () => {
      mockPrisma.household.create.mockRejectedValue(new Error('fail'));
      const newHousehold = { name: 'Family' };
      const request = new NextRequest('http://localhost:3000/api/households', { method: 'POST', body: JSON.stringify(newHousehold) });
      const response = await POST_HOUSEHOLD(request);
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/households/:id', () => {
    it('returns a household by id', async () => {
      mockPrisma.household.findUnique.mockResolvedValue({ id: 1, name: 'Home' });
      const request = new NextRequest('http://localhost:3000/api/households/1');
      const response = await GET_HOUSEHOLD(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', 1);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/households/999');
      const response = await GET_HOUSEHOLD(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.household.findUnique.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/households/1');
      const response = await GET_HOUSEHOLD(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/households/:id', () => {
    it('updates a household with valid data', async () => {
      mockPrisma.household.update.mockResolvedValue({ id: 1, name: 'Updated' });
      const request = new NextRequest('http://localhost:3000/api/households/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_HOUSEHOLD(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Updated');
    });
    it('returns 404 if not found', async () => {
      mockPrisma.household.update.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/households/999', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_HOUSEHOLD(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.household.update.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/households/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_HOUSEHOLD(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/households/:id', () => {
    it('deletes a household by id', async () => {
      mockPrisma.household.delete.mockResolvedValue({ id: 1 });
      const request = new NextRequest('http://localhost:3000/api/households/1', { method: 'DELETE' });
      const response = await DELETE_HOUSEHOLD(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.household.delete.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/households/999', { method: 'DELETE' });
      const response = await DELETE_HOUSEHOLD(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.household.delete.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/households/1', { method: 'DELETE' });
      const response = await DELETE_HOUSEHOLD(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });
}); 