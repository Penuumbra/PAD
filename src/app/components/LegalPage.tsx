import { Link, useLocation } from 'react-router';

type LegalPageContent = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string[];
  }>;
};

const CONTACT_EMAIL = 'staffquaracidev@gmail.com';

const pages: Record<string, LegalPageContent> = {
  '/politica-de-privacidade': {
    title: 'Politica de Privacidade',
    updatedAt: '5 de maio de 2026',
    intro: 'Esta politica explica como o PAD trata dados usados para analise, relatorios e gestao autorizada de conteudo em plataformas digitais.',
    sections: [
      {
        title: 'Dados acessados',
        body: [
          'O PAD acessa apenas dados autorizados pelo usuario ou administrador da conta conectada, como identificadores de conta, paginas, canais, metricas agregadas de desempenho, conteudos publicados e informacoes necessarias para gerar relatorios.',
          'O PAD nao solicita senha das plataformas, nao acessa mensagens privadas, contatos pessoais, dados de pagamento ou informacoes que nao facam parte das permissoes concedidas no OAuth.',
        ],
      },
      {
        title: 'Finalidade',
        body: [
          'Os dados sao usados para autenticar contas conectadas, validar permissao, exibir evidencia de conexao, coletar metricas reais, organizar projetos, preparar relatorios e registrar a execucao autorizada de conteudos ou impulsionamentos.',
        ],
      },
      {
        title: 'Armazenamento e seguranca',
        body: [
          'Tokens e segredos tecnicos nao devem ser inseridos manualmente no frontend. Quando houver conector OAuth seguro, tokens de acesso e renovacao devem ser tratados pelo conector/backend e nao expostos no navegador.',
          'Dados locais do app podem ficar no armazenamento do navegador ou no ambiente configurado pelo operador do PAD. O usuario pode desconectar contas e solicitar exclusao de dados conforme as instrucoes publicas de exclusao.',
        ],
      },
      {
        title: 'Compartilhamento',
        body: [
          'O PAD nao vende dados pessoais. Informacoes podem ser compartilhadas apenas com o proprio cliente, operadores autorizados do projeto e provedores necessarios para autenticar, medir ou executar a acao autorizada.',
        ],
      },
      {
        title: 'Contato',
        body: [
          `Para duvidas sobre privacidade, acesso ou exclusao de dados, envie email para ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  '/termos-de-servico': {
    title: 'Termos de Servico',
    updatedAt: '5 de maio de 2026',
    intro: 'Estes termos descrevem as condicoes basicas de uso do PAD para analise, relatorios e gestao autorizada de conteudo.',
    sections: [
      {
        title: 'Uso permitido',
        body: [
          'O PAD deve ser usado por usuarios autorizados para organizar projetos, conectar contas, consultar metricas reais, gerar relatorios e registrar a execucao de conteudos e campanhas autorizadas.',
          'Ao conectar uma conta, o usuario declara que possui permissao para autorizar o acesso aos dados daquela plataforma, pagina, canal, perfil ou conta empresarial.',
        ],
      },
      {
        title: 'Responsabilidades do usuario',
        body: [
          'O usuario e responsavel por manter permissao administrativa adequada nas plataformas conectadas, revisar escopos solicitados e cumprir as politicas de cada provedor, incluindo Meta, Google, TikTok, LinkedIn e X.',
          'Resultados de analise, alcance, engajamento, vendas ou impulsionamento dependem de fatores externos e nao sao garantidos pelo PAD.',
        ],
      },
      {
        title: 'Limitacoes',
        body: [
          'O PAD nao deve exibir dados simulados como se fossem dados reais. Contas sem evidencia de conexao validada podem permanecer bloqueadas nas areas de metricas.',
          'Algumas plataformas exigem revisao de app, aprovacao de escopos ou conector OAuth seguro antes que metricas e acoes de gestao possam funcionar.',
        ],
      },
      {
        title: 'Privacidade e exclusao',
        body: [
          'O tratamento de dados segue a Politica de Privacidade do PAD. O usuario pode desconectar contas e solicitar exclusao de dados conforme a pagina de Exclusao de Dados.',
        ],
      },
      {
        title: 'Contato',
        body: [
          `Para suporte ou solicitacoes relacionadas ao uso do PAD, envie email para ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  '/exclusao-de-dados': {
    title: 'Exclusao de Dados do Usuario',
    updatedAt: '5 de maio de 2026',
    intro: 'Esta pagina informa como solicitar exclusao de dados associados ao PAD.',
    sections: [
      {
        title: 'Como solicitar exclusao',
        body: [
          `Envie um email para ${CONTACT_EMAIL} com o assunto "Exclusao de dados PAD". Inclua o nome da conta, plataforma conectada, email de contato e, se houver, o projeto ou cliente relacionado.`,
          'A equipe responsavel confirmara a solicitacao e orientara os proximos passos para remover dados vinculados ao uso do PAD.',
        ],
      },
      {
        title: 'O que sera removido',
        body: [
          'Podem ser removidos registros de contas conectadas, identificadores de pagina/canal/perfil, evidencias de autorizacao, metricas armazenadas, projetos, conteudos e relatorios associados ao solicitante ou cliente autorizado.',
          'A desconexao da plataforma tambem deve ser feita no proprio PAD e, quando necessario, no painel de permissoes da plataforma original.',
        ],
      },
      {
        title: 'Prazo',
        body: [
          'Solicitacoes verificadas serao tratadas em ate 30 dias, salvo exigencia legal, fiscal, antifraude ou tecnica que obrigue retencao temporaria de algum registro minimo.',
        ],
      },
      {
        title: 'Revogacao nas plataformas',
        body: [
          'Alem da solicitacao por email, o usuario pode revogar o acesso diretamente nas configuracoes de aplicativos conectados da Meta, Google, TikTok, LinkedIn, X ou outra plataforma usada.',
        ],
      },
    ],
  },
};

export function LegalPage() {
  const { pathname } = useLocation();
  const page = pages[pathname] ?? pages['/politica-de-privacidade'];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-5 py-10 md:py-14">
        <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
          Voltar ao PAD
        </Link>
        <div className="mt-6 bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8">
          <p className="text-xs uppercase tracking-wide text-blue-600 mb-2">PAD</p>
          <h1 className="text-2xl md:text-3xl text-gray-950">{page.title}</h1>
          <p className="text-sm text-gray-500 mt-2">Atualizado em {page.updatedAt}</p>
          <p className="text-sm md:text-base text-gray-700 mt-5 leading-7">{page.intro}</p>

          <div className="mt-8 space-y-7">
            {page.sections.map(section => (
              <section key={section.title}>
                <h2 className="text-lg text-gray-950 mb-2">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map(paragraph => (
                    <p key={paragraph} className="text-sm text-gray-700 leading-6">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
