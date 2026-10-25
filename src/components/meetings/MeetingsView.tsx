import React, { useState, useEffect } from 'react';
import {
  Users2,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Meeting } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const MeetingsView: React.FC = () => {
  const { currentUser, isGlobalAdmin } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);

  // New Meeting Form
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    meetingType: 'Reunião Bimestral de Alinhamento Global' as Meeting['meetingType'],
    date: '',
    time: '20:00',
    zoomLink: 'https://zoom.us/j/90112233999',
    location: 'Ambiente Virtual Zoom',
    agendaText: '',
  });

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
        if (!selectedMeeting && data.length > 0) {
          setSelectedMeeting(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const agendaItems = meetingForm.agendaText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meetingForm,
          agendaItems,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsAddMeetingOpen(false);
        setSelectedMeeting(created);
        loadMeetings();
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Governança & Alinhamento
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Periodicidade Bimestral Obrigatória
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Reuniões de Alinhamento da Liderança
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Calendário de encontros bimestrais com os coordenadores regionais, atas de decisões, pautas estratégicas e monitoramento de deliberações.
          </p>
        </div>

        {isGlobalAdmin && (
          <button
            onClick={() => {
              setMeetingForm((prev) => ({
                ...prev,
                date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
              }));
              setIsAddMeetingOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Reunião</span>
          </button>
        )}
      </div>

      {/* Main Grid: Meeting List & Minutes Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meetings (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {meetings.map((mtg) => {
            const isSelected = selectedMeeting?.id === mtg.id;
            return (
              <div
                key={mtg.id}
                onClick={() => setSelectedMeeting(mtg)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                  isSelected
                    ? 'bg-red-50/70 border-red-300 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      mtg.status === 'Realizada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {mtg.status}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {new Date(mtg.date).toLocaleDateString('pt-BR')} às {mtg.time}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-sm">{mtg.title}</h3>
                <p className="text-[11px] text-stone-500 truncate">{mtg.meetingType}</p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{mtg.agendaItems?.length || 0} pautas</span>
                  <span className="font-semibold text-red-700">Ver Ata e Pautas →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Meeting Minutes & Decisions (7 cols) */}
        <div className="lg:col-span-7">
          {selectedMeeting ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6 text-xs">
              <div className="pb-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {selectedMeeting.meetingType}
                  </span>
                  <h3 className="text-xl font-bold text-stone-900 mt-1">
                    {selectedMeeting.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Data: <strong>{new Date(selectedMeeting.date).toLocaleDateString('pt-BR')} às {selectedMeeting.time}</strong> • {selectedMeeting.location}
                  </p>
                </div>

                {selectedMeeting.zoomLink && (
                  <a
                    href={selectedMeeting.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shrink-0 shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Acessar Zoom</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                )}
              </div>

              {/* Agenda Items */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-stone-800 text-[11px]">
                  Pauta da Reunião:
                </h4>
                <ul className="space-y-1.5 text-stone-700">
                  {selectedMeeting.agendaItems.map((ag, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-red-100 text-red-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{ag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Decisions & Minutes */}
              {selectedMeeting.minutesText && (
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-stone-800 text-[11px]">
                    Ata e Síntese de Deliberações:
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-stone-200 text-stone-700 leading-relaxed italic">
                    {selectedMeeting.minutesText}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-stone-800 text-[11px]">
                    Encaminhamentos e Tarefas Atribuídas:
                  </h4>
                  <div className="space-y-2">
                    {selectedMeeting.actionItems.map((act, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-stone-900">{act.task}</p>
                          <p className="text-[10.5px] text-stone-500">
                            Responsável: <strong>{act.responsible}</strong> • Prazo: {act.deadline}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.completed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {act.completed ? 'Concluído' : 'Em andamento'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              Selecione uma reunião para ver pauta e deliberações.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Agendar Reunião */}
      {isAddMeetingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-stone-900">
              Agendar Reunião de Alinhamento
            </h3>
            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Título da Reunião *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião Bimestral de Alinhamento"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Link Zoom
                </label>
                <input
                  type="text"
                  value={meetingForm.zoomLink}
                  onChange={(e) => setMeetingForm({ ...meetingForm, zoomLink: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Pauta da Reunião (um item por linha)
                </label>
                <textarea
                  rows={4}
                  placeholder="1. Avaliação dos relatórios bimestrais&#10;2. Prestação de contas de cruzadas&#10;3. Implantação de novas regionais"
                  value={meetingForm.agendaText}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agendaText: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMeetingOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Agendar Reunião
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
