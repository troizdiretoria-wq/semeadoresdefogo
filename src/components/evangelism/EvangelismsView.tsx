import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  CheckSquare,
  Sparkles,
  Search,
} from 'lucide-react';
import { EvangelismEvent, Region } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { getClientDb, universalFetch } from '../../lib/clientStore.js';

export const EvangelismsView: React.FC = () => {
  const { currentUser, regions, activeRegionFilter } = useAuth();
  const initialDb = getClientDb();
  const [events, setEvents] = useState<EvangelismEvent[]>(() => {
    let evs = initialDb.evangelismEvents || [];
    if (activeRegionFilter !== 'ALL') {
      evs = evs.filter((e: any) => e.regionId === activeRegionFilter);
    }
    return evs;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedEventToComplete, setSelectedEventToComplete] = useState<EvangelismEvent | null>(null);

  // Planning Form
  const [planForm, setPlanForm] = useState({
    regionId: '',
    name: '',
    dateTime: '',
    location: '',
    address: '',
    actionType: 'Praça Pública' as EvangelismEvent['actionType'],
    expectedParticipants: 20,
    notes: '',
  });

  // Completion Form
  const [completeForm, setCompleteForm] = useState({
    actualParticipants: 20,
    estimatedReached: 100,
    contactsCollected: 15,
    generalReport: '',
    positiveHighlights: '',
    difficultiesFound: '',
    testimonies: '',
    suggestions: '',
  });

  useEffect(() => {
    loadEvents();
  }, [activeRegionFilter]);

  const loadEvents = async () => {
    try {
      const regionParam = activeRegionFilter !== 'ALL' ? `?regionId=${activeRegionFilter}` : '';
      const data = await universalFetch<EvangelismEvent[]>(`/api/evangelisms${regionParam}`);
      if (data && Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Evangelisms fallback active:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRegionId =
      planForm.regionId ||
      (activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || 'reg-sp-01');

    try {
      const created = await universalFetch<EvangelismEvent>('/api/evangelisms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          regionId: targetRegionId,
          leaderId: currentUser?.id,
          leaderName: currentUser?.name || 'Líder',
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (created) {
        setIsPlanModalOpen(false);
        setPlanForm({
          regionId: '',
          name: '',
          dateTime: '',
          location: '',
          address: '',
          actionType: 'Praça Pública',
          expectedParticipants: 20,
          notes: '',
        });
        loadEvents();
      }
    } catch (err) {
      console.error('Error planning evangelism:', err);
    }
  };

  const handleOpenCompleteModal = (ev: EvangelismEvent) => {
    setSelectedEventToComplete(ev);
    setCompleteForm({
      actualParticipants: ev.actualParticipants || ev.expectedParticipants || 20,
      estimatedReached: ev.estimatedReached || 120,
      contactsCollected: ev.contactsCollected || 15,
      generalReport: ev.generalReport || '',
      positiveHighlights: ev.positiveHighlights || '',
      difficultiesFound: ev.difficultiesFound || '',
      testimonies: ev.testimonies || '',
      suggestions: ev.suggestions || '',
    });
    setIsCompleteModalOpen(true);
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventToComplete) return;

    try {
      const updated = await universalFetch<EvangelismEvent>(`/api/evangelisms/${selectedEventToComplete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...completeForm,
          status: 'Realizado',
          completedAt: new Date().toISOString(),
          completedBy: currentUser?.name || 'Líder',
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (updated) {
        setIsCompleteModalOpen(false);
        setSelectedEventToComplete(null);
        loadEvents();
      }
    } catch (err) {
      console.error('Error completing evangelism:', err);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && ev.actionType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Campo & Proclamação
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Alimentação Direta de Relatórios
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Planejamento e Registro de Evangelismos
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Planeje ações nas ruas, confirme participantes e registre os resultados de campo para atualização automática dos indicadores globais.
          </p>
        </div>

        <button
          onClick={() => {
            setPlanForm((prev) => ({
              ...prev,
              regionId: activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || '',
              dateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
            }));
            setIsPlanModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Planejar Nova Ação</span>
        </button>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-stone-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
          </div>

          <select
            aria-label="Filtrar por Status do Evangelismo"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Planejado">Planejado</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Realizado">Realizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            aria-label="Filtrar por Tipo de Ação"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="Praça Pública">Praça Pública</option>
            <option value="Hospital">Hospital</option>
            <option value="Universitário">Universitário</option>
            <option value="Impacto nas Ruas">Impacto nas Ruas</option>
            <option value="Comunidade">Comunidade</option>
            <option value="Semáforo / Ponto de Ônibus">Semáforo / Ponto</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'list'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Lista de Ações
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'calendar'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Calendário Mensal
          </button>
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center text-xs text-stone-500">
              Nenhuma ação evangelística encontrada com os filtros selecionados.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const evRegion = regions.find((r) => r.id === ev.regionId);
              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 shadow-2xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ev.status === 'Realizado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.status === 'Confirmado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ev.status}
                        </span>
                        <span className="font-bold text-xs text-stone-500">
                          {evRegion?.name}
                        </span>
                        <span className="text-xs text-stone-400">• {ev.actionType}</span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-1">
                        {ev.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{ev.location}</span>
                        <span>({ev.address})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ev.status !== 'Realizado' && (
                        <button
                          onClick={() => handleOpenCompleteModal(ev)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Registrar Execução (Pós-Ação)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details & Indicators Strip */}
                  <div className="pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Data e Horário
                      </span>
                      <span className="font-semibold text-stone-800">
                        {new Date(ev.dateTime).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(ev.dateTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Líder Responsável
                      </span>
                      <span className="font-semibold text-stone-800">
                        {ev.leaderName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Participantes
                      </span>
                      <span className="font-semibold text-stone-800">
                        {ev.actualParticipants
                          ? `${ev.actualParticipants} presentes`
                          : `Previsto: ${ev.expectedParticipants}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Resultados de Campo
                      </span>
                      {ev.status === 'Realizado' ? (
                        <span className="font-bold text-emerald-800">
                          {ev.estimatedReached} vidas • {ev.contactsCollected} contatos
                        </span>
                      ) : (
                        <span className="text-stone-400">Aguardando realização</span>
                      )}
                    </div>
                  </div>

                  {/* Summary / Testimonies Accordion if Completed */}
                  {ev.generalReport && (
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                      <p className="text-stone-800">
                        <strong className="text-stone-900">Relato de Campo:</strong> {ev.generalReport}
                      </p>
                      {ev.testimonies && (
                        <p className="text-stone-700 italic border-l-2 border-red-700 pl-2">
                          <strong className="text-stone-900">Testemunho:</strong> {ev.testimonies}
                        </p>
                      )}
                      {ev.difficultiesFound && (
                        <p className="text-stone-600">
                          <strong className="text-stone-800">Desafios Encontrados:</strong> {ev.difficultiesFound}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-base">
              Outubro de 2026
            </h3>
            <span className="text-xs text-stone-500">
              {filteredEvents.length} ação(ões) agendada(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-all bg-stone-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                    {new Date(ev.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-[10.5px] font-semibold text-stone-500">
                    {new Date(ev.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="font-bold text-stone-900">{ev.name}</h4>
                <p className="text-stone-500 truncate">{ev.location}</p>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                  <span className="text-stone-600 font-medium">{ev.actionType}</span>
                  <span className="font-bold text-stone-800">{ev.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Planejar Evangelismo */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Planejar Nova Ação Evangelística
            </h3>
            <p className="text-xs text-stone-500">
              Organize a data, local e equipe com antecedência para alinhamento regional.
            </p>

            <form onSubmit={handlePlanEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Regional Responsável *
                </label>
                <select
                  aria-label="Regional Responsável pelo Evangelismo"
                  value={planForm.regionId}
                  onChange={(e) => setPlanForm({ ...planForm, regionId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Nome / Chamada da Ação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Invasão de Fogo — Praça Central"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Data e Horário *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={planForm.dateTime}
                    onChange={(e) => setPlanForm({ ...planForm, dateTime: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Tipo de Ação *
                  </label>
                  <select
                    aria-label="Tipo de Ação de Evangelismo"
                    value={planForm.actionType}
                    onChange={(e) => setPlanForm({ ...planForm, actionType: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                  >
                    <option value="Praça Pública">Praça Pública</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Universitário">Universitário</option>
                    <option value="Impacto nas Ruas">Impacto nas Ruas</option>
                    <option value="Comunidade">Comunidade</option>
                    <option value="Semáforo / Ponto de Ônibus">Semáforo / Ponto de Ônibus</option>
                    <option value="Cruzada Local">Cruzada Local</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Local / Ponto de Encontro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Praça da Sé — Tenda Central"
                  value={planForm.location}
                  onChange={(e) => setPlanForm({ ...planForm, location: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro e referências..."
                  value={planForm.address}
                  onChange={(e) => setPlanForm({ ...planForm, address: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Participantes Previstos
                </label>
                <input
                  type="number"
                  min={1}
                  value={planForm.expectedParticipants}
                  onChange={(e) => setPlanForm({ ...planForm, expectedParticipants: Number(e.target.value) })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Orientações e Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Vestimenta (camisetas/coletes oficiais), intercessão prévia..."
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Confirmar Planejamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Execução / Pós-Ação */}
      {isCompleteModalOpen && selectedEventToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-stone-900">
              Relatório de Execução de Campo (Pós-Ação)
            </h3>
            <p className="text-xs text-stone-500">
              Registrando resultados de: <strong>{selectedEventToComplete.name}</strong>
            </p>

            <form onSubmit={handleSaveCompletion} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Voluntários
                  </label>
                  <input
                    type="number"
                    required
                    value={completeForm.actualParticipants}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualParticipants: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Alcançados
                  </label>
                  <input
                    type="number"
                    required
                    value={completeForm.estimatedReached}
                    onChange={(e) => setCompleteForm({ ...completeForm, estimatedReached: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Contatos (LGPD)
                  </label>
                  <input
                    type="number"
                    required
                    value={completeForm.contactsCollected}
                    onChange={(e) => setCompleteForm({ ...completeForm, contactsCollected: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Relato Geral da Ação *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva a recepção da comunidade, manifestação do Espírito, dinâmica..."
                  value={completeForm.generalReport}
                  onChange={(e) => setCompleteForm({ ...completeForm, generalReport: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Testemunhos e Reconciliações Marcantes
                </label>
                <textarea
                  rows={2}
                  placeholder="Relatos autorizados de curas e conversões..."
                  value={completeForm.testimonies}
                  onChange={(e) => setCompleteForm({ ...completeForm, testimonies: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Pontos Positivos
                  </label>
                  <textarea
                    rows={2}
                    value={completeForm.positiveHighlights}
                    onChange={(e) => setCompleteForm({ ...completeForm, positiveHighlights: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Dificuldades Encontradas
                  </label>
                  <textarea
                    rows={2}
                    value={completeForm.difficultiesFound}
                    onChange={(e) => setCompleteForm({ ...completeForm, difficultiesFound: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                >
                  Salvar e Atualizar Indicadores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
