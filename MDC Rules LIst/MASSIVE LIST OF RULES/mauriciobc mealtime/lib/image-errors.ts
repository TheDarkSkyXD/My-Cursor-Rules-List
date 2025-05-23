export class ImageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ImageError';
  }
}

export class ImageValidationError extends ImageError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ImageValidationError';
  }
}

export class ImageProcessingError extends ImageError {
  constructor(message: string) {
    super(message, 'PROCESSING_ERROR');
    this.name = 'ImageProcessingError';
  }
}

export class ImageCacheError extends ImageError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR');
    this.name = 'ImageCacheError';
  }
}

export class ImageUploadError extends ImageError {
  constructor(message: string) {
    super(message, 'UPLOAD_ERROR');
    this.name = 'ImageUploadError';
  }
}

// Função para gerar URL de fallback baseada no tipo de imagem
export function getFallbackImageUrl(type: 'user' | 'cat' | 'thumbnail'): string {
  switch (type) {
    case 'user':
      return `https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=random`;
    case 'cat':
      return `https://api.dicebear.com/7.x/bottts/svg?seed=cat&backgroundColor=random`;
    case 'thumbnail':
      return `https://api.dicebear.com/7.x/bottts/svg?seed=thumb&backgroundColor=random`;
  }
}

// Função para verificar se uma URL é uma imagem de fallback
export function isFallbackImage(url: string): boolean {
  return url.includes('dicebear.com');
}

// Função para formatar mensagens de erro para o usuário
export function formatErrorMessage(error: Error): string {
  if (error instanceof ImageError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 'A imagem não atende aos requisitos. Por favor, verifique o tamanho e formato.';
      case 'PROCESSING_ERROR':
        return 'Não foi possível processar a imagem. Por favor, tente novamente.';
      case 'CACHE_ERROR':
        return 'Erro ao acessar o cache de imagens. Por favor, tente novamente.';
      case 'UPLOAD_ERROR':
        return 'Erro ao fazer upload da imagem. Por favor, tente novamente.';
      default:
        return 'Ocorreu um erro ao processar a imagem. Por favor, tente novamente.';
    }
  }
  return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
} 