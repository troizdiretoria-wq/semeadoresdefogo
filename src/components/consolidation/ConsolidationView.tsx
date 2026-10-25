import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  MessageCircle,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Lock,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { ConsolidationContact, FollowUpActivity } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const ConsolidationView: React.FC = () => {
  const { currentUser, regions, activeRegionFilter } = useAuth();
  const [contacts, setContacts] = useState<ConsolidationContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected contact for detail / follow-up log
  const [selectedContact, setSelectedContact] = useState<ConsolidationContact | null>(null);

  // Modals
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  // Add Contact Form (Strict LGPD)
  const [contactForm, setContactForm] = useState({
    regionId: '',
    name: '',
    phone: '',
    email: '',
    neighborhood: '',
    city: '',
    age: '',
    prayerRequests: '',
    consentGiven: false,
    sensitiveDataConsent: false,
  });

  // Add Activity Form
  const [activityForm, setActivityForm] = useState({
    type: 'WhatsApp' as FollowUpActivity['type'],
    notes: '',
    nextActionDate: '',
    nextActionDescription: '',
    newStatus: '',
  });

  useEffect(() => {
    loadContacts();
  }, [activeRegionFilter]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const regionParam = activeRegionFilter !== 'ALL' ? `?regionId=${activeRegionFilter}` : '';
      const res = await fetch(`/api/contacts${regionParam}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        if (selectedContact) {
          const updated = data.find((c: ConsolidationContact) => c.id === selectedContact.id);
          if (updated) setSelectedContact(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching consolidation contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.consentGiven) {
      alert('É obrigatório obter o consentimento do titular conforme a LGPD.');
      return;
    }

    const targetRegionId =
      contactForm.regionId ||
      (activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || 'reg-sp-01');

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          regionId: targetRegionId,
          assignedWorkerId: currentUser?.id,
          assignedWorkerName: currentUser?.name,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        setIsAddContactOpen(false);
        setContactForm({
          regionId: '',
          name: '',
          phone: '',
          email: '',
          neighborhood: '',
          city: '',
          age: '',
          prayerRequests: '',
          consentGiven: false,
          sensitiveDataConsent: false,
        });
        loadContacts();
      }
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    try {
      const res = await fetch(`/api/contacts/${selectedContact.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activityForm,
          workerName: currentUser?.name || 'Voluntário de Consolidação',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedContact(updated);
        setIsAddActivityOpen(false);
        setActivityForm({
          type: 'WhatsApp',
          notes: '',
          nextActionDate: '',
          nextActionDescription: '',
          newStatus: '',
        });
        loadContacts();
      }
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.neighborhood.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pipeline metrics
  const total = contacts.length;
  const pending = contacts.filter((c) => c.status === 'Novo contato' || c.status === 'Aguardando 1º contato').length;
  const inProgress = contacts.filter((c) => c.status === 'Em acompanhamento').length;
  const forwarded = contacts.filter((c) => c.status === 'Encaminhado à igreja' || c.status === 'Acompanhamento concluído').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-700" />
              <span>Conformidade LGPD • Dados Sensíveis Protegidos</span>
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Ministério de Consolidação & Discipulado
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Acompanhamento individual das vidas evangelizadas. Registro de orações, contatos autorizados e encaminhamento pastoral com proteção legal.
          </p>
        </div>

        <button
          onClick={() => {
            setContactForm((prev) => ({
              ...prev,
              regionId: activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || '',
            }));
            setIsAddContactOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-950/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Contato com Consentimento</span>
        </button>
      </div>

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Total Autorizado</span>
          <p className="text-2xl font-black text-stone-900 mt-1">{total}</p>
          <span className="text-[11px] text-stone-500">Contatos sob tutela LGPD</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Aguardando 1º Contato</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{pending}</p>
          <span className="text-[11px] text-amber-600 font-medium">Meta: até 48h pós-ação</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-sky-600 uppercase">Em Discipulado Ativo</span>
          <p className="text-2xl font-black text-sky-800 mt-1">{inProgress}</p>
          <span className="text-[11px] text-stone-500">Acompanhamento contínuo</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Encaminhados à Igreja</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{forwarded}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Integrados nas congregações</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, bairro ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 w-56"
            />
          </div>

          <select
            aria-label="Filtrar por Etapa da Consolidação"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none"
          >
            <option value="ALL">Todas as Etapas</option>
            <option value="Novo contato">Novo contato</option>
            <option value="Aguardando 1º contato">Aguardando 1º contato</option>
            <option value="Em acompanhamento">Em acompanhamento</option>
            <option value="Encaminhado à igreja">Encaminhado à igreja</option>
            <option value="Acompanhamento concluído">Acompanhamento concluído</option>
            <option value="Sem interesse">Sem interesse</option>
          </select>
        </div>

        <div className="text-xs text-stone-500 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-stone-400" />
          <span>Acesso restrito a obreiros autorizados da consolidação</span>
        </div>
      </div>

      {/* Contacts Grid & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contact Cards List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center text-xs text-stone-500">
              Nenhum contato encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const reg = regions.find((r) => r.id === contact.regionId);
              const isSelected = selectedContact?.id === contact.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{contact.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        {reg?.name} • {contact.neighborhood ? `${contact.neighborhood}, ${contact.city}` : contact.city}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        contact.status === 'Encaminhado à igreja'
                          ? 'bg-blue-100 text-blue-800'
                          : contact.status === 'Em acompanhamento'
                          ? 'bg-emerald-100 text-emerald-800'
                          : contact.status === 'Aguardando 1º contato'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {contact.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-stone-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {contact.phone}
                    </span>
                    <span>•</span>
                    <span>
                      Obreiro: <strong>{contact.assignedWorkerName || 'Não designado'}</strong>
                    </span>
                  </div>

                  {contact.prayerRequests && (
                    <p className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 text-[11px] italic">
                      <strong className="text-stone-900 not-italic">Pedido de Oração: </strong>
                      {contact.prayerRequests}
                    </p>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10.5px] text-stone-400">
                    <span>{contact.activities?.length || 0} interação(ões) registrada(s)</span>
                    <span className="font-medium text-emerald-800 flex items-center gap-1">
                      <span>Ver Histórico</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Contact Interaction Log (5 cols) */}
        <div className="lg:col-span-5">
          {selectedContact ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Registro de Acompanhamento Pastoral
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-1">
                    {selectedContact.name}
                  </h3>
                  <p className="text-stone-500 text-[11px]">
                    Tel: {selectedContact.phone} • {selectedContact.city}
                  </p>
                </div>

                <button
                  onClick={() => setIsAddActivityOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Contato</span>
                </button>
              </div>

              {/* Status Update / Church Forwarding */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-bold text-stone-700 uppercase text-[10px] block">
                  Igreja Local de Encaminhamento
                </span>
                <p className="font-semibold text-stone-900">
                  {selectedContact.churchForwardedTo || 'Ainda em fase de aproximação'}
                </p>
              </div>

              {/* Activities Timeline */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-stone-600 text-[11px] mb-3">
                  Histórico de Interações ({selectedContact.activities?.length || 0})
                </h4>

                <div className="space-y-3">
                  {(!selectedContact.activities || selectedContact.activities.length === 0) ? (
                    <p className="p-4 rounded-xl bg-stone-50 text-stone-400 text-center italic">
                      Nenhuma tentativa de contato registrada ainda. Clique em "Novo Contato" acima para registrar a primeira ligação ou mensagem.
                    </p>
                  ) : (
                    selectedContact.activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-emerald-700" />
                            {act.type}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(act.date).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">{act.notes}</p>
                        <p className="text-[10px] text-stone-400">
                          Registrado por: {act.workerName}
                        </p>
                        {act.nextActionDescription && (
                          <div className="mt-1 pt-1 border-t border-stone-200 text-[10.5px] text-emerald-800 font-medium">
                            Próxima ação: {act.nextActionDescription} ({new Date(act.nextActionDate || '').toLocaleDateString('pt-BR')})
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              Selecione um contato na lista ao lado para ver o histórico e registrar novos atendimentos de consolidação.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cadastrar Contato com Consentimento LGPD */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base text-stone-900">
                Cadastro de Contato Evangelizado (LGPD)
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Os dados de fé e oração são pessoais e sensíveis (Art. 5º, II da LGPD). O consentimento é indispensável.
            </p>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Regional *
                </label>
                <select
                  aria-label="Regional de Consolidação"
                  value={contactForm.regionId}
                  onChange={(e) => setContactForm({ ...contactForm, regionId: e.target.value })}
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome da pessoa evangelizada"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Telefone (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(XX) 99999-9999"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Bairro / Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Bairro, Cidade"
                    value={contactForm.neighborhood}
                    onChange={(e) => setContactForm({ ...contactForm, neighborhood: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Pedido de Oração / Motivo de Contato
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Oração pela família, emprego, libertação, cura..."
                  value={contactForm.prayerRequests}
                  onChange={(e) => setContactForm({ ...contactForm, prayerRequests: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              {/* LGPD Consent Checkbox */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={contactForm.consentGiven}
                    onChange={(e) => setContactForm({ ...contactForm, consentGiven: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span className="text-[11px] text-emerald-950 font-medium leading-tight">
                    <strong>Consentimento Formal do Titular:</strong> Confirmo que a pessoa autorizou expressamente o recebimento de mensagens e orações ministeriais da equipe de consolidação dos Semeadores de Fogo.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                >
                  Salvar Contato Autorizado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nova Interação */}
      {isAddActivityOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Registrar Interação com {selectedContact.name}
            </h3>

            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Tipo de Contato *
                </label>
                <select
                  aria-label="Tipo de Contato de Consolidação"
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as any })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                >
                  <option value="WhatsApp">WhatsApp (Mensagem de Acolhimento)</option>
                  <option value="Ligação">Ligação Telefônica de Oração</option>
                  <option value="Visita">Visita Presencial / Hospitalar</option>
                  <option value="Convite Culto">Convite para Culto / Célula</option>
                  <option value="Oração">Intercessão Pastoral</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Relato da Conversa / Situação *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Como a pessoa recebeu a palavra? Como está a situação de oração?"
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Atualizar Etapa do Contato
                </label>
                <select
                  aria-label="Atualizar Etapa do Contato"
                  value={activityForm.newStatus}
                  onChange={(e) => setActivityForm({ ...activityForm, newStatus: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                >
                  <option value="">Manter etapa atual ({selectedContact.status})</option>
                  <option value="Em acompanhamento">Em acompanhamento</option>
                  <option value="Encaminhado à igreja">Encaminhado à igreja local</option>
                  <option value="Acompanhamento concluído">Acompanhamento concluído com êxito</option>
                  <option value="Sem interesse">Sem interesse em continuar</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddActivityOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                >
                  Gravar Histórico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
