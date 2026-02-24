/**
 * @fileoverview Página de Changelog da aplicação BidExpert.
 * Lê o arquivo CHANGELOG.md gerado automaticamente pelo semantic-release
 * e renderiza em formato visual com TailwindCSS Typography.
 */
import { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import ChangelogContent from './changelog-content';

export const metadata: Metadata = {
  title: 'Changelog | BidExpert',
  description: 'Histórico de versões e atualizações da plataforma BidExpert.',
};

export const dynamic = 'force-dynamic';

/**
 * Lê o conteúdo do CHANGELOG.md do diretório raiz do projeto.
 */
function getChangelogContent(): string {
  try {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    return readFileSync(changelogPath, 'utf-8');
  } catch {
    return '# Changelog\n\nNenhuma versão publicada ainda. As notas de versão aparecerão aqui automaticamente após o primeiro release.';
  }
}

export default function ChangelogPage() {
  const markdown = getChangelogContent();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0-dev';
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'local';
  const buildEnv = process.env.NEXT_PUBLIC_BUILD_ENV || 'development';

  return (
    <div className="min-h-screen bg-background" data-ai-id="changelog-page">
      {/* Header */}
      <header className="border-b bg-card" data-ai-id="changelog-header">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Changelog
              </h1>
              <p className="mt-2 text-muted-foreground text-lg">
                Histórico de versões e atualizações da plataforma BidExpert
              </p>
            </div>
            <div className="flex items-center gap-3" data-ai-id="changelog-version-info">
              <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                v{version}
              </div>
              <div className="text-xs text-muted-foreground">
                Build: {buildId} | {buildEnv.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 md:py-12" data-ai-id="changelog-content">
        <div className="max-w-4xl mx-auto">
          <ChangelogContent markdown={markdown} />
        </div>
      </main>

      {/* Footer info */}
      <footer className="border-t bg-muted/30" data-ai-id="changelog-footer">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Este changelog é gerado automaticamente pelo{' '}
            <a
              href="https://github.com/semantic-release/semantic-release"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              semantic-release
            </a>{' '}
            com base nos{' '}
            <a
              href="https://www.conventionalcommits.org/pt-br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Conventional Commits
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
