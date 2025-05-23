private rowToPrompt(row: any): Prompt {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    content: row.content,
    isTemplate: row.is_template,
    variables: row.variables ? JSON.parse(row.variables) : [],
    tags: row.tags || [],
    category: row.category,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  };
} 