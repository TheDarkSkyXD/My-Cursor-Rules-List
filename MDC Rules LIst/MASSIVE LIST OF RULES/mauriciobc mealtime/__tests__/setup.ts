import { TextEncoder, TextDecoder } from 'util';
import { Blob, File } from 'buffer';
import '@testing-library/jest-dom';

// Setup globals needed for Next.js tests
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.Blob = Blob as any;
global.File = File as any;

// Mock fetch
global.fetch = jest.fn();

// Setup Request/Response/Headers for Next.js
if (typeof Request === 'undefined') {
  Object.defineProperty(global, 'Request', {
    value: class Request {
      constructor(input: string | Request, init?: RequestInit) {}
    },
    writable: true
  });
}

if (typeof Response === 'undefined') {
  Object.defineProperty(global, 'Response', {
    value: class Response {
      constructor(body?: BodyInit | null, init?: ResponseInit) {}
    },
    writable: true
  });
}

if (typeof Headers === 'undefined') {
  Object.defineProperty(global, 'Headers', {
    value: class Headers {
      constructor(init?: HeadersInit) {}
    },
    writable: true
  });
} 