# Patty Crochê - Gerenciador de Ateliê

Um aplicativo web moderno para gerenciamento de encomendas, clientes e catálogo de produtos para ateliês de crochê e amigurumis.

## Funcionalidades

- **Catálogo de Produtos**: Cadastro detalhado com fotos, receitas, dimensões e preços.
- **Gestão de Encomendas**: Acompanhamento de status (Pendente, Em Produção, Concluído, Entregue), datas de entrega e valores.
- **Cadastro de Clientes**: Histórico de clientes e informações de contato.
- **Calculadora de Preços**: (Em desenvolvimento) Ferramenta para precificação correta dos produtos.
- **Modo Produção**: Visualização focada para o momento da confecção.
- **Autenticação**: Sistema de login seguro para proteger os dados do ateliê.

## Tecnologias Utilizadas

- React 19
- TypeScript
- Vite
- Tailwind CSS (via CDN e customizações)
- Supabase (Banco de dados e Autenticação)
- Lucide React (Ícones)

## Como Rodar Localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/gerenciador-pattycroche.git
   cd gerenciador-pattycroche
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env.local` na raiz do projeto e adicione suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. **Configure o Banco de Dados**
   Execute o script SQL contido em `supabase_schema.sql` no seu painel do Supabase para criar as tabelas necessárias.

5. **Inicie o Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse o Aplicativo**
   Abra `http://localhost:3000` (ou a porta indicada no terminal) no seu navegador.

## Deploy

O projeto pode ser facilmente implantado em plataformas como Vercel ou Netlify. Lembre-se de configurar as variáveis de ambiente no painel da plataforma de hospedagem.
