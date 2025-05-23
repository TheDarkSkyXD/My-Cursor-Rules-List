import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import path from 'path';

// Mock NextAuth
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn()
}));

// Mock File class
class MockFile {
  name: string;
  type: string;
  private content: Buffer;

  constructor(content: Buffer, filename: string, type: string) {
    this.content = content;
    this.name = filename;
    this.type = type;
  }

  async arrayBuffer() {
    return this.content.buffer;
  }
}

// Mock FormData
class MockFormData {
  private data = new Map();

  append(key: string, value: any) {
    this.data.set(key, value);
  }

  get(key: string) {
    return this.data.get(key);
  }

  entries() {
    return this.data.entries();
  }
}

// Mock NextResponse and NextRequest
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data
    }))
  },
  NextRequest: jest.fn().mockImplementation((url, init) => {
    return {
      url,
      method: init?.method || 'GET',
      formData: jest.fn().mockResolvedValue(init?.body || new MockFormData()),
      nextUrl: new URL(url),
      headers: new Headers(init?.headers)
    };
  })
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined)
}));

// Mock image processing
jest.mock('../../src/lib/image-processing', () => ({
  validateImage: jest.fn().mockResolvedValue(undefined),
  processImage: jest.fn().mockResolvedValue('/profiles/humans/test-uuid.webp')
}));

// Mock image cache
jest.mock('../../src/lib/image-cache', () => ({
  imageCache: {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(Buffer.from('test')),
    getStats: jest.fn().mockReturnValue({ size: 1024 * 1024, count: 10 })
  }
}));

// Import the handlers after mocks
import { POST, GET } from '../../app/api/upload/route';

describe('Image API Endpoints', () => {
  const mockToken = {
    name: 'Test User',
    email: 'test@example.com',
    sub: '123',
    role: 'member'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue(mockToken);
  });

  describe('POST /api/upload', () => {
    it('should upload an image successfully', async () => {
      const formData = new MockFormData();
      const mockImageFile = new MockFile(
        Buffer.from('fake image data'),
        'test.jpg',
        'image/jpeg'
      );
      formData.append('file', mockImageFile);
      formData.append('type', 'user');

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('url');
      expect(data.url).toMatch(/^\/profiles\/humans\/.+\.webp$/);
    });

    it('should reject unauthorized requests', async () => {
      (getToken as jest.Mock).mockResolvedValue(null);

      const formData = new MockFormData();
      const mockImageFile = new MockFile(
        Buffer.from('fake image data'),
        'test.jpg',
        'image/jpeg'
      );
      formData.append('file', mockImageFile);
      formData.append('type', 'user');

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should validate image file type', async () => {
      const formData = new MockFormData();
      const mockTextFile = new MockFile(
        Buffer.from('not an image'),
        'test.txt',
        'text/plain'
      );
      formData.append('file', mockTextFile);
      formData.append('type', 'user');

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('O arquivo deve ser uma imagem');
    });
  });

  describe('GET /api/upload/cache/stats', () => {
    it('should return cache statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload/cache/stats');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('size');
      expect(data).toHaveProperty('count');
    });

    it('should reject unauthorized requests', async () => {
      (getToken as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/upload/cache/stats');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });
});