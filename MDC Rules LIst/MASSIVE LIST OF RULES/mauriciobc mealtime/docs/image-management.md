# Sistema de Gerenciamento de Imagens

## Visão Geral
O sistema de gerenciamento de imagens é responsável por processar, otimizar e armazenar imagens de perfis de usuários e gatos na aplicação. Ele inclui funcionalidades de validação, processamento, cache e tratamento de erros.

## Estrutura de Arquivos
```
src/
  lib/
    image-processing.ts  # Processamento e validação de imagens
    image-cache.ts      # Sistema de cache
    image-errors.ts     # Classes de erro e utilitários
components/
  image-upload.tsx      # Componente de upload
public/
  profiles/
    humans/            # Imagens de perfil de usuários
    cats/             # Imagens de perfil de gatos
    thumbnails/       # Miniaturas
tmp/
  image-cache/        # Cache de imagens
```

## Configurações de Imagem

### Tamanhos
- **Perfil de Usuário**: 400x400px
- **Perfil de Gato**: 300x300px
- **Thumbnails**: 150x150px

### Limites
- Tamanho máximo: 50MB
- Formatos suportados: JPG, PNG, WebP
- Dimensões mínimas: 150x150px

## Componentes

### ImageUpload
Componente React para upload de imagens com as seguintes funcionalidades:
- Upload via câmera ou galeria
- Preview em tempo real
- Validação de arquivos
- Tratamento de erros
- Imagens de fallback

```tsx
<ImageUpload
  value={imageUrl}
  onChange={handleImageChange}
  type="user" | "cat" | "thumbnail"
  className="opcional"
/>
```

## Cache

### Configurações
- Tamanho máximo: 100MB
- Armazenamento em memória e disco
- Limpeza automática baseada em último acesso

### Endpoints
- `GET /api/upload/cache/stats`: Estatísticas do cache

## Tratamento de Erros

### Tipos de Erro
1. **ImageValidationError**
   - Erros de validação (tamanho, formato, dimensões)
2. **ImageProcessingError**
   - Erros durante o processamento da imagem
3. **ImageCacheError**
   - Erros no sistema de cache
4. **ImageUploadError**
   - Erros durante o upload

### Fallbacks
- Imagens de fallback geradas via DiceBear API
- URLs específicas por tipo de imagem
- Visual diferenciado para imagens de fallback

## Exemplos de Uso

### Upload de Imagem
```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "user");

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Falha no upload");
  }

  const { url } = await response.json();
  return url;
};
```

### Validação de Imagem
```typescript
try {
  await validateImage(filePath);
  // Processar imagem
} catch (error) {
  if (error instanceof ImageValidationError) {
    // Tratar erro de validação
  }
}
```

## Boas Práticas

1. **Upload**
   - Sempre use o componente `ImageUpload` para consistência
   - Verifique o tipo correto da imagem (user/cat/thumbnail)
   - Trate erros adequadamente

2. **Cache**
   - Monitore o uso do cache via endpoint de estatísticas
   - Limpe o cache periodicamente se necessário
   - Use o sistema de cache para otimizar performance

3. **Erros**
   - Use as classes de erro específicas para melhor tratamento
   - Implemente fallbacks para melhor UX
   - Log erros para monitoramento

## Manutenção

### Limpeza de Cache
O cache é limpo automaticamente quando:
- Excede o limite de 100MB
- Imagens não são acessadas por muito tempo

### Monitoramento
- Verifique logs de erro
- Monitore uso do cache
- Acompanhe estatísticas de upload

## Troubleshooting

### Problemas Comuns
1. **Upload Falha**
   - Verifique tamanho e formato do arquivo
   - Confirme permissões de diretório
   - Verifique logs de erro

2. **Cache Não Funciona**
   - Verifique espaço em disco
   - Confirme permissões do diretório de cache
   - Monitore estatísticas do cache

3. **Imagens Não Aparecem**
   - Verifique URLs no banco de dados
   - Confirme existência dos arquivos
   - Verifique permissões de acesso 