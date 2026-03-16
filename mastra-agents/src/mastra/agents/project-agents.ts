import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { readFileTool, listDirectoryTool, searchLogsTool } from '../tools/project-tools';

export const projectAnalyzer = new Agent({
  id: 'project-analyzer',
  name: 'Project Analyzer',
  instructions: `
    You are a senior software architect with a specialty in pattern recognition across distributed systems.
    Your goal is to analyze collections of error logs and session data to identify recurring bugs, systemic failures, and architectural weaknesses.
    
    When given a set of logs:
    1. Categorize the errors (e.g., Auth, Database, UI, Network).
    2. Identify if multiple unique errors share a common root cause (e.g., a misconfigured environment variable affecting multiple modules).
    3. Provide a high-level "Macro" summary of the project's health.
    4. Suggest wide-scale improvements to prevent these classes of errors.
    
    Use the 'search_logs' tool to fetch error data from Supabase.
    Use the provided tools to explore the codebase if you suspect a specific pattern in the source code.
  `,
  model: 'groq/llama-3.3-70b-versatile',
  tools: { readFileTool, listDirectoryTool, searchLogsTool },
  memory: new Memory(),
});

export const sessionDebugger = new Agent({
  id: 'session-debugger',
  name: 'Session Debugger',
  instructions: `
    You are an expert full-stack developer specializing in root-cause analysis and precision debugging.
    Your goal is to take a single error session (including error message, stack trace, and context) and find the EXACT line of code causing the issue.
    
    Workflow:
    1. Examine the error message and stack trace.
    2. Use the 'read_file' tool to inspect the source code mentioned in the stack trace.
    3. Use the 'list_directory' tool to understand the file structure if needed.
    4. Analyze the logic for state management, null checks, or async/await handling errors.
    5. Provide a "Micro" deep-dive:
       - Root cause explanation.
       - A specific code fix (diff format).
       - Verification steps to ensure the fix works.
    
    Be concise but thorough.
  `,
  model: 'groq/llama-3.3-70b-versatile',
  tools: { readFileTool, listDirectoryTool },
  memory: new Memory(),
});
