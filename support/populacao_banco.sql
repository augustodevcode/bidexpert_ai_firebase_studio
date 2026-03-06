-- Inserir Tribunais Superiores
INSERT INTO `courts` (`name`, `slug`, `website`, `createdAt`, `updatedAt`) VALUES
('Supremo Tribunal Federal (STF)', 'stf', 'http://portal.stf.jus.br/', NOW(), NOW()),
('Superior Tribunal de Justiça (STJ)', 'stj', 'https://www.stj.jus.br/', NOW(), NOW()),
('Conselho da Justiça Federal (CJF)', 'cjf', 'https://www.cjf.jus.br/', NOW(), NOW()),
('Superior Tribunal Militar (STM)', 'stm', 'https://www.stm.jus.br/', NOW(), NOW()),
('Tribunal Superior do Trabalho (TST)', 'tst', 'http://www.tst.jus.br/', NOW(), NOW()),
('Conselho Superior da Justiça do Trabalho (CSJT)', 'csjt', 'http://www.csjt.jus.br/', NOW(), NOW()),
('Tribunal Superior Eleitoral (TSE)', 'tse', 'https://www.tse.jus.br/', NOW(), NOW()),
('Tribunal Regional Federal da 1ª Região (TRF1)', 'trf1', 'https://portal.trf1.jus.br/portaltrf1/pagina-inicial.htm', NOW(), NOW()),
('Tribunal Regional Federal da 2ª Região (TRF2)', 'trf2', 'https://www10.trf2.jus.br/portal/', NOW(), NOW()),
('Tribunal Regional Federal da 3ª Região (TRF3)', 'trf3', 'https://www.trf3.jus.br/', NOW(), NOW()),
('Tribunal Regional Federal da 4ª Região (TRF4)', 'trf4', 'https://www.trf4.jus.br/trf4/controlador.php?acao=principal', NOW(), NOW()),
('Tribunal Regional Federal da 5ª Região (TRF5)', 'trf5', 'https://www.trf5.jus.br/', NOW(), NOW()),
('Tribunal Regional Federal da 6ª Região (TRF6)', 'trf6', 'https://portal.trf6.jus.br/', NOW(), NOW());

-- Inserir o tribunal
INSERT INTO `courts` (`name`, `slug`, `stateUf`, `website`, `createdAt`, `updatedAt`) VALUES
('Tribunal de Justiça do Acre', 'tjac', 'AC', 'https://www.tjac.jus.br/', NOW(), NOW());

