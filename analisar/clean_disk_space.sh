#!/bin/bash
echo "Limpando o cache do npm..."
npm cache clean --force

echo "Limpando o cache do yarn..."
yarn cache clean

echo "Removendo o armazenamento do pnpm..."
rm -rf /home/user/.local/share/pnpm

echo "Removendo as imagens AVD..."
rm -rf /home/user/.emu/avd

echo "Limpeza de disco concluída!"
