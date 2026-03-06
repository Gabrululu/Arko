/**
 * DocViewer — server-side Markdown renderer.
 */

import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";

interface DocViewerProps {
  content: string;
}

export async function DocViewer({ content }: DocViewerProps) {
  return (
    <article className="prose max-w-none 
      prose-headings:font-serif prose-headings:italic prose-headings:text-[#615050] 
      prose-p:text-[#776a6a] prose-p:leading-relaxed
      prose-a:text-[#ad9a6f] prose-a:underline-offset-4 hover:prose-a:text-[#615050]
      prose-code:text-[#ad9a6f] prose-code:bg-[#f5f1e8] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
      prose-pre:bg-[#1a1508] prose-pre:border prose-pre:border-[#2a2318] prose-pre:rounded-xl
      prose-strong:text-[#615050]">
      
      <MDXRemote 
        source={content} 
        options={{
          mdxOptions: {            
            rehypePlugins: [rehypeHighlight],
          }
        }}
      />
    </article>
  );
}