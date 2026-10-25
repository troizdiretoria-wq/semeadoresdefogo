import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronRight,
  Download,
  Calendar,
  MapPin,
  Save,
  Send,
  MessageSquare,
  Eye,
  Edit3,
} from 'lucide-react';
import { BimonthlyReport, Region } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { getClientDb, universalFetch } from '../../lib/clientStore.js';

interface ReportsViewProps {
  onOpenAiAnalysis: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenAiAnalysis }) => {
  const { currentUser, regions, activeRegionFilter, isGlobalAdmin } = useAuth();
  const initialDb = getClientDb();
  const [reports, setReports] = useState<BimonthlyReport[]>(() => {
    const rawReps = JSON.parse(JSON.stringify(initialDb.bimonthlyReports || [])) as BimonthlyReport[];
    if (activeRegionFilter !== 'ALL') {
      return rawReps.filter((r) => r.regionId === activeRegionFilter);
    }
    return rawReps;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Selected report for viewing or editing
  const [selectedReport, setSelectedReport] = useState<BimonthlyReport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<BimonthlyReport>>({});
  const [adminReviewComments, setAdminReviewComments] = useState('');
  const [reviewAction, setReviewAction] = useState<'Aprovado' | 'Devolvido'>('Aprovado');

  useEffect(() => {
    loadReports();
  }, [activeRegionFilter]);

  const loadReports = async () => {
    try {
      const regionParam = activeRegionFilter !== 'ALL' ? `?regionId=${activeRegionFilter}` : '';
      const data = await universalFetch<BimonthlyReport[]>(`/api/reports${regionParam}`);
      if (data && Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.warn('Reports fallback active:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewReport = async () => {
    const targetRegionId =
      activeRegionFilter !== 'ALL'
        ? activeRegionFilter
        : currentUser?.regionId || (regions[0] ? regions[0].id : 'reg-sp-01');

    const reg = regions.find((r) => r.id === targetRegionId);

    // Call prefill API to eliminate duplicate typing!
    try {
      const prefillRes = await fetch(
        `/api/reports/prefill?regionId=${targetRegionId}&period=5º Bimestre / 2026 (Set/Out)`
      );
      if (prefillRes.ok) {
        const prefillData = await prefillRes.json();
        setFormData({
          ...prefillData,
          coordinatorId: currentUser?.id,
          coordinatorName: currentUser?.name || reg?.coordinatorName,
          status: 'Rascunho',
        });
      } else {
        setFormData({
          regionId: targetRegionId,
          regionName: reg?.name,
          coordinatorName: currentUser?.name || reg?.coordinatorName,
          bimonthlyPeriod: '5º Bimestre / 2026 (Set/Out)',
          year: 2026,
          status: 'Rascunho',
          evangelismsCount: 0,
          frequencyObserved: reg?.plannedFrequency === 'semanal' ? 'Semanal' : 'Quinzenal',
          totalParticipants: 0,
          peopleReached: 0,
          contactsCollected: 0,
          contactsInConsolidation: 0,
          forwardedToChurch: 0,
        });
      }
    } catch {
      setFormData({
        regionId: targetRegionId,
        regionName: reg?.name,
        coordinatorName: currentUser?.name || reg?.coordinatorName,
        bimonthlyPeriod: '5º Bimestre / 2026 (Set/Out)',
        year: 2026,
        status: 'Rascunho',
      });
    }

    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedReport(null);
  };

  const handleAutoFillFromDatabase = async () => {
    if (!formData.regionId) return;
    try {
      const prefillRes = await fetch(
        `/api/reports/prefill?regionId=${formData.regionId}&period=${encodeURIComponent(
          formData.bimonthlyPeriod || '5º Bimestre / 2026 (Set/Out)'
        )}`
      );
      if (prefillRes.ok) {
        const prefillData = await prefillRes.json();
        setFormData((prev) => ({
          ...prev,
          ...prefillData,
        }));
      }
    } catch (err) {
      console.error('Error prefelling report:', err);
    }
  };

  const handleSaveReport = async (submitNow: boolean) => {
    try {
      const payload = {
        ...formData,
        status: submitNow ? 'Enviado' : 'Rascunho',
        authorId: currentUser?.id,
        authorName: currentUser?.name,
      };

      let saved: BimonthlyReport;
      if (isCreatingNew || !formData.id) {
        saved = await universalFetch<BimonthlyReport>('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        saved = await universalFetch<BimonthlyReport>(`/api/reports/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (saved) {
        setIsCreatingNew(false);
        setIsEditing(false);
        setSelectedReport(saved);
        loadReports();
      }
    } catch (err) {
      console.error('Error saving report:', err);
    }
  };

  const handleReviewReport = async () => {
    if (!selectedReport) return;
    try {
      const updated = await universalFetch<BimonthlyReport>(`/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewAction,
          adminComments: adminReviewComments,
          reviewedBy: currentUser?.name || 'Arthur (Liderança Global)',
          reviewerId: currentUser?.id,
        }),
      });

      if (updated) {
        setSelectedReport(updated);
        setIsReviewModalOpen(false);
        setAdminReviewComments('');
        loadReports();
      }
    } catch (err) {
      console.error('Error reviewing report:', err);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterPeriod !== 'ALL' && r.bimonthlyPeriod !== filterPeriod) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Prestação de Contas Obrigatória
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Reunião Estratégica • 16 de Outubro de 2026
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Relatórios Bimestrais das Regionais
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Instrumento oficial de acompanhamento das atividades evangelísticas, resultados alcançados, pontos fortes, dificuldades locais e necessidades pastorais.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAiAnalysis}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Síntese IA de Relatórios</span>
          </button>

          <button
            onClick={handleStartNewReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-950/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Relatório Bimestral</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
          </div>

          <select
            aria-label="Filtrar por Período"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none"
          >
            <option value="ALL">Todos os Bimestres</option>
            <option value="5º Bimestre / 2026 (Set/Out)">5º Bimestre / 2026 (Set/Out)</option>
            <option value="4º Bimestre / 2026 (Jul/Ago)">4º Bimestre / 2026 (Jul/Ago)</option>
            <option value="6º Bimestre / 2026 (Nov/Dez)">6º Bimestre / 2026 (Nov/Dez)</option>
          </select>

          <select
            aria-label="Filtrar por Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Em análise">Em análise</option>
            <option value="Enviado">Enviado</option>
            <option value="Devolvido">Devolvido para Correção</option>
            <option value="Rascunho">Rascunho</option>
          </select>
        </div>

        <div className="text-xs text-stone-500">
          Exibindo <strong>{filteredReports.length}</strong> relatório(s)
        </div>
      </div>

      {/* Main View Grid: List or Form / Detail */}
      {!isEditing && !selectedReport ? (
        /* Reports Table / Card List */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Regional & Período</th>
                  <th className="py-3 px-4">Coordenador</th>
                  <th className="py-3 px-4 text-center">Ações / Pessoas</th>
                  <th className="py-3 px-4 text-center">Consolidação</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-stone-500">
                      Nenhum relatório bimestral encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 text-sm">
                          {report.regionName}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          {report.bimonthlyPeriod}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="font-semibold">{report.coordinatorName}</div>
                        <div className="text-[10px] text-stone-400">
                          {report.submissionDate
                            ? `Enviado em ${new Date(report.submissionDate).toLocaleDateString('pt-BR')}`
                            : 'Em elaboração'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-stone-900">{report.evangelismsCount} ações</span>
                        <div className="text-[10.5px] text-stone-500">
                          {report.peopleReached} pessoas alcançadas
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-emerald-800">
                          {report.contactsInConsolidation} em acompanhamento
                        </span>
                        <div className="text-[10.5px] text-stone-500">
                          {report.forwardedToChurch} encaminhados à igreja
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                            report.status === 'Aprovado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.status === 'Em análise'
                              ? 'bg-amber-100 text-amber-800'
                              : report.status === 'Enviado'
                              ? 'bg-blue-100 text-blue-800'
                              : report.status === 'Devolvido'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {report.status}
                        </span>
                        {report.reviewedBy && (
                          <div className="text-[9.5px] text-stone-400 mt-0.5">
                            Por {report.reviewedBy}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                          className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Visualizar Relatório"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : isEditing ? (
        /* Report Edit / Create Form (The 5 Sections) */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md space-y-8 animate-in fade-in duration-150">
          {/* Top Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Formulário Oficial de Prestação de Contas
              </span>
              <h3 className="text-xl font-bold text-stone-900 mt-1">
                {isCreatingNew ? 'Novo Relatório Bimestral' : `Editar Relatório — ${formData.regionName}`}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillFromDatabase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors"
                title="Puxa contagens de evangelismos já cadastrados"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Preencher Automaticamente com Dados do Período</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsCreatingNew(false);
                }}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleSaveReport(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveReport(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar à Direção Global</span>
              </button>
            </div>
          </div>

          {/* SEÇÃO 1 — IDENTIFICAÇÃO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900">
                Seção 1 — Identificação
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Regional Responsável *
                </label>
                <select
                  aria-label="Regional Responsável"
                  value={formData.regionId}
                  onChange={(e) => {
                    const reg = regions.find((r) => r.id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      regionId: e.target.value,
                      regionName: reg?.name,
                    }));
                  }}
                  className="w-full text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Coordenador Responsável *
                </label>
                <input
                  type="text"
                  value={formData.coordinatorName || ''}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Bimestre de Referência *
                </label>
                <select
                  aria-label="Bimestre de Referência do Formulário"
                  value={formData.bimonthlyPeriod || ''}
                  onChange={(e) => setFormData({ ...formData, bimonthlyPeriod: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                >
                  <option value="5º Bimestre / 2026 (Set/Out)">5º Bimestre / 2026 (Set/Out)</option>
                  <option value="4º Bimestre / 2026 (Jul/Ago)">4º Bimestre / 2026 (Jul/Ago)</option>
                  <option value="6º Bimestre / 2026 (Nov/Dez)">6º Bimestre / 2026 (Nov/Dez)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 — ATIVIDADES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900">
                Seção 2 — Atividades Evangelísticas
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Evangelismos Realizados (Quantidade)
                </label>
                <input
                  type="number"
                  value={formData.evangelismsCount ?? 0}
                  onChange={(e) => setFormData({ ...formData, evangelismsCount: Number(e.target.value) })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Frequência das Ações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Semanal rigorosa / Quinzenal"
                  value={formData.frequencyObserved || ''}
                  onChange={(e) => setFormData({ ...formData, frequencyObserved: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Participantes Totais Envolvidos
                </label>
                <input
                  type="number"
                  value={formData.totalParticipants ?? 0}
                  onChange={(e) => setFormData({ ...formData, totalParticipants: Number(e.target.value) })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Locais Alcançados (Praças, Hospitais, Paradas, Bairros)
              </label>
              <input
                type="text"
                placeholder="Ex: Praça da Sé, Estação Brás, Hospital das Clínicas..."
                value={formData.locationsReached || ''}
                onChange={(e) => setFormData({ ...formData, locationsReached: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Descrição Geral das Atividades Desenvolvidas
              </label>
              <textarea
                rows={3}
                placeholder="Descreva o formato das abordagens, louvor, oração por enfermos, etc."
                value={formData.activitiesDescription || ''}
                onChange={(e) => setFormData({ ...formData, activitiesDescription: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
              />
            </div>
          </div>

          {/* SEÇÃO 3 — RESULTADOS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900">
                Seção 3 — Resultados & Frutos Alcançados
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Pessoas Alcançadas
                </label>
                <input
                  type="number"
                  value={formData.peopleReached ?? 0}
                  onChange={(e) => setFormData({ ...formData, peopleReached: Number(e.target.value) })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Contatos com Consentimento
                </label>
                <input
                  type="number"
                  value={formData.contactsCollected ?? 0}
                  onChange={(e) => setFormData({ ...formData, contactsCollected: Number(e.target.value) })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Em Consolidação Ativa
                </label>
                <input
                  type="number"
                  value={formData.contactsInConsolidation ?? 0}
                  onChange={(e) => setFormData({ ...formData, contactsInConsolidation: Number(e.target.value) })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Encaminhados às Igrejas
                </label>
                <input
                  type="number"
                  value={formData.forwardedToChurch ?? 0}
                  onChange={(e) => setFormData({ ...formData, forwardedToChurch: Number(e.target.value) })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Testemunhos e Relatos Marcantes (Autorizados)
              </label>
              <textarea
                rows={3}
                placeholder="Relatos de curas, reconciliações e orações atendidas..."
                value={formData.testimonies || ''}
                onChange={(e) => setFormData({ ...formData, testimonies: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
              />
            </div>
          </div>

          {/* SEÇÃO 4 — AVALIAÇÃO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900">
                Seção 4 — Avaliação & Necessidades Pastorais
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Principais Pontos Fortes Observados
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Assiduidade dos jovens, integração com pastor local..."
                  value={formData.strengths || ''}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Principais Dificuldades Encontradas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Falta de tenda para chuva, sobrecarga na consolidação..."
                  value={formData.difficulties || ''}
                  onChange={(e) => setFormData({ ...formData, difficulties: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Necessidades da Regional (Materiais, Treinamento, Logística)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Envio de 30 exemplares do Módulo 1 físico, reforço de caixa de som..."
                  value={formData.regionalNeeds || ''}
                  onChange={(e) => setFormData({ ...formData, regionalNeeds: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Melhorias Propostas pela Equipe
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Estabelecer duplas de oração fixas para consolidação..."
                  value={formData.proposedImprovements || ''}
                  onChange={(e) => setFormData({ ...formData, proposedImprovements: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Planejamento para o Próximo Período
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Expansão para bairros vizinhos, participação na Cruzada..."
                value={formData.nextPeriodPlanning || ''}
                onChange={(e) => setFormData({ ...formData, nextPeriodPlanning: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
              />
            </div>
          </div>

          {/* SEÇÃO 5 — ANEXOS & DOCUMENTOS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center">
                5
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900">
                Seção 5 — Anexos & Registros Complementares
              </h4>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Notas Documentais e Links de Arquivos / Fotografias
              </label>
              <textarea
                rows={2}
                placeholder="Indique links das fotos aprovadas, atas arquivadas na regional, etc."
                value={formData.documentsNotes || ''}
                onChange={(e) => setFormData({ ...formData, documentsNotes: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
              />
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setIsCreatingNew(false);
              }}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveReport(false)}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold"
            >
              Salvar como Rascunho
            </button>
            <button
              type="button"
              onClick={() => handleSaveReport(true)}
              className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-md"
            >
              Enviar Relatório à Direção Global
            </button>
          </div>
        </div>
      ) : (
        /* Report Detail View (Printable / Reviewable) */
        selectedReport && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-900 text-white no-print">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200"
                >
                  ← Voltar à Lista
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {selectedReport.regionName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedReport.status === 'Aprovado'
                          ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                          : selectedReport.status === 'Em análise'
                          ? 'bg-amber-900 text-amber-200 border border-amber-700'
                          : selectedReport.status === 'Devolvido'
                          ? 'bg-red-900 text-red-200 border border-red-700'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {selectedReport.bimonthlyPeriod} • Coord: {selectedReport.coordinatorName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                {isGlobalAdmin && (
                  <button
                    onClick={() => {
                      setReviewAction('Aprovado');
                      setIsReviewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Parecer da Direção Global</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setFormData(selectedReport);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Dados</span>
                </button>
              </div>
            </div>

            {/* Admin Review Feedback Box if present */}
            {selectedReport.adminComments && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 no-print">
                <div className="flex items-center gap-2 font-bold mb-1 text-amber-900">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  <span>Parecer Oficial da Liderança Global ({selectedReport.reviewedBy || 'Arthur'}):</span>
                </div>
                <p className="pl-6 italic">{selectedReport.adminComments}</p>
                {selectedReport.reviewedAt && (
                  <p className="pl-6 text-[10.5px] text-amber-700 mt-1">
                    Registrado em {new Date(selectedReport.reviewedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {/* Printable Document Sheet */}
            <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm print:p-0 print:border-none print:shadow-none space-y-8">
              {/* Institutional Header */}
              <div className="pb-6 border-b border-stone-200 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-stone-900">
                    SEMEADORES DE FOGO GLOBAL
                  </h1>
                  <p className="text-xs font-bold text-red-800 tracking-wider uppercase mt-0.5">
                    Relatório Oficial de Prestação de Contas Bimestral
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Período: <strong>{selectedReport.bimonthlyPeriod}</strong> • Ano 2026
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-stone-900">{selectedReport.regionName}</span>
                  <p className="text-stone-500 mt-0.5">Coord: {selectedReport.coordinatorName}</p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    Data de Envio: {selectedReport.submissionDate ? new Date(selectedReport.submissionDate).toLocaleDateString('pt-BR') : 'Rascunho'}
                  </p>
                </div>
              </div>

              {/* SEÇÃO 2 — ATIVIDADES EXECUTADAS */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-800 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <span>Atividades de Campo & Frequência</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs mb-3">
                  <div>
                    <span className="text-stone-500 font-semibold block">Evangelismos</span>
                    <span className="text-base font-black text-stone-900">{selectedReport.evangelismsCount} ações</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold block">Frequência Observada</span>
                    <span className="text-sm font-bold text-stone-900">{selectedReport.frequencyObserved || 'Semanal'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold block">Voluntários</span>
                    <span className="text-base font-black text-stone-900">{selectedReport.totalParticipants} semeadores</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold block">Locais</span>
                    <span className="text-xs font-bold text-stone-800 truncate block">{selectedReport.locationsReached || 'Praças Centrais'}</span>
                  </div>
                </div>
                <div className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                  <strong className="text-stone-900 block mb-1">Descrição das Ações:</strong>
                  {selectedReport.activitiesDescription || 'Não informada.'}
                </div>
              </div>

              {/* SEÇÃO 3 — RESULTADOS & CONSOLIDAÇÃO */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-800 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span>Resultados & Consolidação (LGPD)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs mb-3">
                  <div>
                    <span className="text-stone-500 font-semibold block">Pessoas Alcançadas</span>
                    <span className="text-base font-black text-stone-900">{selectedReport.peopleReached}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold block">Contatos Consentidos</span>
                    <span className="text-base font-black text-stone-900">{selectedReport.contactsCollected}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold block">Em Acompanhamento</span>
                    <span className="text-base font-black text-stone-900">{selectedReport.contactsInConsolidation}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-semibold block">Encaminhados às Igrejas</span>
                    <span className="text-base font-black text-stone-900">{selectedReport.forwardedToChurch}</span>
                  </div>
                </div>
                {selectedReport.testimonies && (
                  <div className="text-xs text-stone-700 leading-relaxed bg-amber-50/50 p-3.5 rounded-lg border border-amber-200">
                    <strong className="text-amber-950 block mb-1">Testemunhos Registrados:</strong>
                    {selectedReport.testimonies}
                  </div>
                )}
              </div>

              {/* SEÇÃO 4 — PONTOS FORTES E DIFICULDADES */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-800 text-white text-[10px] font-bold flex items-center justify-center">4</span>
                  <span>Avaliação Crítica & Necessidades</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                    <strong className="text-stone-900 block mb-1">Pontos Fortes:</strong>
                    <p className="text-stone-600">{selectedReport.strengths || 'Não informado.'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                    <strong className="text-stone-900 block mb-1">Dificuldades Encontradas:</strong>
                    <p className="text-stone-600">{selectedReport.difficulties || 'Não informado.'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                    <strong className="text-stone-900 block mb-1">Necessidades da Regional:</strong>
                    <p className="text-stone-600">{selectedReport.regionalNeeds || 'Não informado.'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                    <strong className="text-stone-900 block mb-1">Planejamento Próximo Período:</strong>
                    <p className="text-stone-600">{selectedReport.nextPeriodPlanning || 'Não informado.'}</p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-stone-300 pt-2">
                  <p className="font-bold text-stone-900">{selectedReport.coordinatorName}</p>
                  <p className="text-[11px] text-stone-500">Coordenador Regional — {selectedReport.regionName}</p>
                </div>
                <div className="border-t border-stone-300 pt-2">
                  <p className="font-bold text-stone-900">{selectedReport.reviewedBy || 'Arthur / Lucas Moreira'}</p>
                  <p className="text-[11px] text-stone-500">Liderança Global — Semeadores de Fogo</p>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Review Modal for Global Admin */}
      {isReviewModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Avaliação do Relatório — {selectedReport.regionName}
            </h3>
            <p className="text-xs text-stone-500">
              Defina o parecer da Direção Global para o {selectedReport.bimonthlyPeriod}.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Decisão Ministerial
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('Aprovado')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    reviewAction === 'Aprovado'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  ✓ Aprovar Relatório
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('Devolvido')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    reviewAction === 'Devolvido'
                      ? 'bg-red-50 border-red-500 text-red-900'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  ↺ Devolver para Correção
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Comentários Administrativos e Orientações *
              </label>
              <textarea
                rows={4}
                value={adminReviewComments}
                onChange={(e) => setAdminReviewComments(e.target.value)}
                placeholder="Insira as observações sobre necessidades aprovadas, elogios ou pontos a ajustar..."
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReviewReport}
                className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirmar Parecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
