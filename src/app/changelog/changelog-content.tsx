/**
 * @fileoverview Componente client-side para renderizar conteúdo Markdown do Changelog.
 * Converte Markdown em HTML seguro e estilizado com TailwindCSS Typography.
 */
'use client';

interface ChangelogContentProps {
  markdown: string;
}

/**
 * Converte Markdown simplificado em HTML para renderização.
 * Suporta: headers (h1-h4), bold, italic, links, lists, code, blockquotes, hr.
 */
function markdownToHtml(md: string): string {
  let html = md
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-foreground mt-6 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-foreground mt-8 mb-3 pb-2 border-b">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-10 mb-4 pb-2 border-b-2 border-primary/20">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-foreground mb-6">$1</h1>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-8 border-border" />')
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-primary">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    // Blockquotes
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 py-1 text-muted-foreground italic">$1</blockquote>')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[hlubo]|<li|<hr|<block)(.+)$/gm, '<p class="text-muted-foreground leading-relaxed mb-3">$1</p>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => {
    return `<ul class="my-3 space-y-1">${match}</ul>`;
  });

  return html;
}

export default function ChangelogContent({ markdown }: ChangelogContentProps) {
  const htmlContent = markdownToHtml(markdown);

  return (
    <article
      className="prose prose-slate dark:prose-invert max-w-none"
      data-ai-id="changelog-article"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
