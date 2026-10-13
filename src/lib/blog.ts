import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { getContentDirectory } from '@/lib/content';
import type { BlogPost, BlogPostMeta } from '@/types/page';

const EXCERPT_LENGTH = 140;

function splitFrontMatter(raw: string): { frontMatter: string; body: string } {
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/);

  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    if (end > 0) {
      return {
        frontMatter: lines.slice(1, end).join('\n'),
        body: lines.slice(end + 1).join('\n'),
      };
    }
  }

  return { frontMatter: '', body: lines.join('\n') };
}

function parseTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return undefined;
}

// First plain paragraph of the post, with Markdown syntax stripped.
function deriveExcerpt(markdown: string): string {
  const paragraph = markdown
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|>|```|!\[|[-*+] |\d+\. |\||<|\[\^)/.test(block));

  if (!paragraph) {
    return '';
  }

  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\^[^\]]*\]/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…` : text;
}

function readPost(filePath: string): BlogPost {
  const slug = path.basename(filePath, '.md');
  const { frontMatter, body } = splitFrontMatter(fs.readFileSync(filePath, 'utf-8'));

  let data: Record<string, unknown> = {};
  try {
    const parsed = frontMatter ? parseYaml(frontMatter) : null;
    if (parsed && typeof parsed === 'object') {
      data = parsed as Record<string, unknown>;
    }
  } catch (error) {
    throw new Error(`Invalid front matter in ${filePath}: ${(error as Error).message}`);
  }

  return {
    slug,
    title: data.title != null ? String(data.title) : slug,
    date: data.date != null ? String(data.date) : undefined,
    description: data.description != null ? String(data.description) : deriveExcerpt(body),
    tags: parseTags(data.tags),
    draft: data.draft === true,
    content: body,
  };
}

/**
 * Loads every Markdown post in `content[_<locale>]/<source>/`, newest first.
 * Posts marked `draft: true` are only included while running `next dev`.
 */
export function getBlogPosts(source: string, locale?: string): BlogPost[] {
  const dir = getContentDirectory(source, locale);
  if (!dir) {
    console.warn(`Blog directory "${source}" not found in content/.`);
    return [];
  }

  const includeDrafts = process.env.NODE_ENV === 'development';

  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('.') && !file.startsWith('_'))
    .map((file) => readPost(path.join(dir, file)))
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title));
}

export function toBlogPostMeta(post: BlogPost): BlogPostMeta {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    description: post.description,
    tags: post.tags,
    draft: post.draft,
  };
}
