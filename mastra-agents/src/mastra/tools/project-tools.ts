import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * Helper to resolve paths relative to the project root.
 * It tries the current directory and one level up to account for different execution environments.
 */
async function resolveProjectFile(filePath: string) {
  const possiblePaths = [
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), '..', filePath),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }
  return null;
}

export const readFileTool = createTool({
  id: 'read_file',
  description: 'Read the contents of a file in the project to understand the code context.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file relative to the project root (e.g., "src/lib/groqClient.ts")'),
  }),
  execute: async ({ input }) => {
    const resolvedPath = await resolveProjectFile(input.filePath);
    
    if (!resolvedPath) {
      return { 
        error: `Could not find file "${input.filePath}". Tried looking in ${process.cwd()} and one level up. Please ensure the project root in Mastra Cloud is set to the repository root.` 
      };
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return { content };
    } catch (error: any) {
      return { error: `Failed to read file: ${error.message}` };
    }
  },
});

export const listDirectoryTool = createTool({
  id: 'list_directory',
  description: 'List files in a directory to understand the project structure.',
  inputSchema: z.object({
    dirPath: z.string().describe('The directory path relative to the project root'),
  }),
  execute: async ({ input }) => {
    const resolvedPath = await resolveProjectFile(input.dirPath);

    if (!resolvedPath) {
      return { error: `Could not find directory "${input.dirPath}".` };
    }

    try {
      const files = await fs.readdir(resolvedPath);
      return { files };
    } catch (error: any) {
      return { error: `Failed to list directory: ${error.message}` };
    }
  },
});

export const searchLogsTool = createTool({
  id: 'search_logs',
  description: 'Search for error logs and session data in the Supabase database.',
  inputSchema: z.object({
    query: z.string().optional().describe('Filter logs by a specific error message or keyword'),
    limit: z.number().default(10).describe('Number of logs to return'),
  }),
  execute: async ({ input }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { error: 'Supabase credentials not configured in environment variables' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) throw error;
      return { logs: data };
    } catch (error: any) {
      return { error: `Failed to search logs: ${error.message}` };
    }
  },
});
