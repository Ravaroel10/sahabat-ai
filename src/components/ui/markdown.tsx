/**
 * Markdown Component - Renders markdown with proper formatting
 * Uses react-markdown with GitHub Flavored Markdown support
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className = '' }: MarkdownProps) {
  const components: Components = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mt-6 mb-3 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mt-5 mb-2.5 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold mt-3 mb-1.5 first:mt-0">{children}</h4>
    ),

    // Paragraphs
    p: ({ children }) => (
      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-3 space-y-1 ml-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">{children}</li>
    ),

    // Text formatting
    strong: ({ children }) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    del: ({ children }) => (
      <del className="line-through opacity-75">{children}</del>
    ),

    // Code
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code 
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border"
            {...props}
          >
            {children}
          </code>
        );
      }
      
      return (
        <code
          className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto border border-border my-3"
          {...props}
        >
          {children}
        </code>
      );
    },

    pre: ({ children }) => (
      <pre className="my-3">{children}</pre>
    ),

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 py-2 my-3 italic bg-muted/50">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-4 border-border" />
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border border-border">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-border">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-semibold text-sm">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-sm">{children}</td>
    ),
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
