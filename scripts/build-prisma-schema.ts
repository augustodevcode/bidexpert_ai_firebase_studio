// scripts/build-prisma-schema.ts
import fs from "fs";
import path from "path";

const modelsDir = path.join(process.cwd(), "prisma", "models");
const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const headerPath = path.join(process.cwd(), "prisma", "header.prisma");

try {
  // Delete the existing schema.prisma file if it exists
  if (fs.existsSync(schemaPath)) {
    fs.unlinkSync(schemaPath);
  }

  // Ler o cabeçalho
  let schema = fs.readFileSync(headerPath, "utf-8");
  
  // Ler todos os arquivos .prisma no diretório de modelos
  const files = fs.readdirSync(modelsDir);

  files.forEach(file => {
    if (file.endsWith(".prisma")) {
      schema += "\n" + fs.readFileSync(path.join(modelsDir, file), "utf-8");
    }
  });

  // Escrever o schema concatenado no arquivo principal
  fs.writeFileSync(schemaPath, schema);
  console.log("✅ Prisma schema built successfully!");

} catch (error) {
  console.error("❌ Error building Prisma schema:", error);
  process.exit(1);
}