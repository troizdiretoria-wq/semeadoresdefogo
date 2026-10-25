import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Coins,
  Scale,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Clock,
  Lock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { User, AuditLog, FinancialRecord } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface AdminManagementViewProps {
  initialSubTab?: 'users' | 'financial' | 'legal';
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  initialSubTab = 'users',
}) => {
  const { currentUser, isGlobalAdmin, allUsers, regions } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'financial' | 'legal'>(initialSubTab);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Budget / Travel Form
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    category: 'Orçamento de Evento' as FinancialRecord['category'],
    title: '',
    description: '',
    amount: 1500,
    status: 'Estimado' as FinancialRecord['status'],
    notes: '',
  });

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, finRes] = await Promise.all([
        fetch('/api/audit-logs'),
        fetch('/api/financial'),
      ]);
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (finRes.ok) setFinancials(await finRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...budgetForm,
          responsibleName: currentUser?.name || 'Arthur',
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        setIsAddBudgetOpen(false);
        setBudgetForm({
          category: 'Orçamento de Evento',
          title: '',
          description: '',
          amount: 1500,
          status: 'Estimado',
          notes: '',
        });
        loadAdminData();
      }
    } catch (err) {
      console.error('Error creating financial record:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Controle Restrito • Direção Global
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Administração, Finanças & Governança Jurídica
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Gestão de usuários e permissões de acesso (RBAC), orçamentos de viagens de implantação, patrimônio digital e acompanhamento do registro da marca no INPI.
          </p>
        </div>

        {activeSubTab === 'financial' && (
          <button
            onClick={() => setIsAddBudgetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro Orçamentário</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-stone-200 text-xs font-semibold text-stone-500">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeSubTab === 'users'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Usuários & Permissões ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('financial')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeSubTab === 'financial'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Gestão Financeira & Logística de Viagens ({financials.length})
        </button>
        <button
          onClick={() => setActiveSubTab('legal')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeSubTab === 'legal'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Registro de Marca (INPI) & Patrimônio Digital
        </button>
      </div>

      {/* Tab: Usuários & Auditoria */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Usuários com Acesso ao Portal Ministerial
              </span>
              <span className="text-stone-500">
                Permissões auditadas no backend
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/70 border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome & Contato</th>
                  <th className="py-3 px-4">Nível de Acesso (RBAC)</th>
                  <th className="py-3 px-4">Regional Vinculada</th>
                  <th className="py-3 px-4">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allUsers.map((u) => {
                  const reg = regions.find((r) => r.id === u.regionId);
                  return (
                    <tr key={u.id} className="hover:bg-stone-50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                            u.role === 'admin_global'
                              ? 'bg-red-100 text-red-900'
                              : u.role === 'coordenador_regional'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {u.role === 'admin_global'
                            ? 'Administrador Global'
                            : u.role === 'coordenador_regional'
                            ? 'Coordenador Regional'
                            : u.role === 'lider_evangelismo'
                            ? 'Líder de Evangelismo'
                            : u.role === 'equipe_consolidacao'
                            ? 'Consolidação (LGPD)'
                            : u.role === 'equipe_ensino'
                            ? 'Equipe de Ensino'
                            : 'Mídia e Comunicação'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 font-semibold">
                        {reg ? reg.name : 'Todas as Regionais (Acesso Global)'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Ativo
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-stone-900 text-base">
              Trilha de Auditoria do Sistema (Audit Logs)
            </h3>
            <p className="text-xs text-stone-500">
              Registros imutáveis de alterações administrativas, aprovações de relatórios e acessos privilegiados.
            </p>

            <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto border border-stone-200 rounded-xl">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{log.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Gestão Financeira & Logística */}
      {activeSubTab === 'financial' && (
        <div className="space-y-6 text-xs">
          {/* Important Regulatory Disclaimer */}
          <div className="p-4 rounded-xl bg-stone-900 text-stone-200 border border-stone-800 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>Diretriz Ministerial Financeira:</span>
            </div>
            <p className="text-xs leading-relaxed text-stone-300">
              Conforme definido na ata de reunião de 16 de outubro de 2026, o ministério utilizará conta própria para fins administrativos. Não há integração bancária, gestão de credenciais financeiras ou transações ativas nesta plataforma sem autorização e especificações posteriores da liderança.
            </p>
          </div>

          {/* Financial Records List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {financials.map((fin) => (
              <div
                key={fin.id}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                    {fin.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      fin.status === 'Aprovado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {fin.status}
                  </span>
                </div>

                <h4 className="font-bold text-stone-900 text-sm">{fin.title}</h4>
                <p className="text-stone-500 text-[11px] leading-relaxed">{fin.description}</p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-bold">VALOR</span>
                    <span className="text-base font-black text-stone-900">
                      R$ {fin.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block">RESPONSÁVEL</span>
                    <span className="font-bold text-stone-700">{fin.responsibleName}</span>
                  </div>
                </div>

                {fin.notes && (
                  <p className="text-[10.5px] text-stone-500 italic bg-stone-50 p-2 rounded-lg border border-stone-200">
                    {fin.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Registro de Marca & Patrimônio Digital */}
      {activeSubTab === 'legal' && (
        <div className="space-y-6 text-xs">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-red-700" />
              <h3 className="font-bold text-stone-900 text-base">
                Acompanhamento de Registro no INPI
              </h3>
            </div>
            <p className="text-stone-600 leading-relaxed max-w-3xl">
              Sob responsabilidade de <strong>Arthur</strong> e <strong>Eduardo Felyx</strong>, o ministério acompanha a proteção jurídica do nome <em>Semeadores de Fogo Global</em> e do logotipo oficial contendo a pomba e as chamas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">
                  Status INPI
                </span>
                <span className="text-base font-bold text-amber-700">
                  Pesquisa de Anterioridade Concluída
                </span>
                <p className="text-[11px] text-stone-500 mt-1">
                  Sem marcas conflitantes no segmento religioso/educacional.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">
                  Classe Solicitada
                </span>
                <span className="text-base font-bold text-stone-900">
                  Classe 45 (Serviços Ministeriais)
                </span>
                <p className="text-[11px] text-stone-500 mt-1">
                  E Classe 41 para Cursos e Livros de Formação.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">
                  Patrimônio de Domínios
                </span>
                <span className="text-base font-bold text-stone-900">
                  semeadoresdefogo.org
                </span>
                <p className="text-[11px] text-stone-500 mt-1">
                  Registrado e sob custódia técnica da Direção Global.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Orçamento */}
      {isAddBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Novo Registro Orçamentário / Viagem
            </h3>
            <form onSubmit={handleCreateFinancial} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Categoria *
                </label>
                <select
                  aria-label="Categoria do Registro Orçamentário"
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value as any })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                >
                  <option value="Orçamento de Evento">Orçamento de Evento / Cruzada</option>
                  <option value="Custeio de Implantação">Custeio de Implantação de Regional</option>
                  <option value="Logística e Viagem">Logística e Transporte de Semeadores</option>
                  <option value="Patrimônio Digital / Marca">Patrimônio Digital / INPI</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Título da Despesa / Previsão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Custeio de Combustível Caravana Regional"
                  value={budgetForm.title}
                  onChange={(e) => setBudgetForm({ ...budgetForm, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Valor Estimado (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, amount: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Situação
                  </label>
                  <select
                    aria-label="Situação do Registro Orçamentário"
                    value={budgetForm.status}
                    onChange={(e) => setBudgetForm({ ...budgetForm, status: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                  >
                    <option value="Estimado">Estimado</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Em Análise">Em Análise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Observações e Justificativa
                </label>
                <textarea
                  rows={2}
                  value={budgetForm.notes}
                  onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Salvar Previsão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
