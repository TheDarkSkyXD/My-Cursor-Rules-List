import { imageCache } from '../../lib/image-cache';
import fsPromises from 'fs/promises';
import path from 'path';
import { ImageCacheError } from '@/lib/image-errors';
import fsSync from 'fs';

// --- Mocks ---

// Mock fs FIRST to control initializeCacheDir during import
jest.mock('fs', () => ({
  ...jest.requireActual('fs'), // Keep non-mocked parts like constants
  existsSync: jest.fn().mockReturnValue(true), // Mock sync methods directly
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
  // Mock async methods that will be promisified
  readFile: jest.fn(), 
  writeFile: jest.fn(),
  unlink: jest.fn(),
  // No need for promises property here as it's not used directly by image-cache
}));

// Mock fs/promises separately ONLY IF fs.promises is NOT used by image-cache directly
// If image-cache uses `import { readFile } from 'fs/promises'`, this is needed.
// If it uses `import fs from 'fs'; fs.promises.readFile`, the mock above is enough.
// Assuming it might use direct fs/promises imports:
// jest.mock('fs/promises', () => ({
//   readFile: jest.fn(),
//   writeFile: jest.fn(),
//   unlink: jest.fn(),
//   mkdir: jest.fn(),
//   stat: jest.fn(),
// }));

// Require the mocked fs module
const fs = require('fs') as jest.Mocked<typeof import('fs')>; 
// fsS alias isn't strictly needed anymore, but keep for clarity on sync calls
const fsS = fs;

const mockCacheDir = path.join(process.cwd(), 'tmp', 'image-cache');

// Helper to get internal cache map
const getInternalCacheMap = () => (imageCache as any).cache as Map<string, any>;

