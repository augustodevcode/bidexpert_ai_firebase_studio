"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed-lotes-with-images.ts
var path = require("path");
var fs = require("fs");
var util_1 = require("util"); // Para usar fs.readdir, fs.stat de forma assíncrona
// Importa a instância centralizada do Admin SDK e Firestore
// Isso garante que o SDK seja inicializado e dbAdmin esteja disponível
var admin_1 = require("../src/lib/firebase/admin");
// ============================================================================
// CONFIGURAÇÕES
// ============================================================================
// Caminho base para as imagens de exemplo locais copiadas para o diretório 'public'
var IMAGES_BASE_PATH = '/home/user/studio/public/lotes-exemplo';
// Caminho base público para acessar as imagens no front-end
var PUBLIC_IMAGE_BASE_URL = '/lotes-exemplo';
// Extensões de arquivo de imagem a procurar
var IMAGE_EXTENSIONS = ['.jpg', '.png', '.jpeg', '.webp', '.avif'];
// Nome da coleção de lotes no Firestore
var LOTES_COLLECTION = 'lotes';
// Nome do campo no documento do lote onde os URLs das imagens serão armazenados
var IMAGE_URLS_FIELD = 'galleryImageUrls';
// ============================================================================
// PROMESSAS para funções assíncronas de fs
// ============================================================================
var readdir = (0, util_1.promisify)(fs.readdir);
var stat = (0, util_1.promisify)(fs.stat);
// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================
// Função para listar recursivamente todos os arquivos em um diretório
function listFilesRecursive(dir_1) {
    return __awaiter(this, arguments, void 0, function (dir, fileList) {
        var files, _loop_1, _i, files_1, file;
        if (fileList === void 0) { fileList = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readdir(dir)];
                case 1:
                    files = _a.sent();
                    _loop_1 = function (file) {
                        var filePath, fileStat;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    filePath = path.join(dir, file);
                                    return [4 /*yield*/, stat(filePath)];
                                case 1:
                                    fileStat = _b.sent();
                                    if (!fileStat.isDirectory()) return [3 /*break*/, 3];
                                    return [4 /*yield*/, listFilesRecursive(filePath, fileList)];
                                case 2:
                                    _b.sent(); // Recursão para subdiretórios
                                    return [3 /*break*/, 4];
                                case 3:
                                    // Adiciona o arquivo se for uma extensão de imagem permitida
                                    if (IMAGE_EXTENSIONS.some(function (ext) { return filePath.toLowerCase().endsWith(ext); })) {
                                        fileList.push(filePath);
                                    }
                                    _b.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, files_1 = files;
                    _a.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 5];
                    file = files_1[_i];
                    return [5 /*yield**/, _loop_1(file)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, fileList];
            }
        });
    });
}
// Função principal para popular lotes com imagens
function seedLotesWithImages() {
    return __awaiter(this, void 0, void 0, function () {
        var imageFiles, imageUrls_1, publicDir, _i, imageFiles_1, imageFile, relativeToPublic, publicUrl, lotesRef, lotesSnapshot, updatePromises_1, imageFilesIndex, imageUrlsIndex, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('--- Iniciando Seed de Lotes com Imagens ---');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    // 1. Listar arquivos de imagem locais na pasta pública
                    console.log("Buscando imagens locais em ".concat(IMAGES_BASE_PATH, "..."));
                    return [4 /*yield*/, listFilesRecursive(IMAGES_BASE_PATH)];
                case 2:
                    imageFiles = _a.sent();
                    console.log("Encontradas ".concat(imageFiles.length, " imagens locais."));
                    if (imageFiles.length === 0) {
                        console.log('Nenhuma imagem encontrada. Saindo.');
                        return [2 /*return*/];
                    }
                    imageUrls_1 = [];
                    publicDir = '/home/user/studio/public';
                    for (_i = 0, imageFiles_1 = imageFiles; _i < imageFiles_1.length; _i++) {
                        imageFile = imageFiles_1[_i];
                        relativeToPublic = path.relative(publicDir, imageFile);
                        publicUrl = '/' + relativeToPublic.replace(/\\/g, '/');
                        imageUrls_1.push(publicUrl);
                        console.log("Gerado URL: ".concat(publicUrl));
                    }
                    console.log("Gerados ".concat(imageUrls_1.length, " URLs p\u00FAblicos."));
                    if (imageUrls_1.length === 0) {
                        console.log('Nenhum URL de imagem gerado. Saindo.');
                        return [2 /*return*/];
                    }
                    // 3. Listar lotes no Firestore
                    console.log("Buscando lotes na cole\u00E7\u00E3o \"".concat(LOTES_COLLECTION, "\"..."));
                    lotesRef = admin_1.dbAdmin.collection(LOTES_COLLECTION);
                    return [4 /*yield*/, lotesRef.get()];
                case 3:
                    lotesSnapshot = _a.sent();
                    if (lotesSnapshot.empty) {
                        console.log("Nenhum lote encontrado na cole\u00E7\u00E3o \"".concat(LOTES_COLLECTION, "\". Saindo."));
                        return [2 /*return*/];
                    }
                    console.log("Encontrados ".concat(lotesSnapshot.size, " lotes."));
                    // 4. Atualizar lotes com URLs de imagem (aleatoriamente, uma imagem por lote)
                    console.log("Associando URLs de imagens aos lotes...");
                    updatePromises_1 = [];
                    imageFilesIndex = 0;
                    imageUrlsIndex = 0;
                    lotesSnapshot.forEach(function (doc) {
                        if (imageUrls_1.length === 0) {
                            console.warn("Sem URLs de imagem restantes para o lote ".concat(doc.id, "."));
                            return;
                        }
                        // Seleciona uma imagem aleatória da lista de URLs públicos
                        var randomImageUrl = imageUrls_1[Math.floor(Math.random() * imageUrls_1.length)];
                        // Ou seleciona em sequência (menos aleatório, mas usa todas as imagens se houver mais lotes)
                        // const sequentialImageUrl = imageUrls[imageUrlsIndex % imageUrls.length];
                        var updateData = {};
                        // Armazena em um array para o campo imageUrls
                        updateData[IMAGE_URLS_FIELD] = [randomImageUrl]; // Associando como array com 1 imagem
                        updateData[IMAGE_URLS_FIELD] = [publicImageUrl]; // Associando como array com 1 imagem
                        console.log("Atualizando lote ".concat(doc.id, " com URL: ").concat(randomImageUrl));
                        updatePromises_1.push(doc.ref.update(updateData));
                    });
                    // Espera todas as atualizações de lote serem concluídas
                    return [4 /*yield*/, Promise.all(updatePromises_1)];
                case 4:
                    // Espera todas as atualizações de lote serem concluídas
                    _a.sent();
                    console.log("Atualiza\u00E7\u00E3o de ".concat(updatePromises_1.length, " lotes conclu\u00EDda."));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Erro durante o seed de lotes com imagens:', error_1);
                    return [3 /*break*/, 6];
                case 6:
                    console.log('--- Fim do Seed de Lotes com Imagens ---');
                    return [2 /*return*/];
            }
        });
    });
}
// Executa a função principal
// Adicione .catch() para tratar erros na execução inicial assíncrona
seedLotesWithImages();
