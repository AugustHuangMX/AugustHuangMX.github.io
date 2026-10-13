'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BlogPageConfig, BlogPostMeta } from '@/types/page';
import { useMessages } from '@/lib/i18n/useMessages';

interface BlogListProps {
    slug: string;
    config: BlogPageConfig;
    posts: BlogPostMeta[];
    embedded?: boolean;
}

export default function BlogList({ slug, config, posts, embedded = false }: BlogListProps) {
    const messages = useMessages();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={embedded ? "" : "max-w-3xl mx-auto"}
        >
            <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
            {config.description && (
                <p className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 mb-8 max-w-2xl`}>
                    {config.description}
                </p>
            )}

            {posts.length === 0 ? (
                <p className="text-neutral-500">{messages.blog.noPosts}</p>
            ) : (
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
                    {posts.map((post, index) => (
                        <motion.li
                            key={post.slug}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 * index }}
                        >
                            <Link href={`/${slug}/${post.slug}`} className={`group block ${embedded ? "py-4" : "py-6"}`}>
                                <div className="flex flex-col-reverse sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                                    <h2 className={`${embedded ? "text-lg" : "text-xl"} font-serif font-semibold text-primary group-hover:text-accent transition-colors duration-200`}>
                                        {post.title}
                                        {post.draft && (
                                            <span className="ml-2 align-middle text-xs font-sans font-medium text-warning border border-warning/40 rounded px-1.5 py-0.5">
                                                {messages.blog.draft}
                                            </span>
                                        )}
                                    </h2>
                                    {post.date && (
                                        <time dateTime={post.date} className="text-sm text-neutral-500 flex-shrink-0 tabular-nums">
                                            {post.date}
                                        </time>
                                    )}
                                </div>
                                {post.description && (
                                    <p className={`mt-2 ${embedded ? "text-sm" : "text-base"} text-neutral-600 dark:text-neutral-500 leading-relaxed`}>
                                        {post.description}
                                    </p>
                                )}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {post.tags.map((tag) => (
                                            <span key={tag} className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded border border-neutral-100 dark:border-neutral-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Link>
                        </motion.li>
                    ))}
                </ul>
            )}
        </motion.div>
    );
}
