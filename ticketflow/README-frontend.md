# 🎫 TicketFlow — Frontend

Interface web para o sistema de chamados TicketSystem, construída com React + Vite + TypeScript.

---

## 🚀 Stack

| Tecnologia     | Versão  | Uso                                       |
|----------------|---------|-------------------------------------------|
| React          | 18      | UI                                        |
| Vite           | 5       | Build / Dev Server                        |
| TypeScript     | 5       | Tipagem estática                          |
| Tailwind CSS   | 3       | Estilização utilitária                    |
| shadcn/ui      | latest  | Componentes de UI (Radix UI)              |
| React Router   | 6       | Roteamento SPA                            |
| React Query    | 5       | Cache de dados (preparado para expansão)  |
| Recharts       | 2       | Gráficos do dashboard                     |
| Sonner         | latest  | Toasts de notificação                     |
| next-themes    | latest  | Modo claro / escuro                       |

---

## ⚙️ Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variável de ambiente
cp .env.example .env
# Edite o .env e defina VITE_API_URL=http://localhost:8080

# 3. Subir em desenvolvimento
npm run dev

# 4. Build de produção
npm run build
```

**Variável obrigatória no `.env`:**
```env
VITE_API_URL=http://localhost:8080   # URL do API Gateway
```

---

## 🗂️ Estrutura de Pastas

```
src/
├── App.tsx                          # Rotas raiz + providers globais
├── main.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx            # Wrapper com sidebar + conteúdo
│   │   ├── AppSidebar.tsx           # Navegação lateral (links por role)
│   │   └── Navbar.tsx               # Barra superior
│   │
│   ├── ui/                          # Componentes shadcn/ui (não editar)
│   │
│   ├── AttachmentSection.tsx        # Upload / listagem / download / remoção de anexos
│   ├── CommentSection.tsx           # Comentários com toggle de comentário interno
│   ├── Dashboard.tsx                # Cards de métricas + gráficos
│   ├── DynamicFormBuilder.tsx       # Builder visual de formulários com preview
│   ├── DynamicFormRenderer.tsx      # Renderizador de formulário (leitura)
│   ├── SLABadge.tsx                 # Badge de SLA com tempo restante
│   ├── StatusBadge.tsx              # Badge de status do ticket
│   ├── ThemeSwitcher.tsx            # Botão claro/escuro
│   ├── TicketCard.tsx               # Card de ticket na listagem
│   ├── TicketForm.tsx               # Formulário de abertura (3 etapas)
│   ├── TicketList.tsx               # Listagem com filtros
│   └── TicketView.tsx               # Detalhe completo do ticket
│
├── context/
│   ├── AuthContext.tsx              # Autenticação, JWT, refresh token
│   └── AppContext.tsx               # Estado global: tickets, forms, users, companies
│
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   └── useCurrentUser.ts            # Helper de role e permissões
│
├── lib/
│   ├── api.ts                       # Cliente HTTP + todos os endpoints do backend
│   ├── mock-data.ts                 # Re-exports de domain.ts (compatibilidade)
│   └── utils.ts
│
├── pages/
│   ├── LoginPage.tsx                # Login com link "Esqueceu sua senha?"
│   ├── ForgotPasswordPage.tsx       # Solicitar redefinição de senha
│   ├── ResetPasswordPage.tsx        # Confirmar nova senha via token
│   ├── Index.tsx                    # Dashboard
│   ├── TicketsPage.tsx              # Listagem + exportação CSV
│   ├── TicketDetailPage.tsx         # Detalhe do ticket
│   ├── NewTicketPage.tsx            # Abrir novo ticket
│   ├── FormsPage.tsx                # Formulários dinâmicos
│   ├── UserManagementPage.tsx       # Gestão de usuários
│   ├── CompaniesPage.tsx            # Empresas (super_admin)
│   └── NotFound.tsx
│
└── types/
    └── domain.ts                    # Tipos e configs de UI (Status, Priority, SLA, Role…)
```

---

## 🔐 Autenticação e Sessão

- **Login** requer: `email`, `senha` e `companyId` (UUID da empresa — enviado no e-mail de boas-vindas)
- **Access token** e **refresh token** são armazenados em `sessionStorage` (limpos ao fechar a aba)
- **Refresh automático**: quando o access token expira, o frontend chama `POST /auth/refresh` de forma transparente — o usuário não é redirecionado para o login enquanto o refresh token for válido
- **Multi-tenant**: `companyId` é extraído do JWT e injetado como header `X-Company-Id` em todas as requisições automaticamente

### Fluxo de sessão

```
Login
  → salva accessToken + refreshToken no sessionStorage
  → extrai dados do usuário do JWT (id, name, email, role, companyId)

Requisição autenticada
  → accessToken válido?  → envia normalmente
  → accessToken expirado → POST /auth/refresh
      → refresh válido   → novo accessToken salvo → requisição reenviada
      → refresh expirado → logout + redirect /login
