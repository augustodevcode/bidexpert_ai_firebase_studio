# Rodape Dev Info - BDD e TDD

## BDD (Behavior Driven Development)

Funcionalidade: Rodape Dev Info do dashboard

Cenário: Exibir rodape com dados padrao
- **DADO** que estou em um dashboard SaaS
- **QUANDO** o rodape for renderizado
- **ENTAO** devo ver o titulo "Dev Info"
- **E** devo ver os campos "Tenant ID", "User", "DB System" e "Project"
- **E** os valores devem ser "1", "admin@bidexpert.ai", "MYSQL" e "bidexpert"

Cenário: Rodape nao interfere no monitor de queries
- **DADO** que o monitor de queries do admin esta visivel no rodape fixo
- **QUANDO** o Dev Info for exibido no fluxo da pagina
- **ENTAO** o monitor deve permanecer abaixo de tudo sem sobreposicao

## TDD (Test Driven Development)

Casos de teste automatizados:
1. Unitario: renderiza labels e valores esperados no componente `DevInfoIndicator`.
2. UI E2E: valida visibilidade dos campos principais via seletores `data-ai-id`.
3. Visual: captura screenshot do bloco `Dev Info` para regressao visual.
