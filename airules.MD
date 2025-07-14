# AI Prototyper Rules

This document contains specific rules and guidelines for the AI prototyper to follow during development.

## 1. Automatic Database Propagation

**Rule:** Any new functionality implemented or any bug fixed by the prototyper must automatically propagate any necessary changes to the database schema or data. Nos bancos de dados toda nova coluna id para novos cruds deverão ser utilizados um autonumeração da tecnologia de banco de dados que está sendo utilizada no desenvolvimento. 

**Rationale:** The developer should not be required to run external scripts (e.g., manual SQL migrations, external seeding scripts) to make a new or corrected feature functional.



**Implementation:**
- If a new feature requires a new field, the AI must update the corresponding data creation/update actions to include that field.
- If a data migration is needed (e.g., populating a new field for existing documents), the AI should, if possible, create a one-time server action or an admin panel utility that can be triggered from within the application to perform this migration.
- The goal is to ensure a seamless "it just works" experience for the developer after the AI implements a change.
- Always use prefetch is applicable.
- Após cada atualização nos arquivos que precise reiniciar o app, limpe a saída Output do terminal. Veja o log do servidor "Previews" e proceda com um Auto Repair. Se não tiver informações suficientes, entã adicione mais logs, tanto de console quanto de servidor. 
