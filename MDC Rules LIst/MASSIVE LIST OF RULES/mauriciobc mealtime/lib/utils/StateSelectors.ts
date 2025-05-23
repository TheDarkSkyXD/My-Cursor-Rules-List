// Utility for creating state selectors to optimize re-renders
export function createSelector<T, R>(selector: (state: T) => R) {
  return selector;
}

// Example usage:
// const selectCatById = createSelector((state: CatsState) => (id: string) => state.cats.find(cat => cat.id === id));