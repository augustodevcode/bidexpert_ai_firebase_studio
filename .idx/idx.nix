{ pkgs, ... }: {
  # Qual canal do Nixpkgs usar.
  channel = "stable-23.11"; # Ou "unstable"
  # Quais pacotes do Nix instalar.
  packages = [
    pkgs.nodejs_20 # Node.js 20
    pkgs.nodePackages.prisma
    pkgs.nodePackages.typescript-language-server
  ];
  # Quais processos devem ser executados.
  processes = {
    # Processo de dev para o servidor Next.js
    dev = {
      command = "npm run dev";
      # Define a porta que o processo escuta e como o IDX deve expô-la.
      env = { PORT = "9002"; };
      manager = "web"; # Usa o web preview do IDX
    };
    # Processo para rodar testes de UI do Playwright
    test-ui = {
      command = "npm run test:ui:headed";
      manager = "web";
    };
  };
  # O que fazer quando o ambiente iniciar.
  onCreate = {
    # "npm install" é executado automaticamente pelo IDX.
    # Podemos adicionar outros comandos aqui se necessário.
  };
  # O que fazer quando o workspace é aberto.
  onOpen = {
    # Por exemplo, abrir o README.md na inicialização
    # "README.md" = "open";
  };
}
