-- Initialize PostgreSQL database for MCP Prompts
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for MCP Prompts
CREATE SCHEMA IF NOT EXISTS mcp_prompts;

-- Set search path
SET search_path TO mcp_prompts, public;

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    is_template BOOLEAN DEFAULT FALSE,
    variables JSONB,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for tags search
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN (tags);

-- Create index for text search
CREATE INDEX IF NOT EXISTS idx_prompts_trgm_name ON prompts USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_trgm_description ON prompts USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_trgm_content ON prompts USING GIN (content gin_trgm_ops);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA mcp_prompts TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mcp_prompts TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mcp_prompts TO postgres; 