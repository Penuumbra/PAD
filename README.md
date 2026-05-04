# PAD

PAD é um painel de distribuição de conteúdo para gerenciar projetos, pipeline editorial, calendário, relatórios e conexões OAuth com plataformas sociais.

## Stack

- React 18 + Vite
- Tailwind CSS 4
- Recharts
- Lucide React
- .NET 8 para wrappers locais de desktop

## Desenvolvimento

Instale as dependências:

```powershell
npm i
```

Inicie o servidor local:

```powershell
npm run dev
```

Gere o build web:

```powershell
npm run build
```

## Desktop

O projeto `desktop/` publica o build web dentro de um executável local que abre o PAD no navegador padrão, sem interface Windows Forms.

```powershell
dotnet build desktop\PADDesktop.csproj -c Release
```

## Trilha

O projeto `planner/` abre uma página local moderna para acompanhar o roadmap do projeto. Ele não usa Windows Forms.

```powershell
dotnet build planner\PADTrilha.csproj -c Release
```

## Dados e conexões

O app bloqueia métricas simuladas nas áreas de Analytics e Configurações. Para exibir dados reais, configure o conector OAuth seguro e valide as contas pelo provedor.
