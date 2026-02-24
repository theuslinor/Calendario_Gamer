# 🚀 [EM DESENVOLVIMENTO]Release Radar - Calendário de Lançamentos 2026+

> Painel interativo de alta performance para acompanhamento de lançamentos de Jogos.

### 🔗 Acesse o projeto aqui:
[**CLIQUE AQUI PARA VER O SITE ONLINE HOSPEDADO NO RENDER**](https://calendario-gamer.onrender.com/)

---

## 📌 Sobre o Projeto

O **Calendário Gamer** é um Calendário moderno focado em usabilidade extrema e fluidez visual. Ele permite que entusiastas de entretenimento acompanhem cronogramas de lançamentos através de um calendário dinâmico, contagens regressivas em tempo real e um sistema de "Hype".

---

## 🏛️ Decisões de Arquitetura e Estratégia de Dados

Uma das principais decisões envolveu a **persistência de dados**:

- **Abordagem Original:** O plano inicial previa a integração com um banco de dados (PostgreSQL/MongoDB).  
- **O Desafio:** O Render limita o uso de instâncias de banco de dados gratuitas por apenas **90 dias**.  
- **A Solução (Arquitetura de Resiliência):** Para garantir que o projeto permaneça online, funcional e gratuito por tempo indeterminado sem o risco de os dados sumirem após o período de teste, optei por implementar os dados via JSON Estático.  
- **Vantagens Técnicas:** Esta escolha resultou em uma performance de carregamento (TTFB) superior, já que os dados são servidos diretamente pelo bundle da aplicação, eliminando a latência de requisições a uma API externa.

---

## ✨ Funcionalidades Principais

- 📅 **Calendário Dinâmico:** Visualização mensal adaptativa.  
- ⏳ **Real-Time Countdown:** Contagem regressiva precisa até o segundo do lançamento.  
- 🔥 **Hype Meter:** Diferenciação visual para títulos de alta expectativa.   
- 🗓️ **Add to Calendar:** Geração dinâmica de links para o Google Calendar.

---

## 🛠️ Stack Técnica

- **React + Vite:** Core da aplicação e ferramenta de build ultraveloz.  
- **Tailwind CSS:** Estilização baseada em utilitários para interface *Glassmorphism*.  
- **Framer Motion:** Orquestração de animações de interface e transições de estado.  
- **Lucide React:** Conjunto de ícones minimalistas.  
- **Date-fns:** Manipulação complexa de lógica temporal e calendários.

---

## 🚀 Como rodar localmente

1. Clone o repositório:

```bash
git clone https://github.com/theuslinor/Calendario_Gamer.git
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

---

Desenvolvido com foco em performance e paixão por games. 🎮

---



### 📄 Licença

Adicione um arquivo `LICENSE` (ex: MIT) caso queira permitir que outros usem seu código como base.
