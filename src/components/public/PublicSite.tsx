import React from 'react';
import {
  Flame,
  Globe,
  MapPin,
  GraduationCap,
  Flag,
  ArrowRight,
  Shield,
  BookOpen,
  Mail,
  Phone,
  Users,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '../common/Logo.js';

interface PublicSiteProps {
  onEnterPortal: () => void;
}

export const PublicSite: React.FC<PublicSiteProps> = ({ onEnterPortal }) => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-['Montserrat',sans-serif]">
      {/* Top Ministerial Bar */}
      <div className="bg-stone-950 text-stone-300 text-xs py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-semibold text-stone-200">
              Movimento Evangelístico Interdenominacional • Atos 1:8
            </span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Reunião Estratégica: Outubro 2026</span>
            <button
              onClick={onEnterPortal}
              className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Portal Administrativo Restrito →
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Logo variant="dark" showSubtitle={true} />

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-stone-700">
            <a href="#sobre" className="hover:text-red-800 transition-colors">
              O Ministério
            </a>
            <a href="#evangelismo" className="hover:text-red-800 transition-colors">
              Atuação de Campo
            </a>
            <a href="#regionais" className="hover:text-red-800 transition-colors">
              Regionais
            </a>
            <a href="#ensino" className="hover:text-red-800 transition-colors">
              Escola de Formação
            </a>
            <a href="#cruzadas" className="hover:text-red-800 transition-colors">
              Cruzadas
            </a>
            <a href="#contato" className="hover:text-red-800 transition-colors">
              Contato
            </a>
          </nav>

          <button
            onClick={onEnterPortal}
            className="flex items-center gap-2 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-black text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Acessar Plataforma</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-white py-24 sm:py-32">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Flame className="w-4 h-4 text-red-500 fill-red-500" />
            <span>Evangelismo Sobrenatural e Transformação Urbana</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Levando o Fogo do Evangelho às <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500">Multidões</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Plataforma oficial de integração ministerial, capacitação de semeadores, organização de cruzadas evangelísticas e consolidação de vidas alcançadas pelo poder do Espírito Santo.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterPortal}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-red-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acessar Painel de Gestão</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#sobre"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-200 font-bold text-sm tracking-wider border border-stone-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Conhecer a Visão</span>
            </a>
          </div>

          {/* Quick Pillar Counters */}
          <div className="mt-16 pt-12 border-t border-stone-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
              <p className="text-2xl sm:text-3xl font-black text-red-500">4 Regionais</p>
              <p className="text-xs text-stone-400 font-medium mt-1">Capitais em operação ativa</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
              <p className="text-2xl sm:text-3xl font-black text-amber-400">100% Bíblico</p>
              <p className="text-xs text-stone-400 font-medium mt-1">4 Módulos de capacitação</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
              <p className="text-2xl sm:text-3xl font-black text-red-500">Consolidação</p>
              <p className="text-xs text-stone-400 font-medium mt-1">Acompanhamento e discipulado</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
              <p className="text-2xl sm:text-3xl font-black text-white">LGPD</p>
              <p className="text-xs text-stone-400 font-medium mt-1">Proteção rigorosa de dados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre o Ministério */}
      <section id="sobre" className="py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-100 text-red-900 text-xs font-bold uppercase tracking-wider mb-4">
                <span>Nossa Identidade & Chamado</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 leading-tight">
                Um ministério forjado na oração, na Palavra e no poder do Espírito Santo
              </h2>
              <p className="mt-4 text-stone-600 leading-relaxed">
                Os <strong>Semeadores de Fogo Global</strong> nasceram para resgatar a intrepidez apostólica da pregação nas praças, hospitais, estações de metrô e comunidades vulneráveis. Não somos apenas um grupo de ação isolada; somos uma frente integrada de obreiros capacitados.
              </p>
              <p className="mt-3 text-stone-600 leading-relaxed">
                Em alinhamento estratégico, a liderança estabeleceu diretrizes rigorosas de governança: prestação de contas bimestral de todas as regionais, rotina quinzenal ou semanal de evangelismo, e discipulado sério através do Ministério de Consolidação.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-700 font-medium">
                    <strong>Padrão Ministerial Homologado:</strong> Ações organizadas com ética, crachás oficiais e respaldo de igrejas locais patrocinadoras.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-700 font-medium">
                    <strong>Nenhum Contato Esquecido:</strong> Cada pessoa alcançada que autoriza contato recebe acolhimento pastoral estruturado.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-700 font-medium">
                    <strong>Inteligência Administrativa:</strong> Direção global supervisiona relatórios, gargalos e necessidades locais em tempo real.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Heraldic Card */}
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-red-950 text-white shadow-xl border border-stone-800 relative">
              <div className="w-16 h-16 rounded-2xl bg-red-700 flex items-center justify-center mb-6 shadow-md shadow-red-950">
                <Flame className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white">Marca & Símbolo Oficial</h3>
              <p className="mt-2 text-stone-300 text-sm leading-relaxed">
                A marca dos Semeadores de Fogo traz a pomba — símbolo bíblico do Espírito Santo que desceu em forma corpórea sobre o Senhor Jesus — associada à chama celestial de Atos 2.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-stone-400 space-y-2">
                <p>
                  <strong>Diretriz Institucional:</strong> Preservação rigorosa da identidade oficial sem adulterações por IA.
                </p>
                <p>
                  <strong>Patrimônio e Registro:</strong> Acompanhamento formal do registro da marca junto ao INPI conduzido pelo departamento jurídico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ensino e Formação */}
      <section id="ensino" className="py-20 bg-stone-100/70 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-md border border-red-200">
              Formação de Semeadores
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-stone-900">
              Os 4 Módulos de Estudo e Preparação Ministerial
            </h2>
            <p className="mt-3 text-stone-600 text-sm">
              Treinamento trimestral obrigatório com aulas mensais gratuitas aos jovens via Zoom e aquisição dos 4 livros físicos oficiais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-red-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-black text-base mb-4">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Evangelismo Sobrenatural</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Fundamentos da proclamação da Palavra, abordagem ética de rua, manifestação do poder de Deus e cura dos enfermos.
              </p>
              <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-stone-600">
                16 horas-aula • Livro Físico Módulo 1
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-red-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base mb-4">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Unção do Espírito</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Consagração pessoal, oração secreta, vida no altar, manutenção da chama espiritual e pureza ministerial.
              </p>
              <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-stone-600">
                16 horas-aula • Livro Físico Módulo 2
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-red-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-black text-base mb-4">
                3
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Dons do Espírito</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Operação bíblica dos dons de revelação, poder e inspiração para socorrer pessoas em crise e alcançar corações duros.
              </p>
              <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-stone-600">
                16 horas-aula • Livro Físico Módulo 3
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-red-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base mb-4">
                4
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Paternidade Espiritual</h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Aliança, cobertura pastoral, honra, discipulado sólido de vidas novas e envio para implantação de novas regionais.
              </p>
              <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-stone-600">
                16 horas-aula • Certificação Digital Oficial
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regionais */}
      <section id="regionais" className="py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-md border border-red-200">
                Expansão Territorial
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-stone-900">
                Regionais dos Semeadores de Fogo
              </h2>
            </div>
            <p className="mt-2 md:mt-0 text-sm text-stone-500 max-w-md">
              Cada regional possui coordenador responsável, igreja patrocinadora e periodicidade definida pela Liderança Global.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                  SEDE GLOBAL
                </span>
                <span className="text-xs font-semibold text-stone-500">Semanal</span>
              </div>
              <h4 className="font-bold text-stone-900 text-base">São Paulo — SP</h4>
              <p className="text-xs text-stone-600 mt-1">Comunidade Apostólica Rhema</p>
              <p className="text-xs text-stone-500 mt-0.5">Pr. Samuel Oliveira • Lucas Moreira</p>
              <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between text-xs text-stone-600 font-medium">
                <span>42 Semeadores</span>
                <span className="text-emerald-700 font-semibold">Ativa</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-200 text-stone-800">
                  MINAS GERAIS
                </span>
                <span className="text-xs font-semibold text-stone-500">Semanal</span>
              </div>
              <h4 className="font-bold text-stone-900 text-base">Belo Horizonte — MG</h4>
              <p className="text-xs text-stone-600 mt-1">Igreja Batista da Paz</p>
              <p className="text-xs text-stone-500 mt-0.5">Pr. Marcos Silva • Diogo Alencar</p>
              <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between text-xs text-stone-600 font-medium">
                <span>28 Semeadores</span>
                <span className="text-emerald-700 font-semibold">Ativa</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-200 text-stone-800">
                  RIO DE JANEIRO
                </span>
                <span className="text-xs font-semibold text-stone-500">Quinzenal</span>
              </div>
              <h4 className="font-bold text-stone-900 text-base">Rio de Janeiro — RJ</h4>
              <p className="text-xs text-stone-600 mt-1">Igreja Bíblica Graça Plena</p>
              <p className="text-xs text-stone-500 mt-0.5">Pra. Aline Santos • Gabriel Vianna</p>
              <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between text-xs text-stone-600 font-medium">
                <span>22 Semeadores</span>
                <span className="text-emerald-700 font-semibold">Ativa</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  PARANÁ
                </span>
                <span className="text-xs font-semibold text-stone-500">Quinzenal</span>
              </div>
              <h4 className="font-bold text-stone-900 text-base">Curitiba — PR</h4>
              <p className="text-xs text-stone-600 mt-1">Comunidade Cristã Central</p>
              <p className="text-xs text-stone-500 mt-0.5">Pr. Josué Mendes • Renan Ribeiro</p>
              <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between text-xs text-stone-600 font-medium">
                <span>16 Semeadores</span>
                <span className="text-amber-700 font-semibold">Em Implantação</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato Institucional & Liderança */}
      <section id="contato" className="py-20 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
            Governança & Direção
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-white">
            Liderança Estratégica dos Semeadores de Fogo Global
          </h2>
          <p className="mt-3 text-stone-400 text-sm max-w-xl mx-auto">
            Definida e documentada no conselho ministerial em 16 de outubro de 2026.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
            <div className="p-6 rounded-2xl bg-stone-800/60 border border-stone-700">
              <p className="text-lg font-bold text-white">Lucas Moreira</p>
              <p className="text-xs text-red-400 font-semibold mt-0.5">Direção Ministerial Global</p>
              <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                Articulação com pastorados e liderança de igrejas, supervisão doutrinária e acompanhamento presencial das regionais.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-800/60 border border-stone-700">
              <p className="text-lg font-bold text-white">Arthur</p>
              <p className="text-xs text-red-400 font-semibold mt-0.5">Estruturação Estratégica e Administrativa</p>
              <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                Organização dos 10 departamentos, arquitetura da plataforma de dados, governança, logística e suporte à identidade visual.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-800/60 border border-stone-700">
              <p className="text-lg font-bold text-white">Eduardo Felyx</p>
              <p className="text-xs text-red-400 font-semibold mt-0.5">Mídia, Comunicação & Tecnologia</p>
              <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                Organização digital, materiais oficiais de divulgação, padronização visual e pesquisa sobre registro de marca no INPI.
              </p>
            </div>
          </div>

          <div className="mt-16">
            <button
              onClick={onEnterPortal}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              <span>Entrar no Portal Administrativo Restrito</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-500 py-8 px-4 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p>
            © 2026 Semeadores de Fogo Global. Todos os direitos reservados.
          </p>
          <p className="text-stone-400">
            Conformidade LGPD • Dados Pessoais e Convicções Religiosas Protegidos
          </p>
        </div>
      </footer>
    </div>
  );
};
