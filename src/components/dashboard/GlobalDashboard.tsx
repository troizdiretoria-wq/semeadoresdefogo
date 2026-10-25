import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Flame,
  Users,
  UserCheck,
  Building2,
  FileText,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Calendar,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { DashboardMetrics, EvangelismEvent, BimonthlyReport } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { NavTab } from '../common/Sidebar.js';
import {
  calculateFirestoreDashboardMetrics,
  fetchEvangelismsFromFirestore,
  fetchReportsFromFirestore,
} from '../../lib/firestoreService.js';

interface GlobalDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAiAnalysis: () => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  onNavigate,
  onOpenAiAnalysis,
}) => {
  const { activeRegionFilter, regions } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentEvangelisms, setRecentEvangelisms] = useState<EvangelismEvent[]>([]);
  const [recentReports, setRecentReports] = useState<BimonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeRegionFilter]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [m, evs, reps] = await Promise.all([
        calculateFirestoreDashboardMetrics(activeRegionFilter),
        fetchEvangelismsFromFirestore(activeRegionFilter),
        fetchReportsFromFirestore(activeRegionFilter),
      ]);

      setMetrics(m);
      setRecentEvangelisms(evs.slice(0, 5));
      setRecentReports(reps.slice(0, 4));
    } catch (err: any) {
      console.error('[Dashboard] Erro ao carregar dados do Firestore:', err);
      setFetchError(err.message || 'Falha ao sincronizar dados com o banco Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeRegion = regions.find((r) => r.id === activeRegionFilter);

  const churchConversionRate =
    metrics && metrics.totalContactsCollected > 0
      ? Math.round((metrics.contactsForwardedToChurch / metrics.totalContactsCollected) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Scope Announcement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-red-950 text-white shadow-md border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-700 text-white">
              {activeRegionFilter === 'ALL' ? 'Visão Consolidada Global' : 'Visão Regional'}
            </span>
            <span className="text-xs text-stone-400">
              {activeRegionFilter === 'ALL'
                ? 'Supervisão de todas as frentes ministeriais'
                : `${activeRegion?.name} (${activeRegion?.state})`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {activeRegionFilter === 'ALL'
              ? 'Inteligência de Campo & Governança Ministerial'
              : `Operações em ${activeRegion?.name}`}
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Dados auditados em tempo real provenientes dos registros de evangelismo e relatórios do Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadDashboardData}
            title="Atualizar dados"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenAiAnalysis}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Síntese de Relatórios com IA</span>
          </button>
        </div>
      </div>

      {/* Fetch Error Warning */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded font-semibold text-amber-900"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Administrative Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border ${
                alert.type === 'warning'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : alert.type === 'info'
                  ? 'bg-sky-50 text-sky-900 border-sky-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    alert.type === 'warning'
                      ? 'text-amber-600'
                      : alert.type === 'info'
                      ? 'text-sky-600'
                      : 'text-emerald-600'
                  }`}
                />
                <span>{alert.message}</span>
              </div>
              {alert.link && (
                <button
                  onClick={() => onNavigate(alert.link === '/reports' ? 'reports' : 'evangelisms')}
                  className="text-xs font-bold underline underline-offset-2 shrink-0 ml-4 hover:opacity-80"
                >
                  Verificar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Key Metric Indicators Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Regionais */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Regionais Ativas
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            {metrics ? metrics.activeRegions : 0}{' '}
            <span className="text-xs font-semibold text-stone-400">/ {metrics ? metrics.totalRegions : 0}</span>
          </p>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{metrics ? metrics.totalMembers : 0} Semeadores Ativos</span>
            <button
              onClick={() => onNavigate('regions')}
              className="text-red-700 hover:text-red-900 font-semibold cursor-pointer"
            >
              Gerenciar →
            </button>
          </div>
        </div>

        {/* Pessoas Alcançadas */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Pessoas Alcançadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            {metrics ? metrics.totalPeopleReached.toLocaleString('pt-BR') : 0}
          </p>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Em {metrics ? metrics.completedEvangelisms : 0} ações de rua</span>
            <span className="text-emerald-700 font-bold">Campo ativo</span>
          </div>
        </div>

        {/* Contatos em Consolidação */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Consolidação (LGPD)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            {metrics ? metrics.contactsInConsolidation : 0}
          </p>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between gap-1.5">
            <span>{metrics ? metrics.totalContactsCollected : 0} coletados</span>
            <span className="text-emerald-700 font-semibold text-[10.5px]">
              Em discipulado
            </span>
          </div>
        </div>

        {/* Encaminhados à Igreja */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Encaminhados às Igrejas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            {metrics ? metrics.contactsForwardedToChurch : 0}
          </p>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Taxa de retenção: {churchConversionRate}%</span>
            <span className="text-stone-400 font-medium">Fruto permanente</span>
          </div>
        </div>
      </div>

      {/* Secondary Indicators Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-stone-700">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-stone-500 uppercase font-bold">Evangelismos Programados</p>
            <p className="text-lg font-bold text-stone-900">{metrics ? metrics.plannedEvangelisms : 0} confirmados</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-stone-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-stone-500 uppercase font-bold">Participações em Campo</p>
            <p className="text-lg font-bold text-stone-900">{metrics ? metrics.totalParticipantsInvolved : 0} voluntários</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-stone-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-stone-500 uppercase font-bold">Relatórios Bimestrais</p>
            <p className="text-lg font-bold text-stone-900">
              {metrics ? metrics.reportsSubmitted : 0} entregues ({metrics ? metrics.reportsApproved : 0} aprovados)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-stone-700">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-stone-500 uppercase font-bold">Alunos em Formação</p>
            <p className="text-lg font-bold text-stone-900">{metrics ? metrics.totalStudentsEnrolled : 0} matriculados</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Evangelismos & Bimonthly Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evangelismos Recentes (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Ações Evangelísticas Recentes
                </h3>
                <p className="text-xs text-stone-500">
                  Histórico e execução de campo diretamente do Firestore
                </p>
              </div>
              <button
                onClick={() => onNavigate('evangelisms')}
                className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todas as ações</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {recentEvangelisms.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-500">
                  Nenhum evangelismo cadastrado para o escopo selecionado.
                </p>
              ) : (
                recentEvangelisms.map((ev) => {
                  const evRegion = regions.find((r) => r.id === ev.regionId);
                  return (
                    <div key={ev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.status === 'Realizado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ev.status === 'Confirmado'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {ev.status}
                          </span>
                          <span className="text-[11px] font-semibold text-stone-500">
                            {evRegion?.name || 'Regional'}
                          </span>
                          <span className="text-[11px] text-stone-400">• {ev.actionType}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 mt-1 truncate">
                          {ev.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{ev.location}</span>
                          <span>•</span>
                          <span>
                            {new Date(ev.dateTime).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(ev.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                        {ev.status === 'Realizado' ? (
                          <>
                            <span className="text-xs font-bold text-stone-900">
                              {ev.estimatedReached} vidas alcançadas
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {ev.contactsCollected} contatos coletados
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-stone-600">
                            Previsto: {ev.expectedParticipants} semeadores
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Relatórios Bimestrais */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Relatórios Bimestrais
                </h3>
                <p className="text-xs text-stone-500">
                  Prestação de contas das regionais
                </p>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-red-700 hover:text-red-900 cursor-pointer"
              >
                Módulo →
              </button>
            </div>

            <div className="space-y-3">
              {recentReports.length === 0 ? (
                <p className="py-4 text-center text-xs text-stone-500">
                  Nenhum relatório submetido no período.
                </p>
              ) : (
                recentReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => onNavigate('reports')}
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-red-300 hover:bg-stone-50/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">
                        {rep.regionName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rep.status === 'Aprovado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'Em análise'
                            ? 'bg-amber-100 text-amber-800'
                            : rep.status === 'Enviado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 font-medium">
                      {rep.bimonthlyPeriod} • Coord: {rep.coordinatorName}
                    </p>
                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                      <span>{rep.evangelismsCount} ações realizadas</span>
                      <span className="font-bold text-stone-800">
                        {rep.peopleReached} alcançadas
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
