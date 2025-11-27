#!/usr/bin/env node
/**
 * Script para corrigir todos os imports destructurados de prisma para default import
 */
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

function getAllTsFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllTsFiles(itemPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
      files.push(itemPath);
    }
  }
  
  return files;
}

function fixPrismaImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix: import { prisma } from '@/lib/prisma' → import prisma from '@/lib/prisma'
  if (/import\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/prisma['"]/.test(content)) {
    content = content.replace(
      /import\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/prisma['"]/g,
      "import prisma from '@/lib/prisma'"
    );
    modified = true;
  }
  
  // Fix: import { prisma as X } → import prisma from
  if (/import\s*{\s*prisma\s+as\s+\w+\s*}\s*from\s*['"]@\/lib\/prisma['"]/.test(content)) {
    content = content.replace(
      /import\s*{\s*prisma\s+as\s+(\w+)\s*}\s*from\s*['"]@\/lib\/prisma['"]/g,
      (match, alias) => {
        // Replace all usages of the alias with 'prisma'
        content = content.replace(new RegExp('\\b' + alias + '\\b', 'g'), 'prisma');
        return "import prisma from '@/lib/prisma'";
      }
    );
    modified = true;
  }
  
  // Fix: this.prisma assignment from destructured import
  if (/this\.prisma\s*=\s*prisma/.test(content) && /import\s*prisma\s*from\s*['"]@\/lib\/prisma['"]/.test(content)) {
    // Remove the assignment if it exists since default import is already assigned
    content = content.replace(/\n\s*this\.prisma\s*=\s*prisma;?/g, '');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${path.relative(__dirname, filePath)}`);
    return true;
  }
  
  return false;
}

const tsFiles = getAllTsFiles(srcPath);
let fixed = 0;

console.log(`Scanning ${tsFiles.length} TypeScript files...`);
console.log('');

for (const file of tsFiles) {
  if (fixPrismaImports(file)) {
    fixed++;
  }
}

console.log('');
console.log(`✨ Fixed ${fixed} file(s) with prisma imports`);
