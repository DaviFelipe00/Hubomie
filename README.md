# Dashboard de Gestão de Contratos - Rio Ave / Hub Plural

![Versão](https://img.shields.io/badge/version-1.0.0-blue)
![Licença](https://img.shields.io/badge/license-MIT-green)
![Tecnologia](https://img.shields.io/badge/framework-Next.js-black)
![Linguagem](https://img.shields.io/badge/language-TypeScript-blue)

Um dashboard para monitoramento e análise de despesas de TI da empresa Hub Plural, consumindo dados diretamente da API do sistema de gestão Omie.

![Screenshot do Dashboard](./screenshot.png)
*(Adicione um screenshot da aplicação na raiz do projeto com o nome `screenshot.png`)*

## 📜 Sobre o Projeto

Este projeto foi desenvolvido para atender a uma necessidade da equipe de TI da **Rio Ave**, que presta serviços para a **Hub Plural**, uma empresa de coworking adquirida pelo grupo.

A Hub Plural gerencia todas as suas contas a pagar através do ERP Omie. O objetivo deste dashboard é automatizar o monitoramento dos custos de TI (como contratos de internet e outros serviços), extraindo os dados relevantes diretamente da API da Omie e apresentando-os de forma visual e interativa.

A aplicação permite que a equipe da Rio Ave tenha uma visão clara e em tempo real sobre os gastos, podendo filtrar por períodos específicos e por fornecedores, otimizando a gestão de contratos e orçamentos.

## ✨ Funcionalidades

* **Integração com a API Omie:** Busca e processa dados de contas a pagar e fornecedores em tempo real.
* **Dashboard Interativo:** Apresenta métricas chave como total de lançamentos, valor total no período e valor médio.
* **Filtragem Dinâmica:** Permite a consulta de dados por períodos customizados através de seletores de data.
* **Atalhos de Período:** Botões para filtrar rapidamente por "Este Mês", "Mês Passado" e "Este Ano".
* **Filtro de Fornecedores:** Campo de seleção múltipla para analisar despesas de fornecedores específicos.
* **Design Moderno:** Interface com tema escuro (Dark Mode) construída com Tailwind CSS para uma experiência de usuário agradável.

## 🛠️ Stack Tecnológico

* **Framework:** [Next.js](https://nextjs.org/) (com App Router)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
* **Ícones:** [Lucide React](https://lucide.dev/)
* **Ambiente:** [Node.js](https://nodejs.org/)

## 🚀 Começando

Para rodar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

* Node.js (versão 18.x ou superior)
* npm (geralmente instalado com o Node.js)

### Instalação

1.  **Clone o repositório**
    ```sh
    git clone [https://github.com/seu-usuario/rioave-hub-dashboard.git](https://github.com/seu-usuario/rioave-hub-dashboard.git)
    ```

2.  **Navegue para a pasta do projeto**
    ```sh
    cd rioave-hub-dashboard
    ```

3.  **Instale as dependências**
    *Este comando lê o `package.json` e baixa todas as bibliotecas necessárias (Next.js, React, etc.) para a pasta `node_modules`.*
    ```sh
    npm install
    ```

4.  **Configure as Variáveis de Ambiente**
    *Crie um arquivo `.env.local` na raiz do projeto e adicione suas chaves da API Omie. Este arquivo é ignorado pelo Git para manter suas chaves seguras.*
    ```env
    OMIE_APP_KEY=SUA_CHAVE_DE_APP_AQUI
    OMIE_APP_SECRET=SEU_SEGREDO_DE_APP_AQUI
    ```

5.  **Rode o servidor de desenvolvimento**
    ```sh
    npm run dev
    ```

    Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

## ⚙️ Scripts Disponíveis

* `npm run dev`: Inicia o servidor em modo de desenvolvimento.
* `npm run build`: Compila a aplicação para produção.
* `npm run start`: Inicia um servidor de produção (requer `npm run build` antes).
* `npm run lint`: Roda o linter para analisar a qualidade do código.

## Endpoints da API

A aplicação expõe os seguintes endpoints internos para o frontend:

* `GET /api/fornecedores`: Retorna uma lista simplificada de todos os fornecedores cadastrados na Omie.
* `GET /api/omie`: Retorna os dados processados das contas a pagar. Aceita os seguintes query params:
    * `de` (ex: `01/10/2025`): Data de início do filtro.
    * `ate` (ex: `31/10/2025`): Data de fim do filtro.
    * `fornecedores` (ex: `123,456`): String com IDs dos fornecedores, separados por vírgula.

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais informações.
