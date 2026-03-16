import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const readFileTool = createTool({
  id: 'read_file',
  description: 'Read the contents of a file in the project to understand the code context.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file relative to the project root'),
  }),
  execute: async ({ input }) => {
    try {
      // Assuming the project root is two levels up from mastra-agents/src/mastra/tools
      const absolutePath = path.resolve(process.cwd(), '..', input.filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
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
    try {
      const absolutePath = path.resolve(process.cwd(), '..', input.dirPath);
      const files = await fs.readdir(absolutePath);
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
      // Assuming a table named 'sessions' or 'logs' exists
      // We'll search across common fields
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
