# 🚀 FinWise Lite — Sistema Full Stack de Gestão Financeira e Estoque

> Plataforma Full Stack desenvolvida para controle financeiro, gestão de estoque, análise logística e comunicação com clientes, utilizando **TypeScript de ponta a ponta**.

🔗 **Aplicação:** [https://finwise-pearl-eta.vercel.app](https://finwise-pearl-eta.vercel.app)


---

## 📌 Visão Geral

O **FinWise Lite** é um sistema moderno de gestão empresarial que une:

* Controle financeiro (receitas e despesas)
* Gestão de estoque
* Curva ABC
* Auditoria de movimentações
* Módulo de mensagens (CRM simulado)
* Dashboards analíticos

O projeto foi desenvolvido como um **Monorepo Full Stack**, com **Frontend e Backend no mesmo repositório**, utilizando **arquitetura REST** e **TypeScript em ambas as camadas**, garantindo alta confiabilidade, manutenibilidade e escalabilidade.

---

## 🧱 Arquitetura do Sistema

* ✅ **Frontend:** React + TypeScript
* ✅ **Backend:** Node.js + Express + TypeScript
* ✅ **API REST**
* ✅ **Banco de Dados PostgreSQL**
* ✅ **ORM Prisma**
* ✅ **Autenticação com JWT**
* ✅ **Multi-Tenancy Ready (por CompanyId)**

---

## 🛠️ Tech Stack

### 🎨 Frontend

* **React 18** (Hooks, Componentização)
* **TypeScript** (Tipagem estática)
* **Vite** (Build rápido)
* **Tailwind CSS** (Design responsivo + Dark Mode)
* **Axios** (Requisições HTTP)
* **Recharts + SVG Nativo** (Visualização de dados)
* **React Router Dom v6**
* **Lucide React** (Ícones)
* **React Hot Toast** (Notificações)

---

### ⚙️ Backend

* **Node.js**
* **Express**
* **TypeScript**
* **Prisma ORM**

  * Migrações
  * Consultas tipadas
  * Relacionamentos
* **JWT** (Autenticação)
* **BCryptJS** (Hash de senhas)
* **CORS**

---

### 🗄️ Infraestrutura

* **Banco de Dados:** PostgreSQL
* **Cloud Database:** Neon Tech (Serverless)
* **Hospedagem Backend:** Render
* **Hospedagem Frontend:** Vercel

---

## ⭐ Funcionalidades Principais

### 💰 Financeiro

* CRUD de transações
* Categorização automática por palavras-chave
* Classificação de receitas e despesas
* Indicadores em tempo real

### 📦 Estoque

* Cadastro de produtos (SKU)
* Movimentações de entrada, saída e ajuste
* Estoque mínimo
* Histórico completo de movimentações
* Auditoria com transações atômicas

### 📊 Curva ABC (Pareto)

* Classificação automática por valor financeiro
* Segmentação em:

  * Classe A (até 80%)
  * Classe B (próximos 15%)
  * Classe C (últimos 5%)
* Apoio à tomada de decisões estratégicas

### 💬 Módulo de Mensagens (CRM Simulado)

* Lista de contatos
* Envio manual de mensagens
* Templates prontos
* Histórico por cliente
* Optimistic UI
* Log de mensagens
* Pronto para futura integração com WhatsApp (Twilio / Meta API)

### 🔐 Segurança

* Autenticação com JWT
* Hash de senha com BCrypt
* Middleware de rotas protegidas
* Isolamento por empresa (CompanyId)

### 💾 Backup

* Exportação completa dos dados em JSON

---

## 🧠 Diferenciais Técnicos

* 🔹 Categorização automática baseada em regras
* 🔹 Algoritmo próprio de Curva ABC
* 🔹 Transações atômicas com Prisma ($transaction)
* 🔹 Tipagem forte Full Stack
* 🔹 Optimistic UI no módulo de mensagens
* 🔹 Avatares e status gerados por algoritmos determinísticos
* 🔹 Painéis analíticos modernos

---

## 🗃️ Modelo de Dados (Resumo)

* **Company**
* **User**
* **Transaction**
* **Sku**
* **InventoryMovement**
* **Category**
* **AuditLog**

Todos conectados via **companyId** (estrutura pronta para multi-empresa).

---

## 🧩 Padrões Utilizados

* Componentização no frontend
* Separação de responsabilidades (Routes / Services)
* Mobile-First
* REST API
* Design System com Tailwind

---

## ▶️ Como Rodar o Projeto

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/alicebsrz/finwise.git
```

---

### 2️⃣ Instale as dependências

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

---

### 3️⃣ Configure o banco de dados

Crie um arquivo `.env` no backend:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
JWT_SECRET=suachavesecreta
```

Rode as migrações:

```bash
npx prisma migrate dev
```

---

### 4️⃣ Rode o projeto

#### Backend

```bash
npm run dev
```

#### Frontend

```bash
npm run dev
```

---

## 💡 Objetivo do Projeto

Este projeto foi criado com foco em:

* ✅ Aprendizado avançado de **TypeScript**
* ✅ Estruturação de um sistema **Full Stack realista**
* ✅ Aplicação de **conceitos de logística, finanças e estoque**
* ✅ Construção de um **portfolio profissional**

---

## 👩‍💻 Autora

Desenvolvido por **Alice Barbosa**
Estudante de Engenharia de Computação

🔗 GitHub: [https://github.com/alicebsrz](https://github.com/alicebsrz)
🔗 LinkedIn: [https://www.linkedin.com/in/alicebarbosa0101]

---

## ⭐ Se este projeto te ajudou de alguma forma, deixe uma estrela no repositório!
