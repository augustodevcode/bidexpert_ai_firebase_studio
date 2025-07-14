
export default function HomePage() {
  console.log("[HomePage_TEST] LOG: A página de teste está sendo renderizada.");
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center">
      <h1 className="text-4xl font-bold text-primary mb-4">Página de Teste</h1>
      <p className="text-lg text-muted-foreground">
        Se você está vendo esta página, o roteamento básico do Next.js está funcionando.
      </p>
      <p className="mt-4 text-sm">
        O erro 404 anterior era provavelmente causado por uma falha na busca de dados ou na renderização de um componente dentro da página inicial original.
      </p>
    </div>
  );
}
