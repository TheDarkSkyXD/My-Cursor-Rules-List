import { NextRequest } from 'next/server';
import { GET as GET_SCHEDULES, POST as POST_SCHEDULE } from '@/app/api/schedules/route';
import { GET as GET_SCHEDULE, PUT as PUT_SCHEDULE, DELETE as DELETE_SCHEDULE } from '@/app/api/schedules/[id]/route';

// In-memory mock for Prisma
const mockPrisma = {
  schedule: {
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

describe('/api/schedules route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/schedules', () => {
    it('returns a list of schedules', async () => {
      const schedules = [{ id: 1, name: 'Morning' }];
      mockPrisma.schedule.findMany.mockResolvedValue(schedules);
      const request = new NextRequest('http://localhost:3000/api/schedules');
      const response = await GET_SCHEDULES(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(schedules);
    });
    it('handles errors', async () => {
      mockPrisma.schedule.findMany.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/schedules');
      const response = await GET_SCHEDULES(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/schedules', () => {
    it('creates a schedule with valid data', async () => {
      const newSchedule = { name: 'Evening' };
      mockPrisma.schedule.create.mockResolvedValue({ id: 2, ...newSchedule });
      const request = new NextRequest('http://localhost:3000/api/schedules', { method: 'POST', body: JSON.stringify(newSchedule) });
      const response = await POST_SCHEDULE(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Evening');
    });
    it('returns 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/schedules', { method: 'POST', body: '{}' });
      const response = await POST_SCHEDULE(request);
      expect(response.status).toBe(400);
    });
    it('handles errors', async () => {
      mockPrisma.schedule.create.mockRejectedValue(new Error('fail'));
      const newSchedule = { name: 'Evening' };
      const request = new NextRequest('http://localhost:3000/api/schedules', { method: 'POST', body: JSON.stringify(newSchedule) });
      const response = await POST_SCHEDULE(request);
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/schedules/:id', () => {
    it('returns a schedule by id', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue({ id: 1, name: 'Morning' });
      const request = new NextRequest('http://localhost:3000/api/schedules/1');
      const response = await GET_SCHEDULE(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', 1);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/schedules/999');
      const response = await GET_SCHEDULE(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.schedule.findUnique.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/schedules/1');
      const response = await GET_SCHEDULE(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/schedules/:id', () => {
    it('updates a schedule with valid data', async () => {
      mockPrisma.schedule.update.mockResolvedValue({ id: 1, name: 'Updated' });
      const request = new NextRequest('http://localhost:3000/api/schedules/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_SCHEDULE(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Updated');
    });
    it('returns 404 if not found', async () => {
      mockPrisma.schedule.update.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/schedules/999', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_SCHEDULE(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.schedule.update.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/schedules/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_SCHEDULE(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('deletes a schedule by id', async () => {
      mockPrisma.schedule.delete.mockResolvedValue({ id: 1 });
      const request = new NextRequest('http://localhost:3000/api/schedules/1', { method: 'DELETE' });
      const response = await DELETE_SCHEDULE(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.schedule.delete.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/schedules/999', { method: 'DELETE' });
      const response = await DELETE_SCHEDULE(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.schedule.delete.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/schedules/1', { method: 'DELETE' });
      const response = await DELETE_SCHEDULE(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });
}); 