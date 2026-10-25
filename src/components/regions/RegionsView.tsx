import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Users,
  Flame,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Phone,
  Mail,
  Shield,
  Edit,
  Search,
} from 'lucide-react';
import { Region, Member, EvangelismEvent, BimonthlyReport } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const RegionsView: React.FC = () => {
  const { isGlobalAdmin, currentUser, reloadRegions } = useAuth();
  const [regionsList, setRegionsList] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'evangelisms' | 'reports'>('info');

  const [members, setMembers] = useState<Member[]>([]);
  const [evangelisms, setEvangelisms] = useState<EvangelismEvent[]>([]);
  const [reports, setReports] = useState<BimonthlyReport[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Region Form
  const [newRegionData, setNewRegionData] = useState({
    name: '',
    state: 'SP',
    city: '',
    sponsoringChurch: '',
    responsiblePastor: '',
    coordinatorName: '',
    contactEmail: '',
    contactPhone: '',
    plannedFrequency: 'quinzenal' as 'semanal' | 'quinzenal',
    status: 'implanting' as 'active' | 'implanting' | 'paused',
  });

  // New Member Form Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Semeador de Rua');

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      loadRegionalDetails(selectedRegion.id);
    }
  }, [selectedRegion]);

  const loadRegions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/regions');
      if (res.ok) {
        const data: Region[] = await res.json();
        setRegionsList(data);
        if (!selectedRegion && data.length > 0) {
          setSelectedRegion(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegionalDetails = async (regionId: string) => {
    try {
      const [memRes, evRes, repRes] = await Promise.all([
        fetch(`/api/members?regionId=${regionId}`),
        fetch(`/api/evangelisms?regionId=${regionId}`),
        fetch(`/api/reports?regionId=${regionId}`),
      ]);
      if (memRes.ok) setMembers(await memRes.json());
      if (evRes.ok) setEvangelisms(await evRes.json());
      if (repRes.ok) setReports(await repRes.json());
    } catch (err) {
      console.error('Error loading regional details:', err);
    }
  };

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRegionData,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setIsCreateModalOpen(false);
        setNewRegionData({
          name: '',
          state: 'SP',
          city: '',
          sponsoringChurch: '',
          responsiblePastor: '',
          coordinatorName: '',
          contactEmail: '',
          contactPhone: '',
          plannedFrequency: 'quinzenal',
          status: 'implanting',
        });
        await reloadRegions();
        loadRegions();
        setSelectedRegion(created);
      }
    } catch (err) {
      console.error('Error creating region:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegion) return;
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName,
          regionId: selectedRegion.id,
          email: newMemberEmail,
          phone: newMemberPhone,
          roleInMinistry: newMemberRole,
          baptismInHolySpirit: true,
          trainingCompleted: false,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });
      if (res.ok) {
        setIsAddMemberOpen(false);
        setNewMemberName('');
        setNewMemberEmail('');
        setNewMemberPhone('');
        loadRegionalDetails(selectedRegion.id);
        loadRegions();
      }
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  const handleUpdateFrequency = async (freq: 'semanal' | 'quinzenal') => {
    if (!selectedRegion || !isGlobalAdmin) return;
    try {
      const res = await fetch(`/api/regions/${selectedRegion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedFrequency: freq }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedRegion(updated);
        loadRegions();
      }
    } catch (err) {
      console.error('Error updating frequency:', err);
    }
  };

  const filteredRegions = regionsList.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Expansão e Unidades
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Governança Descentralizada
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Gestão das Regionais
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Cadastro, frequência obrigatória de evangelismo e acompanhamento das igrejas patrocinadoras.
          </p>
        </div>

        {isGlobalAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Implantar Nova Regional</span>
          </button>
        )}
      </div>

      {/* Main Grid: Regionals Selector (Left) & Regional Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Regionals (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por cidade, estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-red-700"
            />
          </div>

          <div className="space-y-2">
            {filteredRegions.map((reg) => {
              const isSelected = reg.id === selectedRegion?.id;
              return (
                <div
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-red-50/70 border-red-300 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">
                      {reg.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                        reg.plannedFrequency === 'semanal'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {reg.plannedFrequency}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 mt-1 truncate">
                    {reg.sponsoringChurch}
                  </p>
                  <p className="text-[10.5px] text-stone-400 mt-0.5">
                    Coord: {reg.coordinatorName}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">
                      {reg.memberCount} integrantes
                    </span>
                    <span
                      className={`font-semibold ${
                        reg.status === 'active' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {reg.status === 'active' ? 'Ativa' : 'Em Implantação'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Regional Full Profile (8 cols) */}
        <div className="lg:col-span-8">
          {selectedRegion ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Regional Header */}
              <div className="p-6 bg-stone-900 text-white border-b border-stone-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-700 text-white">
                        {selectedRegion.state}
                      </span>
                      <span className="text-xs text-stone-400">
                        Implantada em {new Date(selectedRegion.implantationDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {selectedRegion.name}
                    </h3>
                    <p className="text-xs text-stone-300 mt-0.5">
                      Igreja Patrocinadora: <strong>{selectedRegion.sponsoringChurch}</strong>
                    </p>
                  </div>

                  {/* Frequency Switcher (Global Admin Rule) */}
                  <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs shrink-0">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase mb-1">
                      Frequência de Evangelismos
                    </span>
                    {isGlobalAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFrequency('semanal')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            selectedRegion.plannedFrequency === 'semanal'
                              ? 'bg-red-700 text-white shadow-xs'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          Semanal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFrequency('quinzenal')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            selectedRegion.plannedFrequency === 'quinzenal'
                              ? 'bg-red-700 text-white shadow-xs'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          Quinzenal
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-amber-400 uppercase">
                        {selectedRegion.plannedFrequency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subnav Tabs */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-stone-800 text-xs font-semibold text-stone-400">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-1 border-b-2 transition-colors ${
                      activeTab === 'info'
                        ? 'border-red-500 text-white'
                        : 'border-transparent hover:text-stone-200'
                    }`}
                  >
                    Visão Geral
                  </button>
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-1 border-b-2 transition-colors ${
                      activeTab === 'members'
                        ? 'border-red-500 text-white'
                        : 'border-transparent hover:text-stone-200'
                    }`}
                  >
                    Integrantes & Semeadores ({members.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('evangelisms')}
                    className={`pb-1 border-b-2 transition-colors ${
                      activeTab === 'evangelisms'
                        ? 'border-red-500 text-white'
                        : 'border-transparent hover:text-stone-200'
                    }`}
                  >
                    Evangelismos ({evangelisms.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`pb-1 border-b-2 transition-colors ${
                      activeTab === 'reports'
                        ? 'border-red-500 text-white'
                        : 'border-transparent hover:text-stone-200'
                    }`}
                  >
                    Relatórios Bimestrais ({reports.length})
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {activeTab === 'info' && (
                  <div className="space-y-6 text-xs">
                    {/* General Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                          Liderança Pastoral Local
                        </span>
                        <p className="text-sm font-bold text-stone-900">
                          {selectedRegion.responsiblePastor}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Igreja: {selectedRegion.sponsoringChurch}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                          Coordenador de Evangelismo
                        </span>
                        <p className="text-sm font-bold text-stone-900">
                          {selectedRegion.coordinatorName}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Contato: {selectedRegion.contactPhone}
                        </p>
                      </div>
                    </div>

                    {/* Operational Rule Card */}
                    <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/80">
                      <h4 className="font-bold text-red-950 mb-1 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-red-700" />
                        <span>Diretriz Ministerial de Operação</span>
                      </h4>
                      <p className="text-stone-700 leading-relaxed">
                        Conforme deliberado na reunião estratégica de 16 de outubro de 2026, as regionais de capitais maiores cumprem evangelismos <strong>semanais</strong>, enquanto núcleos em implantação ou cidades menores operam em ritmo <strong>quinzenal</strong>. Todas as ações devem ser informadas nos relatórios bimestrais.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                        Semeadores Cadastrados na Regional
                      </h4>
                      <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cadastrar Semeador</span>
                      </button>
                    </div>

                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                      {members.length === 0 ? (
                        <p className="p-6 text-center text-xs text-stone-500">
                          Nenhum semeador cadastrado nesta regional ainda.
                        </p>
                      ) : (
                        members.map((mem) => (
                          <div key={mem.id} className="p-3.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-stone-900">{mem.name}</p>
                              <p className="text-[11px] text-stone-500">
                                {mem.roleInMinistry} • Tel: {mem.phone}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {mem.trainingCompleted ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Formação Concluída
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                                  Em Formação
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'evangelisms' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                      Histórico e Próximos Evangelismos
                    </h4>
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                      {evangelisms.length === 0 ? (
                        <p className="p-6 text-center text-xs text-stone-500">
                          Nenhum evangelismo registrado para esta regional.
                        </p>
                      ) : (
                        evangelisms.map((ev) => (
                          <div key={ev.id} className="p-3.5 flex items-center justify-between text-xs">
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                                  ev.status === 'Realizado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {ev.status}
                              </span>
                              <span className="font-bold text-stone-900">{ev.name}</span>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                {ev.location} • {new Date(ev.dateTime).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="text-right">
                              {ev.status === 'Realizado' ? (
                                <span className="font-bold text-stone-900">
                                  {ev.estimatedReached} vidas alcançadas
                                </span>
                              ) : (
                                <span className="text-stone-500">
                                  Previsto: {ev.expectedParticipants} semeadores
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                      Relatórios Bimestrais da Regional
                    </h4>
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                      {reports.length === 0 ? (
                        <p className="p-6 text-center text-xs text-stone-500">
                          Nenhum relatório bimestral enviado ainda.
                        </p>
                      ) : (
                        reports.map((rep) => (
                          <div key={rep.id} className="p-3.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-stone-900">{rep.bimonthlyPeriod}</p>
                              <p className="text-[11px] text-stone-500">
                                {rep.evangelismsCount} ações • {rep.peopleReached} pessoas alcançadas
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                                rep.status === 'Aprovado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              Selecione uma regional para visualizar os detalhes operacionais.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Implantar Nova Regional */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Implantar Nova Regional
            </h3>
            <p className="text-xs text-stone-500">
              Cadastre a unidade com sua igreja patrocinadora e pastor responsável.
            </p>

            <form onSubmit={handleCreateRegion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Nome da Regional *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paraná — Curitiba"
                  value={newRegionData.name}
                  onChange={(e) => setNewRegionData({ ...newRegionData, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="SP, MG, RJ..."
                    value={newRegionData.state}
                    onChange={(e) => setNewRegionData({ ...newRegionData, state: e.target.value.toUpperCase() })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cidade"
                    value={newRegionData.city}
                    onChange={(e) => setNewRegionData({ ...newRegionData, city: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Igreja Patrocinadora *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome da Igreja Local Parceira"
                  value={newRegionData.sponsoringChurch}
                  onChange={(e) => setNewRegionData({ ...newRegionData, sponsoringChurch: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Pastor Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Pr. Nome"
                    value={newRegionData.responsiblePastor}
                    onChange={(e) => setNewRegionData({ ...newRegionData, responsiblePastor: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Coordenador de Evangelismo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do Coordenador"
                    value={newRegionData.coordinatorName}
                    onChange={(e) => setNewRegionData({ ...newRegionData, coordinatorName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Frequência Prevista
                  </label>
                  <select
                    aria-label="Frequência Prevista da Regional"
                    value={newRegionData.plannedFrequency}
                    onChange={(e) => setNewRegionData({ ...newRegionData, plannedFrequency: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                  >
                    <option value="quinzenal">Quinzenal (Igrejas Menores)</option>
                    <option value="semanal">Semanal (Regionais Maiores)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(XX) 99999-9999"
                    value={newRegionData.contactPhone}
                    onChange={(e) => setNewRegionData({ ...newRegionData, contactPhone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  Cadastrar Regional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Semeador */}
      {isAddMemberOpen && selectedRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Cadastrar Semeador — {selectedRegion.name}
            </h3>
            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do integrante"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Função no Ministério
                </label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Telefone (WhatsApp)
                  </label>
                  <input
                    type="text"
                    placeholder="(XX) 99999-9999"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold"
                >
                  Salvar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
