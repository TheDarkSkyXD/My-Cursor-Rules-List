import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

function isSSR(): boolean {
  return typeof window === 'undefined';
}

function readValue<T>(key: string, defaultValue: T): T {
  if (isSSR()) {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item && item.trim() !== '' ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Erro ao ler localStorage (chave: ${key}):`, error);
    return defaultValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue));

  const setValue: SetValue<T> = useCallback(
    (value) => {
      if (isSSR()) {
        console.warn(
          `Não foi possível salvar "${key}" no localStorage, pois o código está sendo executado no servidor.`
        );
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
        
        window.dispatchEvent(new StorageEvent('storage', { key }));
      } catch (error) {
        console.warn(`Erro ao salvar "${key}" no localStorage:`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    if (isSSR()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        setStoredValue(readValue(key, initialValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue];
} 