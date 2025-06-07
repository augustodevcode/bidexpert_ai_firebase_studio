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
// scripts/copy-sample-images-to-public.ts
var path = require("path");
var fs = require("fs");
var util_1 = require("util");
// ============================================================================
// CONFIGURAÇÕES
// ============================================================================
// Caminho base para as imagens de exemplo locais (origem)
var IMAGES_SOURCE_PATH = '/home/user/studio/CadastrosExemplo';
// Caminho de destino para as imagens copiadas dentro do diretório 'public'
var IMAGES_DESTINATION_PATH = '/home/user/studio/public/lotes-exemplo';
// Extensões de arquivo de imagem a procurar (deve corresponder ao script de seed)
var IMAGE_EXTENSIONS = ['.jpg', '.png', '.jpeg'];
// ============================================================================
// PROMESSAS para funções assíncronas de fs
// ============================================================================
var readdir = (0, util_1.promisify)(fs.readdir);
var stat = (0, util_1.promisify)(fs.stat);
var mkdir = (0, util_1.promisify)(fs.mkdir);
var copyFile = (0, util_1.promisify)(fs.copyFile);
// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================
// Função para listar recursivamente todos os arquivos em um diretório
function listFilesRecursive(dir_1) {
    return __awaiter(this, arguments, void 0, function (dir, fileList) {
        var files, _loop_1, _i, files_1, file, error_1;
        if (fileList === void 0) { fileList = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, readdir(dir)];
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
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("Erro ao listar arquivos em ".concat(dir, ":"), error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, fileList];
            }
        });
    });
}
// Função para garantir que um diretório exista, criando-o se necessário
function ensureDirectoryExists(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, mkdir(dirPath, { recursive: true })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    if (error_2.code !== 'EEXIST') { // Ignora erro se o diretório já existe
                        console.error("Erro ao criar diret\u00F3rio ".concat(dirPath, ":"), error_2);
                        throw error_2; // Lança outros erros
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================
function copySampleImagesToPublic() {
    return __awaiter(this, void 0, void 0, function () {
        var imageFiles, copiedCount, _i, imageFiles_1, sourceFilePath, relativePath, destinationFilePath, destinationDir, copyError_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('--- Iniciando Cópia de Imagens de Exemplo para Pasta Pública ---');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, , 12]);
                    // 1. Garantir que o diretório de destino exista
                    return [4 /*yield*/, ensureDirectoryExists(IMAGES_DESTINATION_PATH)];
                case 2:
                    // 1. Garantir que o diretório de destino exista
                    _a.sent();
                    console.log("Diret\u00F3rio de destino (".concat(IMAGES_DESTINATION_PATH, ") garantido."));
                    // 2. Listar arquivos de imagem locais na origem
                    console.log("Buscando imagens na origem (".concat(IMAGES_SOURCE_PATH, ")..."));
                    return [4 /*yield*/, listFilesRecursive(IMAGES_SOURCE_PATH)];
                case 3:
                    imageFiles = _a.sent();
                    console.log("Encontradas ".concat(imageFiles.length, " imagens na origem."));
                    if (imageFiles.length === 0) {
                        console.log('Nenhuma imagem encontrada na origem. Saindo.');
                        return [2 /*return*/];
                    }
                    // 3. Copiar cada imagem para o destino
                    console.log("Copiando imagens para o destino (".concat(IMAGES_DESTINATION_PATH, ")..."));
                    copiedCount = 0;
                    _i = 0, imageFiles_1 = imageFiles;
                    _a.label = 4;
                case 4:
                    if (!(_i < imageFiles_1.length)) return [3 /*break*/, 10];
                    sourceFilePath = imageFiles_1[_i];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    relativePath = path.relative(IMAGES_SOURCE_PATH, sourceFilePath);
                    destinationFilePath = path.join(IMAGES_DESTINATION_PATH, relativePath);
                    destinationDir = path.dirname(destinationFilePath);
                    return [4 /*yield*/, ensureDirectoryExists(destinationDir)];
                case 6:
                    _a.sent();
                    // Copia o arquivo
                    return [4 /*yield*/, copyFile(sourceFilePath, destinationFilePath)];
                case 7:
                    // Copia o arquivo
                    _a.sent();
                    console.log("Copiado: ".concat(sourceFilePath, " -> ").concat(destinationFilePath));
                    copiedCount++;
                    return [3 /*break*/, 9];
                case 8:
                    copyError_1 = _a.sent();
                    console.error("Falha ao copiar a imagem ".concat(sourceFilePath, ":"), copyError_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 4];
                case 10:
                    console.log("C\u00F3pia conclu\u00EDda. ".concat(copiedCount, " imagens copiadas com sucesso."));
                    return [3 /*break*/, 12];
                case 11:
                    error_3 = _a.sent();
                    console.error('Erro durante a cópia das imagens:', error_3);
                    return [3 /*break*/, 12];
                case 12:
                    console.log('--- Fim da Cópia de Imagens ---');
                    return [2 /*return*/];
            }
        });
    });
}
// Executa a função principal
copySampleImagesToPublic();
