import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { ImageValidationError, ImageProcessingError } from './image-errors';

// Tipos de imagem suportados
export type ImageType = 'user' | 'cat' | 'thumbnail';

// Configurações de tamanho para cada tipo de imagem
const imageConfigs = {
  user: { width: 400, height: 400 },
  cat: { width: 300, height: 300 },
  thumbnail: { width: 150, height: 150 }
} as const;

// Diretórios base para armazenamento
const baseDir = path.join(process.cwd(), 'public');

// Função para garantir que o diretório existe
const ensureDirectoryExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Função para gerar nome único de arquivo
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  return `${timestamp}-${random}${extension}`;
};

// Função principal para processar imagem
export const processImage = async (
  inputPath: string,
  type: ImageType,
  originalName: string
): Promise<string> => {
  try {
    const config = imageConfigs[type];
    const fileName = generateUniqueFileName(originalName);
    
    // Criar diretório específico para o tipo de imagem
    const outputDir = path.join(baseDir, 'profiles', type === 'thumbnail' ? 'thumbnails' : type === 'user' ? 'humans' : 'cats');
    ensureDirectoryExists(outputDir);
    
    const outputPath = path.join(outputDir, fileName);

    // Processar a imagem
    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // Retornar o caminho relativo para armazenamento no banco de dados usando forward slashes
    return ['profiles', type === 'thumbnail' ? 'thumbnails' : type === 'user' ? 'humans' : 'cats', fileName]
      .join('/');
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    throw new ImageProcessingError('Falha ao processar imagem');
  }
};

// Função para validar imagem antes do processamento
export const validateImage = async (filePath: string): Promise<void> => {
  const stats = fs.statSync(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);

  if (fileSizeInMB > 50) {
    throw new ImageValidationError('O tamanho do arquivo deve ser menor que 50MB');
  }

  const metadata = await sharp(filePath).metadata();
  
  if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) {
    throw new ImageValidationError('Formato de arquivo não suportado. Use JPG, PNG ou WebP');
  }

  // Check for missing dimensions first
  if (!metadata.width || !metadata.height) {
    throw new ImageValidationError('Não foi possível obter as dimensões da imagem.');
  }

  // Now check if dimensions are too small
  if (metadata.width < 150 || metadata.height < 150) {
    throw new ImageValidationError('As dimensões da imagem devem ser pelo menos 150x150px');
  }
}; 