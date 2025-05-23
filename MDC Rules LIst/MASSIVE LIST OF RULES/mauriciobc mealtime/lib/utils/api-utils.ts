import { cache } from 'react';

// Função para obter parâmetros de forma assíncrona usando cache
export const getParams = cache(async <T extends Record<string, string>>(params: T): Promise<T> => {
  return await Promise.resolve(params);
});

// Função para obter um ID numérico de forma assíncrona
export const getNumericId = cache(async (id: string): Promise<number> => {
  const numericId = parseInt(await Promise.resolve(id));
  if (isNaN(numericId)) {
    throw new Error('ID inválido');
  }
  return numericId;
}); 