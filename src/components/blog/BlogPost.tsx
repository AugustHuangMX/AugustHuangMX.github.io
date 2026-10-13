'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { BlogPageConfig, BlogPost as BlogPostData, BlogPostMeta } from '@/types/page';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';

export interface BlogPostLocaleData {
    /** Slug of the blog page this post belongs to, e.g. "blog". */
    slug: string;
    config: BlogPageConfig;
    post: BlogPostData;
    newer?: BlogPostMeta;
    older?: BlogPostMeta;
}

interface BlogPostProps {
    dataByLocale: Record<string, BlogPostLocaleData>;
    defaultLocale: string;
}

// react-markdown passes the hast `node` to every component; keep it off the DOM.
function domProps<T extends ExtraProps>(props: T): Omit<T, 'node'> {
    const rest = { ...props };
    delete rest.node;
    return rest;
}

const markdownComponents: Components = {
    h1: (props) => <h1 {...domProps(props)} className="text-3xl font-serif font-bold text-primary mt-12 mb-4" />,
    // remark-gfm renders a visually hidden "Footnotes" heading; leave it hidden.
    h2: ({ className, ...props }) => className?.includes('sr-only')
        ? <h2 {...domProps(props)} className={className} />
        : <h2 {...domProps(props)} className="text-2xl font-serif font-bold text-primary mt-12 mb-4" />,
    h3: (props) => <h3 {...domProps(props)} className="text-xl font-semibold text-primary mt-10 mb-3" />,
    h4: (props) => <h4 {...domProps(props)} className="text-lg font-semibold text-primary mt-8 mb-2" />,
    p: (props) => <p {...domProps(props)} className="my-5" />,
    ul: (props) => <ul {...domProps(props)} className="list-disc pl-6 my-5 space-y-1" />,
    ol: (props) => <ol {...domProps(props)} className="list-decimal pl-6 my-5 space-y-1" />,
    li: (props) => <li {...domProps(props)} className="scroll-mt-24 pl-1" />,
    a: ({ href, ...props }) => {
        const external = !!href && /^https?:\/\//.test(href);
        return (
            <a
                {...domProps(props)}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="scroll-mt-24 text-accent font-medium underline decoration-accent/30 underline-offset-4 hover:decoration-accent transition-colors duration-200"
            />
        );
    },
    blockquote: (props) => (
        <blockquote
            {...domProps(props)}
            className="border-l-4 border-accent/50 pl-4 my-6 text-neutral-600 dark:text-neutral-500 [&>p]:my-2"
        />
    ),
    strong: (props) => <strong {...domProps(props)} className="font-semibold text-primary" />,
    em: (props) => <em {...domProps(props)} className="italic" />,
    hr: (props) => <hr {...domProps(props)} className="my-10 border-neutral-200 dark:border-neutral-800" />,
    // eslint-disable-next-line @next/next/no-img-element
    img: ({ alt, ...props }) => <img {...domProps(props)} alt={alt ?? ''} loading="lazy" className="mx-auto my-8 max-w-full rounded-lg" />,
    pre: (props) => (
        <pre
            {...domProps(props)}
            className="my-6 overflow-x-auto rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-4 text-sm leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
        />
    ),
    code: (props) => <code {...domProps(props)} className="font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[0.9em]" />,
    table: (props) => (
        <div className="my-6 overflow-x-auto">
            <table {...domProps(props)} className="w-full text-sm border-collapse" />
        </div>
    ),
    th: (props) => <th {...domProps(props)} className="border-b-2 border-neutral-300 px-3 py-2 text-left font-semibold text-primary" />,
    td: (props) => <td {...domProps(props)} className="border-b border-neutral-200 dark:border-neutral-800 px-3 py-2" />,
    section: (props) => (
        <section {...domProps(props)} className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-500" />
    ),
};

export default function BlogPost({ dataByLocale, defaultLocale }: BlogPostProps) {
    const locale = useLocaleStore((state) => state.locale);
    const messages = useMessages();
    const data = dataByLocale[locale] || dataByLocale[defaultLocale] || Object.values(dataByLocale)[0];

    if (!data) {
        return null;
    }

    const { slug, config, post, newer, older } = data;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-3xl mx-auto"
            >
                <Link
                    href={`/${slug}`}
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-accent transition-colors duration-200"
                >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                    {config.title}
                </Link>

                <header className="mt-6 mb-10">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary leading-tight">{post.title}</h1>
                    {(post.date || (post.tags && post.tags.length > 0) || post.draft) && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-500">
                            {post.date && <time dateTime={post.date} className="tabular-nums">{post.date}</time>}
                            {post.draft && (
                                <span className="text-xs font-medium text-warning border border-warning/40 rounded px-1.5 py-0.5">
                                    {messages.blog.draft}
                                </span>
                            )}
                            {post.tags?.map((tag) => (
                                <span key={tag} className="text-xs bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded border border-neutral-100 dark:border-neutral-800">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                <div className="text-[17px] leading-8 text-neutral-700 dark:text-neutral-600 [&>*:first-child]:mt-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {post.content}
                    </ReactMarkdown>
                </div>

                {(older || newer) && (
                    <nav className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 grid gap-6 sm:grid-cols-2">
                        {older && (
                            <Link href={`/${slug}/${older.slug}`} className="group block">
                                <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-neutral-500">
                                    <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                    {messages.blog.older}
                                </span>
                                <span className="mt-1 block font-serif font-semibold text-primary group-hover:text-accent transition-colors duration-200">
                                    {older.title}
                                </span>
                            </Link>
                        )}
                        {newer && (
                            <Link href={`/${slug}/${newer.slug}`} className="group block sm:col-start-2 sm:text-right">
                                <span className="flex items-center sm:justify-end gap-1 text-xs uppercase tracking-wider text-neutral-500">
                                    {messages.blog.newer}
                                    <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                                <span className="mt-1 block font-serif font-semibold text-primary group-hover:text-accent transition-colors duration-200">
                                    {newer.title}
                                </span>
                            </Link>
                        )}
                    </nav>
                )}
            </motion.article>
        </div>
    );
}
