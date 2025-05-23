import { NextRequest, NextResponse } from 'next/server';
import { processImage, validateImage } from '@/lib/image-processing';
import { imageCache } from '@/lib/image-cache';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// POST /api/upload - Fazer upload de uma imagem
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    // Verificar autenticação
    const supabase = await createClient();

    // Add check for supabase.auth initialization
    if (!supabase || !supabase.auth) {
      console.error("Erro Crítico: Cliente Supabase ou supabase.auth não inicializado corretamente na API de upload.");
      return NextResponse.json(
        { error: "Erro interno do servidor ao verificar autenticação." },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erro de autenticação no upload:", authError);
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'user' | 'cat' | 'thumbnail' || 'user';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // Criar diretório temporário para upload
    const tempDir = path.join(process.cwd(), 'tmp');
    await mkdir(tempDir, { recursive: true });
    
    // Salvar arquivo temporariamente
    const tempFileName = `${uuidv4()}-${file.name}`;
    tempFilePath = path.join(tempDir, tempFileName);
    const fileBuffer = await file.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(fileBuffer));

    // Validar imagem
    await validateImage(tempFilePath);

    // Processar imagem
    const processedImagePath = await processImage(tempFilePath, type, file.name);

    // Ler o arquivo processado e adicionar ao cache
    const processedImageBuffer = await readFile(tempFilePath);
    await imageCache.set(processedImagePath, processedImageBuffer, type);

    // Return URL of processed image
    const imageUrl = processedImagePath.startsWith('/') ? processedImagePath : `/${processedImagePath}`;
    return NextResponse.json({ url: imageUrl }, { status: 201 });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    
    // Retornar mensagem de erro específica se disponível
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ocorreu um erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error('Erro ao limpar arquivo temporário:', error);
      }
    }
  }
}

// GET /api/upload/cache/stats - Obter estatísticas do cache
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ message: 'Cache stats endpoint removed' });
  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas do cache' },
      { status: 500 }
    );
  }
} 