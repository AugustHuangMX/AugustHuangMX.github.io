import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPageConfig } from '@/lib/content';
import { getConfig } from '@/lib/config';
import { getBlogPosts, toBlogPostMeta } from '@/lib/blog';
import { getRuntimeI18nConfig } from '@/lib/i18n/config';
import BlogPost, { type BlogPostLocaleData } from '@/components/blog/BlogPost';
import { BasePageConfig, BlogPageConfig } from '@/types/page';

function getBlogPageConfig(slug: string, locale?: string): BlogPageConfig | null {
  const pageConfig = getPageConfig(slug, locale) as BasePageConfig | null;
  return pageConfig?.type === 'blog' ? (pageConfig as BlogPageConfig) : null;
}

function getTargetLocales(): string[] {
  const runtimeI18n = getRuntimeI18nConfig(getConfig().i18n);
  return runtimeI18n.enabled ? runtimeI18n.locales : [runtimeI18n.defaultLocale];
}

function loadBlogPostData(slug: string, postSlug: string, locale?: string): BlogPostLocaleData | null {
  const config = getBlogPageConfig(slug, locale);
  if (!config) {
    return null;
  }

  const posts = getBlogPosts(config.source, locale);
  const index = posts.findIndex((post) => post.slug === postSlug);
  if (index === -1) {
    return null;
  }

  return {
    slug,
    config,
    post: posts[index],
    newer: index > 0 ? toBlogPostMeta(posts[index - 1]) : undefined,
    older: index < posts.length - 1 ? toBlogPostMeta(posts[index + 1]) : undefined,
  };
}

export function generateStaticParams() {
  const params = new Map<string, { slug: string; post: string }>();

  for (const nav of getConfig().navigation) {
    if (nav.type !== 'page') continue;
    for (const locale of [undefined, ...getTargetLocales()]) {
      const config = getBlogPageConfig(nav.target, locale);
      if (!config) continue;
      for (const post of getBlogPosts(config.source, locale)) {
        params.set(`${nav.target}/${post.slug}`, { slug: nav.target, post: post.slug });
      }
    }
  }

  // `output: export` rejects a dynamic route with no params, so emit a
  // placeholder (rendered as a 404) until the first post is published.
  return params.size > 0 ? Array.from(params.values()) : [{ slug: '_', post: '_' }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; post: string }> }): Promise<Metadata> {
  const { slug, post } = await params;
  const data = loadBlogPostData(slug, post);

  if (!data) {
    return {};
  }

  return {
    title: data.post.title,
    description: data.post.description,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; post: string }> }) {
  const { slug, post } = await params;
  const runtimeI18n = getRuntimeI18nConfig(getConfig().i18n);

  const dataByLocale: Record<string, BlogPostLocaleData> = {};

  for (const locale of getTargetLocales()) {
    const localizedData = loadBlogPostData(slug, post, locale);
    if (localizedData) {
      dataByLocale[locale] = localizedData;
    }
  }

  const defaultData = loadBlogPostData(slug, post);
  if (defaultData) {
    dataByLocale[runtimeI18n.defaultLocale] = dataByLocale[runtimeI18n.defaultLocale] || defaultData;
  }

  if (Object.keys(dataByLocale).length === 0) {
    notFound();
  }

  return <BlogPost dataByLocale={dataByLocale} defaultLocale={runtimeI18n.defaultLocale} />;
}
