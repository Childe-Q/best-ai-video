import { ToolContent } from '@/types/toolContent';
import { readFileSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'content', 'tools');

export function loadToolContent(slug: string): ToolContent | null {
  try {
    const filePath = join(CONTENT_DIR, `${slug}.json`);
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as ToolContent;
  } catch (error) {
    // File doesn't exist or invalid JSON - return null for graceful fallback
    return null;
  }
}

export function getAllToolContentSlugs(): string[] {
  try {
    const { readdirSync } = require('fs');
    const files = readdirSync(CONTENT_DIR);
    return files
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => file.replace('.json', ''));
  } catch (error) {
    return [];
  }
}
