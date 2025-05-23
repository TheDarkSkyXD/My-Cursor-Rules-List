import { NextRequest } from 'next/server';
import { GET as GET_GOALS, POST as POST_GOAL } from '@/app/api/goals/route';
// Assume dynamic import for [id] routes if present
import { GET as GET_GOAL, PUT as PUT_GOAL, DELETE as DELETE_GOAL } from '@/app/api/goals/[id]/route';

// In-memory mock for Prisma
const mockPrisma = {
  goal: {
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

describe('/api/goals route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/goals', () => {
    it('returns a list of goals', async () => {
      const goals = [{ id: 1, name: 'Lose Weight' }];
      mockPrisma.goal.findMany.mockResolvedValue(goals);
      const request = new NextRequest('http://localhost:3000/api/goals');
      const response = await GET_GOALS(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(goals);
    });
    it('handles errors', async () => {
      mockPrisma.goal.findMany.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/goals');
      const response = await GET_GOALS(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/goals', () => {
    it('creates a goal with valid data', async () => {
      const newGoal = { name: 'Gain Muscle' };
      mockPrisma.goal.create.mockResolvedValue({ id: 2, ...newGoal });
      const request = new NextRequest('http://localhost:3000/api/goals', { method: 'POST', body: JSON.stringify(newGoal) });
      const response = await POST_GOAL(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Gain Muscle');
    });
    it('returns 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/goals', { method: 'POST', body: '{}' });
      const response = await POST_GOAL(request);
      expect(response.status).toBe(400);
    });
    it('handles errors', async () => {
      mockPrisma.goal.create.mockRejectedValue(new Error('fail'));
      const newGoal = { name: 'Gain Muscle' };
      const request = new NextRequest('http://localhost:3000/api/goals', { method: 'POST', body: JSON.stringify(newGoal) });
      const response = await POST_GOAL(request);
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/goals/:id', () => {
    it('returns a goal by id', async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: 1, name: 'Lose Weight' });
      const request = new NextRequest('http://localhost:3000/api/goals/1');
      const response = await GET_GOAL(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', 1);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.goal.findUnique.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/goals/999');
      const response = await GET_GOAL(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.goal.findUnique.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/goals/1');
      const response = await GET_GOAL(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/goals/:id', () => {
    it('updates a goal with valid data', async () => {
      mockPrisma.goal.update.mockResolvedValue({ id: 1, name: 'Updated' });
      const request = new NextRequest('http://localhost:3000/api/goals/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_GOAL(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Updated');
    });
    it('returns 404 if not found', async () => {
      mockPrisma.goal.update.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/goals/999', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_GOAL(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.goal.update.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/goals/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const response = await PUT_GOAL(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('deletes a goal by id', async () => {
      mockPrisma.goal.delete.mockResolvedValue({ id: 1 });
      const request = new NextRequest('http://localhost:3000/api/goals/1', { method: 'DELETE' });
      const response = await DELETE_GOAL(request, { params: { id: '1' } });
      expect(response.status).toBe(200);
    });
    it('returns 404 if not found', async () => {
      mockPrisma.goal.delete.mockRejectedValue({ code: 'P2025' });
      const request = new NextRequest('http://localhost:3000/api/goals/999', { method: 'DELETE' });
      const response = await DELETE_GOAL(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
    });
    it('handles errors', async () => {
      mockPrisma.goal.delete.mockRejectedValue(new Error('fail'));
      const request = new NextRequest('http://localhost:3000/api/goals/1', { method: 'DELETE' });
      const response = await DELETE_GOAL(request, { params: { id: '1' } });
      expect(response.status).toBe(500);
    });
  });
}); 