/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { imageCache } from '@/lib/image-cache';
import { middleware } from '../../middleware';

// Mock NextAuth
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn()
}));

// Mock image cache
jest.mock('@/lib/image-cache', () => ({
  imageCache: {
    get: jest.fn(),
    set: jest.fn(),
    getStats: jest.fn()
  }
}));

describe('Image Retrieval', () => {
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

  describe('GET /profiles/*', () => {
    it('should return cached image with correct headers', async () => {
      // Arrange
      const imageData = Buffer.from('fake image data');
      const pathname = '/profiles/humans/test-image.jpg';
      const cachePath = pathname.slice(1); // Remove leading slash
      (imageCache.get as jest.Mock).mockResolvedValue(imageData);

      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).toHaveBeenCalledWith(cachePath);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
      
      const responseData = await response.arrayBuffer();
      expect(Buffer.from(responseData)).toEqual(imageData);
    });

    it('should handle cache miss gracefully', async () => {
      // Arrange
      const pathname = '/profiles/humans/non-existent.jpg';
      const cachePath = pathname.slice(1);
      (imageCache.get as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).toHaveBeenCalledWith(cachePath);
      expect(response.status).toBe(404);
    });

    it('should handle cache errors gracefully', async () => {
      // Arrange
      const pathname = '/profiles/humans/error.jpg';
      const cachePath = pathname.slice(1);
      (imageCache.get as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).toHaveBeenCalledWith(cachePath);
      expect(response.status).toBe(500);
    });

    it('should handle different image types', async () => {
      // Test cases for different image types
      const testCases = [
        { path: '/profiles/humans/user.jpg', type: 'user' },
        { path: '/profiles/cats/cat.jpg', type: 'cat' },
        { path: '/profiles/thumbnails/thumb.jpg', type: 'thumbnail' }
      ];

      for (const { path, type } of testCases) {
        // Arrange
        const imageData = Buffer.from(`fake ${type} image data`);
        const cachePath = path.slice(1);
        (imageCache.get as jest.Mock).mockResolvedValue(imageData);

        const request = new NextRequest(`http://localhost:3000${path}`);

        // Act
        const response = await middleware(request);

        // Assert
        expect(imageCache.get).toHaveBeenCalledWith(cachePath);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/jpeg');
        
        const responseData = await response.arrayBuffer();
        expect(Buffer.from(responseData)).toEqual(imageData);
      }
    });

    it('should pass through non-profile paths to next middleware', async () => {
      // Arrange
      const pathname = '/api/some/other/path';
      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).not.toHaveBeenCalled();
      // The response should be a NextResponse.next() response
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });
  });

  describe('GET /profiles/cats/:id', () => {
    it('should retrieve a specific cat image successfully', async () => {
      // Arrange
      const catId = '123';
      const imageData = Buffer.from('cat image data');
      const pathname = `/profiles/cats/${catId}.jpg`;
      const cachePath = pathname.slice(1);
      (imageCache.get as jest.Mock).mockResolvedValue(imageData);

      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).toHaveBeenCalledWith(cachePath);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
      
      const responseData = await response.arrayBuffer();
      expect(Buffer.from(responseData)).toEqual(imageData);
    });

    it('should handle non-existent cat image', async () => {
      // Arrange
      const catId = 'non-existent';
      const pathname = `/profiles/cats/${catId}.jpg`;
      const cachePath = pathname.slice(1);
      (imageCache.get as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).toHaveBeenCalledWith(cachePath);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Image not found');
    });

    it('should handle cache error for cat image', async () => {
      // Arrange
      const catId = 'error-cat';
      const pathname = `/profiles/cats/${catId}.jpg`;
      const cachePath = pathname.slice(1);
      (imageCache.get as jest.Mock).mockRejectedValue(new Error('Cache error for cat image'));

      const request = new NextRequest(`http://localhost:3000${pathname}`);

      // Act
      const response = await middleware(request);

      // Assert
      expect(imageCache.get).toHaveBeenCalledWith(cachePath);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
    });

    it('should handle cat image with different file extensions', async () => {
      // Test cases for different file extensions
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      const catId = '123';

      for (const ext of extensions) {
        // Arrange
        const imageData = Buffer.from(`cat image data in ${ext}`);
        const pathname = `/profiles/cats/${catId}.${ext}`;
        const cachePath = pathname.slice(1);
        (imageCache.get as jest.Mock).mockResolvedValue(imageData);

        const request = new NextRequest(`http://localhost:3000${pathname}`);

        // Act
        const response = await middleware(request);

        // Assert
        expect(imageCache.get).toHaveBeenCalledWith(cachePath);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/jpeg');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
        
        const responseData = await response.arrayBuffer();
        expect(Buffer.from(responseData)).toEqual(imageData);
      }
    });
  });
}); 