describe('ImageCache Library', () => {
    const testKey = 'user/test-image.webp';
    const testData = Buffer.from('test image data');
    const testType = 'user';
    const testFilePath = path.join(mockCacheDir, testKey);

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset internal cache map directly
        getInternalCacheMap().clear();
        // Reset internal size tracking if exists
        if (typeof (imageCache as any).currentSize !== 'undefined') {
            (imageCache as any).currentSize = 0;
        }
        
        // Reset default mock behaviors for fs operations using callback pattern
        fs.readFile.mockImplementation((_path, callback) => callback(null, testData));
        fs.writeFile.mockImplementation((_path, _data, callback) => callback(null));
        fs.unlink.mockImplementation((_path, callback) => callback(null));
        
        // Sync mocks remain the same
        fsS.statSync.mockReturnValue({ size: testData.length } as any);
        fsS.existsSync.mockReturnValue(true); // Default to exists
        fsS.mkdirSync.mockClear(); // Clear calls from potential init
    });

    describe('set', () => {
        it('should call writeFile with correct path and data', async () => {
            // Act
            await imageCache.set(testKey, testData, testType);
            
            // Assert
            expect(fs.writeFile).toHaveBeenCalledWith(testFilePath, testData, expect.any(Function)); // promisify adds callback
            expect(fs.writeFile).toHaveBeenCalledTimes(1);
        });

        it('should add entry to in-memory cache with correct metadata (using data.length for size)', async () => {
            // Act
            await imageCache.set(testKey, testData, testType);
            
            // Assert
            const cacheMap = getInternalCacheMap();
            expect(cacheMap.has(testKey)).toBe(true);
            const entry = cacheMap.get(testKey);
            expect(entry).toBeDefined();
            expect(entry.data).toEqual(testData);
            expect(entry.metadata).toBeDefined();
            expect(entry.metadata.size).toBe(testData.length); // Size comes from data.length on set
            expect(entry.metadata.type).toBe(testType);
            expect(entry.metadata.lastAccessed).toBeCloseTo(Date.now(), -2);
        });

        it('should reject with ImageCacheError wrapping original error if writeFile fails', async () => {
            // Arrange
            const writeError = new Error('Disk is full!');
            // Mock the base function to reject
            fs.writeFile.mockImplementationOnce((_path, _data, callback) => {
                callback(writeError);
            });
            
            // Act & Assert: Only one expect needed for the rejection
            await expect(imageCache.set(testKey, testData, testType))
                .rejects.toThrow(ImageCacheError); 
            // The second call was redundant and caused failure because the mock was consumed
        });

        it('should call unlink for LRU item when cache size exceeded after set', async () => {
            // Arrange
            const entrySize = 50;
            const smallData1 = Buffer.alloc(entrySize, 'a');
            const smallData2 = Buffer.alloc(entrySize, 'b');
            const key1 = 'key1.webp';
            const key2 = 'key2.webp';
            const filePath1 = path.join(mockCacheDir, key1);
            const filePath2 = path.join(mockCacheDir, key2); // Path for key2
            // Set maxSize slightly less than two entries
            (imageCache as any).maxSize = entrySize * 2 - 10; // 90
             // Ensure base unlink mock resolves for promisify
            fs.unlink.mockImplementation((_path, callback) => callback(null));
             
            // Reset cache before test
            getInternalCacheMap().clear();
             if (typeof (imageCache as any).currentSize !== 'undefined') {
                (imageCache as any).currentSize = 0;
             }

            // Act: Add first entry
            await imageCache.set(key1, smallData1, 'user'); 
            await new Promise(res => setTimeout(res, 5)); // Ensure different timestamp
            // Add second entry, which should trigger cleanup
            await imageCache.set(key2, smallData2, 'cat'); 

            // Assert: Based on implementation, key2 is removed, key1 stays
            const cacheMap = getInternalCacheMap();
            expect(cacheMap.has(key1)).toBe(true);  // Key1 should remain
            expect(cacheMap.has(key2)).toBe(false); // Key2 should be evicted (pushes over limit)
            expect(fs.unlink).toHaveBeenCalledTimes(1);
            // Check that the *correct* file was unlinked
            expect(fs.unlink).toHaveBeenCalledWith(filePath2, expect.any(Function)); 
        });
    });

    describe('get', () => {
        it('should return data from memory cache and update lastAccessed', async () => {
             // Arrange: Pre-populate memory cache
             const initialTimestamp = Date.now() - 10000;
             getInternalCacheMap().set(testKey, {
                 data: testData,
                 metadata: { lastAccessed: initialTimestamp, size: testData.length, type: testType }
             });
              if (typeof (imageCache as any).currentSize !== 'undefined') {
                (imageCache as any).currentSize = testData.length;
             }

             // Act
             const result = await imageCache.get(testKey);

             // Assert
             expect(result).toEqual(testData);
             expect(fs.readFile).not.toHaveBeenCalled();
             const updatedEntry = getInternalCacheMap().get(testKey);
             expect(updatedEntry.metadata.lastAccessed).toBeGreaterThan(initialTimestamp);
        });

        it('should read from disk, call statSync, update cache, and return data if not in memory', async () => {
             // Arrange: Ensure not in memory cache
             getInternalCacheMap().clear();
             if (typeof (imageCache as any).currentSize !== 'undefined') {
                (imageCache as any).currentSize = 0;
             }
             const diskFileSize = testData.length + 100; // Use a different size for statSync
             // Mock base readFile to resolve
             fs.readFile.mockImplementationOnce((_path, callback) => callback(null, testData));
             fsS.statSync.mockReturnValueOnce({ size: diskFileSize } as any);
             
             // Spy on and prevent cleanupCache from running for this specific test
             const cleanupSpy = jest.spyOn(imageCache as any, 'cleanupCache').mockResolvedValue(undefined);

             // Act
             const result = await imageCache.get(testKey);

             // Assert: Disk read and sync stat occurred
             expect(fs.readFile).toHaveBeenCalledWith(testFilePath, expect.any(Function)); // promisify adds callback
             expect(fsS.statSync).toHaveBeenCalledWith(testFilePath); 
             expect(result).toEqual(testData);
             // Assert: Cache is populated with data from readFile and size from statSync
             const cacheMap = getInternalCacheMap();
             expect(cacheMap.has(testKey)).toBe(true); // Item should now be in the map
             const entry = cacheMap.get(testKey);
             expect(entry.data).toEqual(testData);
             expect(entry.metadata.size).toBe(diskFileSize); // Size comes from statSync
             expect(entry.metadata.type).toMatch(/^(user|cat|thumbnail)$/);
             expect(entry.metadata.lastAccessed).toBeCloseTo(Date.now(), -2);

             // Restore the original cleanupCache method
             cleanupSpy.mockRestore();
        });

        it('should return null and not call statSync if readFile throws ENOENT', async () => {
            // Arrange
            getInternalCacheMap().clear();
            const readError = new Error('File not found');
            (readError as any).code = 'ENOENT';
            // Mock base readFile to reject with ENOENT
            fs.readFile.mockImplementationOnce((_path, callback) => callback(readError));

            // Act
            const result = await imageCache.get(testKey);

            // Assert
            expect(result).toBeNull();
            expect(fs.readFile).toHaveBeenCalledWith(testFilePath, expect.any(Function)); // promisify adds callback
            expect(fsS.statSync).not.toHaveBeenCalled();
        });

         it('should return null and not call statSync for other readFile errors', async () => {
            // Arrange
            getInternalCacheMap().clear();
            const readError = new Error('Read permission denied');
            // Mock base readFile to reject with other error
             fs.readFile.mockImplementationOnce((_path, callback) => callback(readError));

            // Act
             const result = await imageCache.get(testKey);

            // Assert
             expect(result).toBeNull();
             expect(fs.readFile).toHaveBeenCalledWith(testFilePath, expect.any(Function)); // promisify adds callback
             expect(fsS.statSync).not.toHaveBeenCalled();
        });
    });
}); 