-- Inserir Comarcas de Entrância Inicial
INSERT INTO `judicial_districts` (`name`, `slug`, `courtId`, `stateId`, `zipCode`, `createdAt`, `updatedAt`) VALUES
('Comarca de Acrelândia', 'acrelandia', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69945-000', NOW(), NOW()),
('Comarca de Assis Brasil', 'assis-brasil', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69935-000', NOW(), NOW()),
('Comarca de Bujari', 'bujari', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69923-000', NOW(), NOW()),
('Comarca de Capixaba', 'capixaba', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69922-000', NOW(), NOW()),
('Comarca de Jordão', 'jordao', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69975-000', NOW(), NOW()),
('Comarca de Mâncio Lima', 'mancio-lima', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69990-000', NOW(), NOW()),
('Comarca de Manoel Urbano', 'manoel-urbano', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69950-000', NOW(), NOW()),
('Comarca de Marechal Thaumaturgo', 'marechal-thaumaturgo', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69983-000', NOW(), NOW()),
('Comarca de Plácido de Castro', 'placido-de-castro', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69928-000', NOW(), NOW()),
('Comarca de Porto Acre', 'porto-acre', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69927-000', NOW(), NOW()),
('Comarca de Porto Walter', 'porto-walter', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69960-000', NOW(), NOW()),
('Comarca de Rodrigues Alves', 'rodrigues-alves', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69945-000', NOW(), NOW()),
('Comarca de Santa Rosa do Purus', 'santa-rosa-do-purus', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69955-000', NOW(), NOW()),
('Comarca de Xapuri', 'xapuri', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69930-000', NOW(), NOW());

-- Inserir Varas de Entrância Inicial
INSERT INTO `judicial_branches` (`name`, `slug`, `districtId`, `contactName`, `phone`, `email`, `createdAt`, `updatedAt`) VALUES
('Vara Única de Acrelândia', 'vara-unica-acrelandia', (SELECT id FROM judicial_districts WHERE slug = 'acrelandia'), 'Rayane Gobbi de Oliveira Cratz', '(68) 3235-1024', 'vaciv1ac@tjac.jus.br', NOW(), NOW()),
('Vara Única de Assis Brasil', 'vara-unica-assis-brasil', (SELECT id FROM judicial_districts WHERE slug = 'assis-brasil'), 'Vivian Buonalumi Tacito Yugar', '(68) 3548-4215', 'vaciv1ab@tjac.jus.br', NOW(), NOW()),
('Vara Única de Bujari', 'vara-unica-bujari', (SELECT id FROM judicial_districts WHERE slug = 'bujari'), 'Manoel Simões Pedroga', '(68) 3231-1099', 'vaciv1bj@tjac.jus.br', NOW(), NOW()),
('Vara Única de Capixaba', 'vara-unica-capixaba', (SELECT id FROM judicial_districts WHERE slug = 'capixaba'), 'Bruno Perrotta de Menezes', '(68) 3234-1015', 'vaciv1cp@tjac.jus.br', NOW(), NOW()),
('Vara Única de Mâncio Lima', 'vara-unica-mancio-lima', (SELECT id FROM judicial_districts WHERE slug = 'mancio-lima'), NULL, '(68) 3343-1039', 'vaciv1ml@tjac.jus.br', NOW(), NOW()),
('Vara Única de Manoel Urbano', 'vara-unica-manoel-urbano', (SELECT id FROM judicial_districts WHERE slug = 'manoel-urbano'), 'Zacarias Laureano de Souza Neto', '(68) 3611-1114', 'vaciv1mu@tjac.jus.br', NOW(), NOW()),
('CIC – Porto Walter', 'cic-porto-walter', (SELECT id FROM judicial_districts WHERE slug = 'porto-walter'), NULL, '(68) 3325-8075', NULL, NOW(), NOW()),
('Vara Única de Rodrigues Alves', 'vara-unica-rodrigues-alves', (SELECT id FROM judicial_districts WHERE slug = 'rodrigues-alves'), NULL, '(68) 3342-1046', NULL, NOW(), NOW()),
('Distrito Judiciário de Santa Rosa do Purus', 'distrito-judiciario-santa-rosa-do-purus', (SELECT id FROM judicial_districts WHERE slug = 'santa-rosa-do-purus'), NULL, '(68) 3615-1017', NULL, NOW(), NOW()),
('Vara Única de Xapuri', 'vara-unica-xapuri', (SELECT id FROM judicial_districts WHERE slug = 'xapuri'), 'Luís Gustavo Alcalde Pinto', '(68) 3542-2523', 'vaciv1xp@tjac.jus.br', NOW(), NOW()),
('Distrito Judiciário de Jordão', 'distrito-judiciario-jordao', (SELECT id FROM judicial_districts WHERE slug = 'jordao'), NULL, '(68) 3464-1124', NULL, NOW(), NOW());

-- Inserir Comarcas de Entrância Final
INSERT INTO `judicial_districts` (`name`, `slug`, `courtId`, `stateId`, `zipCode`, `createdAt`, `updatedAt`) VALUES
('Comarca de Brasiléia', 'brasileia', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69932-000', NOW(), NOW()),
('Comarca de Cruzeiro do Sul', 'cruzeiro-do-sul', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69980-000', NOW(), NOW()),
('Comarca de Epitaciolândia', 'epitaciolandia', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69934-000', NOW(), NOW()),
('Comarca de Feijó', 'feijo', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69960-000', NOW(), NOW()),
('Comarca de Rio Branco', 'rio-branco', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69900-160', NOW(), NOW()),
('Comarca de Senador Guiomard', 'senador-guiomard', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69925-000', NOW(), NOW()),
('Comarca de Sena Madureira', 'sena-madureira', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69940-000', NOW(), NOW()),
('Comarca de Tarauacá', 'tarauaca', (SELECT id FROM courts WHERE slug = 'tjac'), (SELECT id FROM states WHERE uf = 'AC'), '69970-000', NOW(), NOW());

-- Inserir Varas de Entrância Final
INSERT INTO `judicial_branches` (`name`, `slug`, `districtId`, `contactName`, `phone`, `email`, `createdAt`, `updatedAt`) VALUES
('Vara Cível de Brasiléia', 'vara-civel-brasileia', (SELECT id FROM judicial_districts WHERE slug = 'brasileia'), 'José Leite de Paula Neto', '(68) 3546-3307', 'vaciv1br@tjac.jus.br', NOW(), NOW()),
('Vara Criminal de Brasiléia', 'vara-criminal-brasileia', (SELECT id FROM judicial_districts WHERE slug = 'brasileia'), 'Guilherme Muniz de Freitas Miotto', '(68) 3546-3307', 'vacri1br@tjac.jus.br', NOW(), NOW()),
('1ª Vara Cível de Cruzeiro do Sul', '1-vara-civel-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Erik da Fonseca Farhat', '(68) 3311-1604', 'vaciv1cz@tjac.jus.br', NOW(), NOW()),
('2ª Vara Cível de Cruzeiro do Sul', '2-vara-civel-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Rosilene de Santana Souza', '(68) 3311-1605', 'vaciv2cz@tjac.jus.br', NOW(), NOW()),
('Vara da Infância e da Juventude de Cruzeiro do Sul', 'vara-infancia-juventude-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Luís Fernando Rosa', '(68) 3311-1640', 'jeinf1cz@tjac.jus.br', NOW(), NOW()),
('1ª Vara Criminal de Cruzeiro do Sul', '1-vara-criminal-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Gláucia Aparecida Gomes', '(68) 3311-1620', 'vacri1cz@tjac.jus.br', NOW(), NOW()),
('2ª Vara Criminal de Cruzeiro do Sul', '2-vara-criminal-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Elielton Zanoli Armondes', '(68) 3311-1659', 'vacri2cz@tjac.jus.br', NOW(), NOW()),
('Juizado Especial Cível e de Fazenda Pública de Cruzeiro do Sul', 'juizado-especial-civel-fazenda-publica-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Adamarcia Machado Nascimento', '(68) 3311-1679', 'jeciv1cz@tjac.jus.br', NOW(), NOW()),
('Juizado Especial Criminal de Cruzeiro do Sul', 'juizado-especial-criminal-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), NULL, '(68) 3311-1617', 'jecri1cz@tjac.jus.br', NOW(), NOW()),
('Vara de Proteção à Mulher e Execuções Penais de Cruzeiro do Sul', 'vara-protecao-mulher-execucoes-penais-cruzeiro-do-sul', (SELECT id FROM judicial_districts WHERE slug = 'cruzeiro-do-sul'), 'Marilene Goulart Veríssimo Zhu', '(68) 99225-3416', NULL, NOW(), NOW()),
('Vara Única de Epitaciolândia', 'vara-unica-epitaciolandia', (SELECT id FROM judicial_districts WHERE slug = 'epitaciolandia'), 'Joelma Ribeiro Nogueira', '(68) 3546-5341', 'vaciv1ep@tjac.jus.br', NOW(), NOW()),
('Vara Cível de Feijó', 'vara-civel-feijo', (SELECT id FROM judicial_districts WHERE slug = 'feijo'), 'Caroline Lagos de Castro', '(68) 3463-2055', 'vaciv1fj@tjac.jus.br', NOW(), NOW()),
('Vara Criminal de Feijó', 'vara-criminal-feijo', (SELECT id FROM judicial_districts WHERE slug = 'feijo'), 'Robson Shelton Medeiros da Silva', '(68) 3463-2055', 'vaciv1fj@tjac.jus.br', NOW(), NOW()),
('1ª Vara Cível de Rio Branco', '1-vara-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Zenice Mota Cardozo', '(68) 3211-5467', 'vaciv1rb@tjac.jus.br', NOW(), NOW()),
('2ª Vara Cível de Rio Branco', '2-vara-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Thaís Queiroz Borges de Oliveira Abou Khalil', '(68) 3211-5471', 'vaciv2rb@tjac.jus.br', NOW(), NOW()),
('3ª Vara Cível de Rio Branco', '3-vara-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Leandro Leri Gross', '(68) 3211-5473', 'vaciv3rb@tjac.jus.br', NOW(), NOW()),
('4ª Vara Cível de Rio Branco', '4-vara-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Robson Ribeiro Aleixo', '(68) 3211-5488', 'vaciv4rb@tjac.jus.br', NOW(), NOW()),
('5ª Vara Cível de Rio Branco', '5-vara-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Shirlei de Oliveira Hage Menezes', '(68) 3211-5443', 'vaciv5rb@tjac.jus.br', NOW(), NOW()),
('6ª Vara Cível de Rio Branco', '6-vara-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Danniel Gustavo Bomfim Araújo da Silva', '(68) 3211-5465', 'vaciv6rb@tjac.jus.br', NOW(), NOW()),
('1ª Vara do Tribunal do Júri de Rio Branco', '1-vara-tribunal-juri-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Fábio Alexandre Costa de Farias', '(68) 3211-5441', 'vajur1rb@tjac.jus.br', NOW(), NOW()),
('2ª Vara do Tribunal do Júri e Auditoria Militar de Rio Branco', '2-vara-tribunal-juri-auditoria-militar-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Alesson José Santos Braz', '(68) 3211-5460', 'vamil1rb@tjac.jus.br', NOW(), NOW()),
('1ª Vara da Fazenda Pública de Rio Branco', '1-vara-fazenda-publica-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Anastácio Lima de Menezes Filho', '(68) 3211-5483', 'vafaz1rb@tjac.jus.br', NOW(), NOW()),
('2ª Vara da Fazenda Pública de Rio Branco', '2-vara-fazenda-publica-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Zenair Ferreira Bueno', '(68) 3211-5485', 'vafaz2rb@tjac.jus.br', NOW(), NOW()),
('1ª Vara de Família de Rio Branco', '1-vara-familia-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Francisco das Chagas Vilela Júnior', '(68) 3211-5476', 'vafam1rb@tjac.jus.br', NOW(), NOW()),
('2ª Vara de Família de Rio Branco', '2-vara-familia-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Fernando Nóbrega da Silva', '(68) 3211-5478', 'vafam2rb@tjac.jus.br', NOW(), NOW()),
('3ª Vara de Família de Rio Branco', '3-vara-familia-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Maha Kouzi Manasfi e Manasfi', '(68) 3211-5480', 'vafam3rb@tjac.jus.br', NOW(), NOW()),
('Vara de Registros Públicos, Órfãos e Sucessões e de Cartas Precatórias Cíveis de Rio Branco', 'vara-registros-publicos-orfaos-sucessoes-cartas-precatorias-civeis-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Luana Claudia de Albuquerque Campos', '(68) 3211-5444', 'vareg1rb@tjac.jus.br', NOW(), NOW()),
('Vara de Delitos de Roubo e Extorsão de Rio Branco', 'vara-delitos-roubo-extorsao-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Gustavo Sirena', '(68) 3212-0577', 'rbvdre1@tjac.jus.br', NOW(), NOW()),
('1ª Vara de Proteção à Mulher de Rio Branco', '1-vara-protecao-mulher-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Olívia Maria Alves Ribeiro', '(68) 3211-3857', 'vpm1rb@tjac.jus.br', NOW(), NOW()),
('2ª Vara de Proteção à Mulher de Rio Branco', '2-vara-protecao-mulher-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Louise Kristina Lopes de Oliveira Santana', '(68) 3212-0568', 'vpm2rb@tjac.jus.br', NOW(), NOW()),
('Vara de Delitos de Organizações Criminosas de Rio Branco', 'vara-delitos-organizacoes-criminosas-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Alex Ferreira Oivane', '(68) 3212-0576', 'rbvaorg1@tjac.jus.br', NOW(), NOW()),
('1ª Vara Criminal de Rio Branco', '1-vara-criminal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Isabelle Sacramento Torturela', '(68) 3211-5461', 'vacri1rb@tjac.jus.br', NOW(), NOW()),
('2ª Vara Criminal de Rio Branco', '2-vara-criminal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Maria Rosinete dos Reis Silva', '(68) 3211-5463', 'vacri2rb@tjac.jus.br', NOW(), NOW()),
('3ª Vara Criminal de Rio Branco', '3-vara-criminal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Cloves Augusto Alves Cabral Ferreira', '(68) 3211-5466', 'vacri3rb@tjac.jus.br', NOW(), NOW()),
('4ª Vara Criminal de Rio Branco', '4-vara-criminal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), NULL, '(68) 3211-5446', 'vacri4rb@tjac.jus.br', NOW(), NOW()),
('Vara de Execução de Penas no Regime Fechado de Rio Branco', 'vara-execucao-penas-regime-fechado-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Hugo Barbosa Torquato Ferreira', '(68) 3211-5455', 'vaexe1rb@tjac.jus.br', NOW(), NOW()),
('Vara de Execuções de Penas e Medidas Alternativas de Rio Branco', 'vara-execucoes-penas-medidas-alternativas-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Andréa da Silva Brito', '(68) 3212-0574', 'vepma-rb@tjac.jus.br', NOW(), NOW()),
('Vara de Execução Fiscal de Rio Branco', 'vara-execucao-fiscal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), NULL, '(68) 3211–5507', 'vaefi1rb@tjac.jus.br', NOW(), NOW()),
('1° Juizado Especial Cível de Rio Branco', '1-juizado-especial-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Lilian Deise Braga Paiva', '(68) 3211-5508', 'jeciv1rb@tjac.jus.br', NOW(), NOW()),
('2° Juizado Especial Cível de Rio Branco', '2-juizado-especial-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Marcos Thadeu Matias Mamed', '(68) 3211-5585', 'jeciv2rb@tjac.jus.br', NOW(), NOW()),
('3° Juizado Especial Cível de Rio Branco', '3-juizado-especial-civel-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Giordane de Souza Dourado', '(68) 3211-5589', 'jeciv3rb@tjac.jus.br', NOW(), NOW()),
('Juizado de Trânsito de Rio Branco', 'juizado-transito-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Evelin Campos Cerqueira Bueno', '(68) 3211-5566', 'jetra1rb@tjac.jus.br', NOW(), NOW()),
('1º Juizado Especial Criminal de Rio Branco', '1-juizado-especial-criminal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Gilberto Matos de Araújo', '(68) 3211-5524', 'jecri1rb@tjac.jus.br', NOW(), NOW()),
('2º Juizado Especial Criminal de Rio Branco', '2-juizado-especial-criminal-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), NULL, '(68) 3211-5524', 'jecri2rb@tjac.jus.br', NOW(), NOW()),
('1ª Vara da Infância e da Juventude de Rio Branco', '1-vara-infancia-juventude-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'Carolina Alvares Bragança', '(68) 3211-5493', 'rbjuv01@tjac.jus.br', NOW(), NOW()),
('2ª Vara da Infância e da Juventude de Rio Branco', '2-vara-infancia-juventude-rio-branco', (SELECT id FROM judicial_districts WHERE slug = 'rio-branco'), 'José Wagner Freitas Pedrosa Alcântara', '(68) 3211-5362', 'rbjuv02@tjac.jus.br', NOW(), NOW()),
('Vara Criminal de Senador Guiomard', 'vara-criminal-senador-guiomard', (SELECT id FROM judicial_districts WHERE slug = 'senador-guiomard'), 'Romário Divino Faria', '(68) 3232-3740', 'vacri1sg@tjac.jus.br', NOW(), NOW()),
('Vara Cível de Senador Guiomard', 'vara-civel-senador-guiomard', (SELECT id FROM judicial_districts WHERE slug = 'senador-guiomard'), 'Afonso Braña Muniz', '(68) 3232-3740', 'vaciv1sg@tjac.jus.br', NOW(), NOW()),
('Vara Criminal de Sena Madureira', 'vara-criminal-sena-madureira', (SELECT id FROM judicial_districts WHERE slug = 'sena-madureira'), 'Eder Jacoboski Viegas', '(68) 3612-2455', 'vacri1sm@tjac.jus.br', NOW(), NOW()),
('Vara Cível de Sena Madureira', 'vara-civel-sena-madureira', (SELECT id FROM judicial_districts WHERE slug = 'sena-madureira'), 'Caique Cirano Di Paula', '(68) 3612-2455', 'vaciv1sm@tjac.jus.br', NOW(), NOW()),
('Vara Cível de Tarauacá', 'vara-civel-tarauaca', (SELECT id FROM judicial_districts WHERE slug = 'tarauaca'), 'Stéphanie Winck Ribeiro de Moura', '(68) 3462-1314', 'vaciv1tr@tjac.jus.br', NOW(), NOW()),
('Vara Criminal de Tarauacá', 'vara-criminal-tarauaca', (SELECT id FROM judicial_districts WHERE slug = 'tarauaca'), 'Eliza Graziele Defensor Menezes Aires do Rêgo', '(68) 3462-1314', 'vaciv1tr@tjac.jus.br', NOW(), NOW());
