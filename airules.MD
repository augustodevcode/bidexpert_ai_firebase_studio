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
- Lembre-se de se manter com foco no contexto da aplicação, de tudo que implementamos de melhorias e que temos mysql e postgres como outros datasources, então toda alteração aqui para o firestore tem que ser replicado para os outros adapters. 

## 2. Naming Convention: camelCase

**Rule:** All database fields, collection names, and object properties in the code MUST use **camelCase** naming convention (e.g., `auctionDate`, `totalLots`, `judicialProcessId`). **snake_case** (e.g., `auction_date`) is strictly forbidden.

**Rationale:** This ensures consistency across the entire codebase, from the database schema (Firestore and MySQL) to the TypeScript types, reducing confusion and potential errors.

## 3. Firebase SDK for Database Interaction

**Rule:** The AI prototyper MUST use the provided Firebase SDK tools (e.g., `firestore_list_collections`, `firestore_get_documents`, `firestore_query_collection`) as the primary method for diagnosing database issues, verifying data, and understanding the current state of the database schema.

**Rationale:** Relying on code context alone can be misleading, especially during initial setup, debugging, or after manual data changes. Direct interaction with the live database via the SDK ensures that any proposed changes or analysis are based on the actual state of the data, not just assumptions derived from code.

**Implementation:**
- Before concluding that data is missing or a schema is incorrect, use `firestore_list_collections` or `firestore_get_documents` to verify the state directly.
- When debugging data-related errors reported by the user, use the SDK tools to inspect the relevant documents or collections.
- Base schema modifications, data migrations, and new feature implementations on the verified, live structure of the Firestore database.