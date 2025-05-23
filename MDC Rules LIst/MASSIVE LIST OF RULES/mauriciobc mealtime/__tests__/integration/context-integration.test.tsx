import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { HouseholdProvider, useHousehold } from '@/lib/context/HouseholdContext';
import { LoadingProvider } from '@/lib/context/LoadingContext';

// Create a wrapper that includes both providers
const CombinedWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <LoadingProvider>
      <HouseholdProvider>{children}</HouseholdProvider>
    </LoadingProvider>
  );
};

describe('HouseholdContext Integration Tests', () => {
  it('should provide default values', () => {
    const { result } = renderHook(() => useHousehold(), {
      wrapper: CombinedWrapper,
    });

    expect(result.current.household).toBe(null);
    expect(typeof result.current.setHousehold).toBe('function');
  });

  it('should update household state', () => {
    const { result } = renderHook(() => useHousehold(), {
      wrapper: CombinedWrapper,
    });

    act(() => {
      result.current.setHousehold({ id: '1', name: 'Test Household' });
    });

    expect(result.current.household).toEqual({ id: '1', name: 'Test Household' });
  });
});