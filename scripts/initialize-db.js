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
// scripts/initialize-db.ts
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var fs_1 = require("fs");
var yargs_1 = require("yargs/yargs");
var helpers_1 = require("yargs/helpers");
var postgres_adapter_1 = require("../src/lib/database/postgres.adapter");
var mysql_adapter_1 = require("../src/lib/database/mysql.adapter");
// Determine the environment and load the appropriate .env file
var envPathLocal = path_1.default.resolve(process.cwd(), '.env.local');
var envPathGlobal = path_1.default.resolve(process.cwd(), '.env');
if (fs_1.default.existsSync(envPathLocal)) {
    console.log("[DB Init Script] Carregando vari\u00E1veis de ambiente de: ".concat(envPathLocal));
    dotenv_1.default.config({ path: envPathLocal });
}
else if (fs_1.default.existsSync(envPathGlobal)) {
    console.log("[DB Init Script] .env.local n\u00E3o encontrado. Carregando vari\u00E1veis de ambiente de: ".concat(envPathGlobal));
    dotenv_1.default.config({ path: envPathGlobal });
}
else {
    console.warn('[DB Init Script] Nenhum arquivo .env ou .env.local encontrado na raiz do projeto. As variáveis de ambiente devem ser definidas globalmente.');
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var argv, dbAdapter, dbType, postgresConnectionString, mysqlConnectionString, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
                        .option('db', {
                        alias: 'database',
                        type: 'string',
                        description: 'Specify the database type to initialize (postgres or mysql)',
                        choices: ['postgres', 'mysql'],
                        demandOption: true,
                    })
                        .help()
                        .alias('help', 'h')
                        .argv];
                case 1:
                    argv = _a.sent();
                    dbType = argv.db;
                    console.log("--- Iniciando Inicializa\u00E7\u00E3o de Esquema para Banco de Dados: ".concat(dbType.toUpperCase(), " ---"));
                    postgresConnectionString = process.env.POSTGRES_CONNECTION_STRING;
                    mysqlConnectionString = process.env.MYSQL_CONNECTION_STRING;
                    console.log("[DB Init Script] Valor lido para POSTGRES_CONNECTION_STRING: ".concat(postgresConnectionString ? "'Presente (oculto por seguran\u00e7a)'" : "'AUSENTE'"));
                    console.log("[DB Init Script] Valor lido para MYSQL_CONNECTION_STRING: ".concat(mysqlConnectionString ? "'Presente (oculto por seguran\u00e7a)'" : "'AUSENTE'"));
                    if (dbType === 'postgres') {
                        if (!postgresConnectionString) {
                            console.error('Erro: A variável de ambiente POSTGRES_CONNECTION_STRING não está definida ou não foi carregada corretamente.');
                            process.exit(1);
                        }
                        dbAdapter = new postgres_adapter_1.PostgresAdapter();
                    }
                    else if (dbType === 'mysql') {
                        if (!mysqlConnectionString) {
                            console.error('Erro: A variável de ambiente MYSQL_CONNECTION_STRING não está definida ou não foi carregada corretamente.');
                            process.exit(1);
                        }
                        dbAdapter = new mysql_adapter_1.MySqlAdapter();
                    }
                    else {
                        console.error('Tipo de banco de dados inválido. Use "postgres" ou "mysql".');
                        process.exit(1);
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 8]);
                    console.log("Conectando ao banco de dados ".concat(dbType.toUpperCase(), "..."));
                    return [4 /*yield*/, dbAdapter.initializeSchema()];
                case 3:
                    result = _a.sent();
                    if (result.success) {
                        console.log("\n".concat(result.message));
                        if (result.rolesProcessed !== undefined) {
                            console.log("[DB Init Script] ".concat(result.rolesProcessed, " perfis padr\u00E3o foram processados (criados/atualizados)."));
                        }
                        console.log("[DB Init Script] As tabelas (exceto 'roles' e 'platform_settings') s\u00E3o criadas vazias. Use scripts de seed espec\u00EDficos para popular com dados de exemplo.");
                    }
                    else {
                        console.error("\nFalha ao inicializar o esquema para ".concat(dbType.toUpperCase(), ": ").concat(result.message));
                        if (result.errors && result.errors.length > 0) {
                            console.error('Detalhes dos erros:');
                            result.errors.forEach(function (err, index) {
                                console.error("  Erro ".concat(index + 1, ":"), err);
                            });
                        }
                    }
                    return [3 /*break*/, 8];
                case 4:
                    error_1 = _a.sent();
                    console.error("Erro cr\u00EDtico durante a inicializa\u00E7\u00E3o do esquema para ".concat(dbType.toUpperCase(), ":"), error_1);
                    if (error_1.code) {
                        console.error("C\u00F3digo do Erro: ".concat(error_1.code));
                    }
                    return [3 /*break*/, 8];
                case 5:
                    console.log("--- Processo de Inicializa\u00E7\u00E3o para ".concat(dbType.toUpperCase(), " Conclu\u00EDdo ---"));
                    if (!(typeof dbAdapter.disconnect === 'function')) return [3 /*break*/, 7];
                    return [4 /*yield*/, dbAdapter.disconnect()];
                case 6:
                    _a.sent();
                    console.log("[DB Init Script] Conex\u00E3o com o banco de dados ".concat(dbType.toUpperCase(), " encerrada."));
                    _a.label = 7;
                case 7:
                    process.exit(0);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error("Erro inesperado no script initialize-db:", error);
    process.exit(1);
});
