import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { HouseholdProvider, useHousehold } from '@/lib/context/HouseholdContext';
import { LoadingProvider } from '@/lib/context/LoadingContext';

describe('HouseholdContext Performance Tests', () => {
  it('should not re-render unnecessarily', () => {
    const renderCount = jest.fn();

    const CombinedWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoadingProvider>
        <HouseholdProvider>{children}</HouseholdProvider>
      </LoadingProvider>
    );

    const { result, rerender } = renderHook(() => {
      renderCount();
      return useHousehold();
    }, {
      wrapper: CombinedWrapper,
    });

    expect(renderCount).toHaveBeenCalledTimes(1);

    rerender();

    expect(renderCount).toHaveBeenCalledTimes(1); // No re-render expected
  });
});