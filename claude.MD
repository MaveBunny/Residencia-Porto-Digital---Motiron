# Documentação do Projeto

## 1. Stack do Projeto

O projeto deve ser desenvolvido utilizando obrigatoriamente:
- Next.js
- TypeScript

**Bibliotecas recomendadas:**
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- TanStack Table

## 2. Estrutura do Sistema

- **Página Inicial (Home):** Lista atividades disponíveis, com destaque para eventos próximos ou em alta.
- **Tela de Login:** Acesso com matrícula e senha. Usuário é redirecionado após autenticação.
- **Dashboard (pós-login):** Resumo das atividades inscritas e próximas.
- **Listagem de Atividades:** Página com todas as atividades (palestras, workshops, minicursos).
- **Página da Atividade:** Mostra detalhes da atividade (descrição, horário, local, palestrante, vagas disponíveis).
- **Minha Agenda:** Lista das atividades em que o usuário está inscrito.

## 3. Regras de Negócio

- Qualquer usuário pode visualizar eventos sem login.
- Para se inscrever, o usuário deve estar autenticado.
- Caso tente se inscrever sem login, deve ser redirecionado para autenticação.
- O participante não pode se inscrever duas vezes na mesma atividade.
- Não é possível se inscrever em atividades com vagas esgotadas ou encerradas.
- As vagas disponíveis devem ser atualizadas após cada inscrição ou cancelamento.
- O participante pode cancelar sua inscrição a qualquer momento antes do início.

## 4. Requisitos Técnicos

- **Responsividade:** a interface deve funcionar corretamente em desktop, tablet e mobile.
- **Feedback visual:** estados de loading, mensagens de erro e estados vazios devem ser exibidos.
- **Consistência visual:** tipografia, cores e espaçamentos consistentes em toda a aplicação.

## 5. Entregas Obrigatórias

- Repositório público com código organizado.
- README com descrição do projeto, tecnologias utilizadas, arquitetura e instruções para execução.
- Aplicação funcional executável localmente ou publicada online.

## 6. Entregas Extras

*Não são obrigatórias, mas demonstram maior maturidade técnica.*

- QR Code de check-in / Marcação de presença.
- Filtros por tipo de atividade.
- Criação de API própria.
- Página de perfil do participante.
- Certificado automático.
