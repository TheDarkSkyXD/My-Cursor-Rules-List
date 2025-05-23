import { memoize } from '../../lib/utils/Memoization';

describe('Memoization Utility', () => {
  it('should cache results of a function', () => {
    const mockFn = jest.fn((x: number) => x * 2);
    const memoizedFn = memoize(mockFn);

    expect(memoizedFn(2)).toBe(4);
    expect(memoizedFn(2)).toBe(4);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should recompute for different arguments', () => {
    const mockFn = jest.fn((x: number) => x * 2);
    const memoizedFn = memoize(mockFn);

    expect(memoizedFn(2)).toBe(4);
    expect(memoizedFn(3)).toBe(6);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});