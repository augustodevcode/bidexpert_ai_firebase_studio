{ pkgs, ... }: {
  # Qual imagem de contêiner base usar
  # Consulte https://idx.dev/docs/config#image para obter mais detalhes
  image = "standard";

  # Pacotes para instalar
  # Consulte https://idx.dev/docs/config#pkgs para obter mais detalhes
  pkgs = [
    pkgs.nodejs_20
    pkgs.nodePackages.prisma
    pkgs.nodePackages.tsx
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages_latest.pnpm
  ];

  # Processos a serem executados no início
  # Consulte https://idx.dev/docs/config#pre-build-and-pre-commit para obter mais detalhes
  pre-build = "pnpm install";

  # Processos a serem executados no início
  # Consulte https://idx.dev/docs/config#processes para obter mais detalhes
  processes = {
    # Inicia o servidor de desenvolvimento e expõe a porta
    dev = {
      command = "pnpm run dev";
      env = {
        PORT = "3000";
      };
    };
    start = {
      command = "pnpm run start";
      env = {
        PORT = "3000";
      };
    };
    build = "pnpm run build";
    test = "pnpm run test";
    test-ui = "pnpm run test:ui";
    lint = "pnpm run lint";
  };

  # Configuração de portas
  # Consulte https://idx.dev/docs/config#ports para obter mais detalhes
  ports = {
    # Expõe a porta do servidor de desenvolvimento Next.js
    3000 = "public";
  };

  # Configurações do Editor
  # Consulte https://idx.dev/docs/config#editor-settings para obter mais detalhes
  editor = {
    # Configurações padrão para todos os arquivos
    "*" = {
      "editor.formatOnSave" = true;
      "editor.defaultFormatter" = "esbenp.prettier-vscode";
    };
    # Configurações para arquivos TypeScript
    "[typescript]" = {
      "editor.defaultFormatter" = "esbenp.prettier-vscode";
    };
    "[typescriptreact]" = {
      "editor.defaultFormatter" = "esbenp.prettier-vscode";
    };
    "[prisma]" = {
      "editor.defaultFormatter" = "Prisma.prisma";
    };
  };

  # Extensões do VS Code
  # Consulte https://idx.dev/docs/config#vscode-extensions para obter mais detalhes
  extensions = {
    # Formatação de código com Prettier
    "esbenp.prettier-vscode" = {
      version = "latest";
    };
    # Suporte ao Prisma
    "Prisma.prisma" = {
      version = "latest";
    };
    # Ícones de arquivo
    "pkief.material-icon-theme" = {
      version = "latest";
    };
    # Destaque de sintaxe para Tailwind CSS
    "bradlc.vscode-tailwindcss" = {
      version = "latest";
    };
    # IntelliSense para classes Tailwind CSS
    "csstools.postcss" = {
      version = "latest";
    };
  };
}
