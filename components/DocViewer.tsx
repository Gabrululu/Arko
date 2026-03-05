/**
 * DocViewer — server-side Markdown renderer.
 *
 * Uses next-mdx-remote to compile and render Markdown/MDX content. Because
 * this is a Server Component, there is no client-side JS overhead for the
 * viewer path — great for public docs that should load fast.
 */

import { MDXRemote } from "next-mdx-remote/rsc";

interface DocViewerProps {
  content: string;
}

export async function DocViewer({ content }: DocViewerProps) {
  return (
    <article className="prose prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-400 prose-code:text-pink-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-800">
      <MDXRemote source={content} />
    </article>
  );
}
