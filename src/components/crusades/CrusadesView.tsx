import React, { useState, useEffect } from 'react';
import {
  Flag,
  Plus,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Clock,
  Sparkles,
  Shield,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Crusade, CrusadeChecklistItem } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const CrusadesView: React.FC = () => {
  const { currentUser, regions, activeRegionFilter } = useAuth();
  const [crusades, setCrusades] = useState<Crusade[]>([]);
  const [selectedCrusade, setSelectedCrusade] = useState<Crusade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Crusade Form
  const [crusadeForm, setCrusadeForm] = useState({
    title: '',
    regionId: '',
    hostCity: '',
    hostState: 'SP',
    startDate: '',
    endDate: '',
    estimatedAttendance: 1000,
    budgetEstimated: 5000,
    intercessionLead: 'Sarah Martins',
    worshipLead: 'Louvor Ministerial',
    logisticsLead: 'Arthur',
    outreachMaterialsLead: 'Eduardo Felyx',
  });

  useEffect(() => {
    loadCrusades();
  }, []);

  const loadCrusades = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crusades');
      if (res.ok) {
        const data = await res.json();
        setCrusades(data);
        if (!selectedCrusade && data.length > 0) {
          setSelectedCrusade(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching crusades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChecklist = async (chkId: string, currentCompleted: boolean) => {
    if (!selectedCrusade) return;
    try {
      const res = await fetch(`/api/crusades/${selectedCrusade.id}/checklist/${chkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCrusade(updated);
        loadCrusades();
      }
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const handleCreateCrusade = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRegionId =
      crusadeForm.regionId ||
      (activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || 'reg-sp-01');

    try {
      const res = await fetch('/api/crusades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...crusadeForm,
          regionId: targetRegionId,
          coordinatorName: currentUser?.name || 'Coordenação de Eventos',
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsCreateModalOpen(false);
        setSelectedCrusade(created);
        loadCrusades();
      }
    } catch (err) {
      console.error('Error creating crusade:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Grandes Mobilizações
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Intercâmbio Regional e Impacto em Massa
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Cruzadas Evangelísticas & Eventos
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Planejamento de impacto em praças e estádios com checklist padronizado de segurança, intercessão prévia e logística entre regionais.
          </p>
        </div>

        <button
          onClick={() => {
            setCrusadeForm((prev) => ({
              ...prev,
              regionId: activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || '',
              startDate: new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10),
              endDate: new Date(Date.now() + 86400000 * 22).toISOString().slice(0, 10),
            }));
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Planejar Nova Cruzada</span>
        </button>
      </div>

      {/* Main Grid: Crusades List & Checklist Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Crusades (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {crusades.map((cru) => {
            const isSelected = selectedCrusade?.id === cru.id;
            const completedCount = cru.checklist.filter((c) => c.completed).length;
            const progress = Math.round((completedCount / cru.checklist.length) * 100);

            return (
              <div
                key={cru.id}
                onClick={() => setSelectedCrusade(cru)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-xs space-y-3 ${
                  isSelected
                    ? 'bg-red-50/70 border-red-300 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cru.status === 'Confirmada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cru.status}
                  </span>
                  <span className="font-semibold text-stone-500 text-[11px]">
                    {new Date(cru.startDate).toLocaleDateString('pt-BR')} a{' '}
                    {new Date(cru.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base">{cru.title}</h3>
                <p className="text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    {cru.hostCity} — {cru.hostState}
                  </span>
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px] text-stone-500">
                    <span>Checklist Operacional</span>
                    <span className="font-bold">{progress}% concluído</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-700 h-full rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                  <span>Público Estimado: {cru.estimatedAttendance}</span>
                  <span className="font-bold text-stone-800">
                    R$ {cru.budgetEstimated.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Crusade Operational Checklist & Leads (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCrusade ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6 text-xs">
              <div className="pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                    Planejamento & Checklist Operacional
                  </span>
                  <span className="text-xs text-stone-400">
                    {selectedCrusade.hostCity} ({selectedCrusade.hostState})
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mt-1">
                  {selectedCrusade.title}
                </h3>
              </div>

              {/* Responsáveis pelas Frentes */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Intercessão Prévia (21 dias)
                  </span>
                  <span className="font-bold text-stone-800">
                    {selectedCrusade.intercessionLead}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Adoração & Louvor
                  </span>
                  <span className="font-bold text-stone-800">
                    {selectedCrusade.worshipLead}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Logística & Estrutura
                  </span>
                  <span className="font-bold text-stone-800">
                    {selectedCrusade.logisticsLead}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Materiais & Comunicação
                  </span>
                  <span className="font-bold text-stone-800">
                    {selectedCrusade.outreachMaterialsLead}
                  </span>
                </div>
              </div>

              {/* Interactive Reusable Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold uppercase tracking-wider text-stone-800 text-xs">
                    Checklist Operacional Padrão
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    Clique para alternar status
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCrusade.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id, item.completed)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                            item.completed
                              ? 'bg-emerald-600 text-white'
                              : 'border border-stone-300 bg-stone-50'
                          }`}
                        >
                          {item.completed && '✓'}
                        </div>
                        <div>
                          <p className={`font-semibold ${item.completed ? 'line-through opacity-70' : ''}`}>
                            {item.item}
                          </p>
                          <p className="text-[10.5px] text-stone-400">
                            Categoria: {item.category} • Responsável: {item.responsible}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.completed
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {item.completed ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              Selecione uma cruzada para visualizar o checklist operacional.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nova Cruzada */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-stone-900">
              Planejar Cruzada Evangelística
            </h3>
            <form onSubmit={handleCreateCrusade} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Título da Cruzada *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cruzada de Fogo & Avivamento"
                  value={crusadeForm.title}
                  onChange={(e) => setCrusadeForm({ ...crusadeForm, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cidade"
                    value={crusadeForm.hostCity}
                    onChange={(e) => setCrusadeForm({ ...crusadeForm, hostCity: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="SP, MG..."
                    value={crusadeForm.hostState}
                    onChange={(e) => setCrusadeForm({ ...crusadeForm, hostState: e.target.value.toUpperCase() })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={crusadeForm.startDate}
                    onChange={(e) => setCrusadeForm({ ...crusadeForm, startDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Data Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={crusadeForm.endDate}
                    onChange={(e) => setCrusadeForm({ ...crusadeForm, endDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Público Estimado
                  </label>
                  <input
                    type="number"
                    value={crusadeForm.estimatedAttendance}
                    onChange={(e) => setCrusadeForm({ ...crusadeForm, estimatedAttendance: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Orçamento Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={crusadeForm.budgetEstimated}
                    onChange={(e) => setCrusadeForm({ ...crusadeForm, budgetEstimated: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Confirmar Cruzada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
