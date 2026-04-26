# Matriz de Fontes Superbid - QA Cadastral Multi-Modal

## Objetivo

Consolidar as quatro fontes externas primarias para o ciclo Superbid -> BidExpert. Cada fonte tem mais de cinco lotes/anuncios visiveis na pagina do evento e deve ser usada como referencia para cadastro, validacao administrativa e conferencia publica.

## Fontes Primarias

| Modalidade Superbid | Modalidade BidExpert | Fonte | Evidencia de volume | Status/prazo observado |
|---|---|---|---:|---|
| Judicial | `JUDICIAL` | `1a Vara de Falencias e Recuperacoes Judiciais - SP` | 7 anuncios | Encerrado em 15/04/2026; horario varia por browser/timezone |
| Leilao corporativo | `EXTRAJUDICIAL` | `Amaggi` | 195 anuncios | Encerra em 27/04/2026 |
| Tomada de preco | `TOMADA_DE_PRECOS` | `09o Grupamento Logistico/MS - FASE PROPOSTAS` | 39 anuncios | Faca sua proposta ate 03/05 |
| Mercado Balcao | `VENDA_DIRETA` | `Alpek` | 25 anuncios | Registrar Proposta Vinculativa |

## URLs de Referencia

- Judicial: https://www.superbid.net/evento/1-vara-de-falencias-de-recuperacoes-judiciais-sp-779463?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc
- Leilao corporativo: https://exchange.superbid.net/evento/amaggi-775833?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc
- Tomada de preco: https://exchange.superbid.net/evento/09-grupamento-logistico-ms-fase-propostas-779571?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc
- Mercado Balcao: https://exchange.superbid.net/evento/alpek-781207?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc

## Campos Criticos de Comparacao

- Modalidade/metodo de negociacao.
- Comitente, orgao, vara ou processo quando aplicavel.
- Status temporal, prazo ou praca/fase de proposta.
- Titulo do lote/item.
- Localizacao e categoria.
- Valor exibido, lance atual ou proposta vinculativa.
- Documentos, condicoes e aceite.
- Imagens e contrato de midia sem copia massiva de ativos protegidos.

## Edge Case Nao Primario

`EXTRAJUDICIAL - VENDA PARTICULAR` descreve 61 apartamentos, mas a pagina possui apenas 1 anuncio visivel. Ela fica registrada como caso de oferta agrupada, nao como fonte primaria do criterio `>5`.