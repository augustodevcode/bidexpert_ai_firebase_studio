# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  # To correctly install Prisma on idx it is necessary to have the openssl package installed.
  packages = [
    pkgs.openssl.dev
    pkgs.doas-sudo-shim
    pkgs.nodejs_20
    pkgs.zulu
    pkgs.neovim    
  ];
  services.docker.enable = true;

  

  # See: https://nixos.wiki/wiki/Mysql
  services.mysql = {
    enable = true;
    package = pkgs.mysql80;
  };
  
  # Sets environment variables in the workspace
  env = {};
  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    detect = true;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
      "cweijan.vscode-mysql-client2"
      "google.geminicodeassist"
      "GoogleCloudTools.firebase-dataconnect-vscode"
      "GraphQL.vscode-graphql-syntax"
      "ms-dotnettools.vscode-dotnet-runtime"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