```

---

## 👤 Controle de Acesso por Role

A sidebar e as páginas se adaptam automaticamente ao role do usuário logado:

| Role          | Acesso                                                                          |
|---------------|---------------------------------------------------------------------------------|
| `user`        | Dashboard (apenas meus tickets), Abrir ticket, Formulários                      |
| `support`     | Dashboard (todos), Todos os tickets, Abrir ticket, Formulários                  |
| `admin`       | Tudo acima + Gestão de usuários + criar formulários                             |
| `super_admin` | Tudo acima + Empresas                                                           |

---

## 📡 Integração com o Backend

Toda comunicação com o backend ocorre via `src/lib/api.ts`. Ele:

- Injeta `Authorization: Bearer <token>` em todas as requisições
- Injeta `X-Company-Id` automaticamente (extraído do JWT)
- Trata `401` com refresh automático ou logout
- Trata `403` exibindo mensagem de acesso negado
- Suporta upload `multipart/form-data` para anexos
- Exporta CSV disparando download direto no browser

---

## ✅ O que já está implementado

### Autenticação
- [x] Login com email, senha e companyId
- [x] Refresh token automático (sem logout ao expirar)
- [x] Restauração de sessão ao recarregar a página
- [x] Logout com limpeza de tokens
- [x] Fluxo de **recuperação de senha** (link "Esqueceu?" → e-mail → token → nova senha)

### Dashboard
- [x] Métricas em tempo real via `GET /tickets/metrics`
- [x] Gráfico de pizza por status
- [x] Gráfico de barras por área
- [x] Gráfico de barras por prioridade
- [x] Visão simplificada para usuários comuns (apenas os próprios tickets)

### Tickets
- [x] Listagem paginada com filtros por status, prioridade e área
- [x] Abertura de ticket em 3 etapas: selecionar área → selecionar formulário → preencher
- [x] Detalhe completo com dados do formulário formatados por campo
- [x] Exibição do **SLA** (status + tempo restante) no card e no detalhe
- [x] Alterar status (workflow validado no backend)
- [x] Atribuir responsável
- [x] Histórico de mudanças
- [x] **Exportar todos os tickets em CSV** (suporte / admin / super_admin)

### Comentários
- [x] Listagem com paginação
- [x] Enviar comentário (Enter ou botão)
- [x] **Comentário interno** (visível apenas para suporte/admin) com visual diferenciado em amarelo
- [x] Ocultar comentários internos para usuários comuns

### Anexos
- [x] Upload de arquivo (máx. 10 MB)
- [x] Listagem de anexos com nome, tamanho e autor
- [x] Download de arquivo
- [x] Remoção de anexo

### Formulários
- [x] Listagem de formulários da empresa
- [x] Criação visual com preview em tempo real
- [x] Campos suportados: texto, número, email, textarea, dropdown, checkbox, data
- [x] Ativar / desativar formulários

### Usuários
- [x] Listagem de usuários da empresa
- [x] Criar usuário com todos os campos (CPF, RG, data de nascimento, telefone, cargo, vínculo, área, role)
- [x] Reset de senha por administrador

### Empresas *(super_admin)*
- [x] Listagem com plano (BASIC / STANDARD / PREMIUM) e status
- [x] Criar empresa

---

## 🔲 O que ainda falta implementar

### Usuários
- [ ] Ativar / desativar usuário pela interface (endpoint `PATCH /users/{id}/status` já existe no backend)
- [ ] Editar dados do usuário: nome, email, área, cargo, vínculo (endpoints `PATCH` já existem no backend)
- [ ] Adicionar role a um usuário existente (endpoint `PATCH /users/{id}/roles` já existe)

### Empresas
- [ ] Editar dados da empresa: nome, telefone, email, CNPJ, plano (endpoints `PATCH` já existem no backend)
- [ ] Ativar / desativar empresa (endpoint `PATCH /companies/{id}/status` já existe)

### Tickets
- [ ] Filtro de tickets com SLA violado (endpoint `GET /tickets/sla/breached` já existe)
- [ ] Busca full-text por título / descrição

### Formulários
- [ ] Editar formulário existente (endpoint `PUT /forms/{id}` já existe no backend)
- [ ] Deletar formulário (endpoint `DELETE /forms/{id}` já existe — bloqueia se tiver tickets)
- [ ] Listar formulários por área no builder

### UX / Extras
- [ ] Notificações em tempo real (WebSocket / SSE para avisos de SLA, atribuição, comentários)
- [ ] Paginação visual nos tickets e usuários (atualmente carrega até 100 por vez)
- [ ] Indicador visual de tickets com SLA em risco na listagem (filtro rápido)
- [ ] Perfil do usuário logado (editar próprio nome / senha)

### Qualidade
- [ ] Testes unitários dos componentes críticos
- [ ] Testes de integração das páginas principais
