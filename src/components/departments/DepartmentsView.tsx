import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckSquare,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
} from 'lucide-react';
import { Department, Task } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const DepartmentsView: React.FC = () => {
  const { currentUser, isGlobalAdmin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState<'departments' | 'tasks'>('departments');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // New Task Form
  const [newTaskForm, setNewTaskForm] = useState({
    departmentId: '',
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Média' as 'Alta' | 'Média' | 'Baixa',
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
        setTasks(data.tasks || []);
        if (!selectedDept && data.departments?.length > 0) {
          setSelectedDept(data.departments[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });
      if (res.ok) {
        loadDepartments();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const deptId = newTaskForm.departmentId || (selectedDept ? selectedDept.id : departments[0]?.id);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTaskForm,
          departmentId: deptId,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        setIsAddTaskOpen(false);
        setNewTaskForm({
          departmentId: '',
          title: '',
          description: '',
          assignedTo: '',
          dueDate: '',
          priority: 'Média',
        });
        loadDepartments();
        setActiveTab('tasks');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskStatusFilter !== 'ALL' && t.status !== taskStatusFilter) return false;
    if (selectedDept && activeTab === 'departments' && t.departmentId !== selectedDept.id) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Estrutura Funcional • Reunião 16/10/2026
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Departamentos Ministeriais
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Os 10 departamentos estratégicos dos Semeadores de Fogo Global, com lideranças, atribuições e objetivos ministeriais definidos.
          </p>
        </div>
      </div>

      {/* Departments List and Focus View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 10 Departments (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            {departments.map((dept) => {
              const isSelected = selectedDept?.id === dept.id;
              const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
              const pendingCount = deptTasks.filter((t) => t.status !== 'Concluído').length;

              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-red-50/70 border-red-300 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      {dept.number}. {dept.name}
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {pendingCount} pendente(s)
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 text-[11px] truncate">
                    Coord: {dept.coordinatorName}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Department Profile & Tasks (7 cols) */}
          <div className="lg:col-span-7">
            {selectedDept ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                      Departamento #{selectedDept.number}
                    </span>
                    <span className="text-xs text-stone-500">
                      Coordenador: <strong>{selectedDept.coordinatorName}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mt-1">
                    {selectedDept.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {selectedDept.description}
                  </p>
                </div>

                {/* Objectives */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-stone-800 text-[11px]">
                    Objetivos Estratégicos Homologados:
                  </h4>
                  <ul className="space-y-1.5 text-stone-700">
                    {selectedDept.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Department Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold uppercase tracking-wider text-stone-800 text-xs">
                      Tarefas do Departamento ({filteredTasks.length})
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {filteredTasks.length === 0 ? (
                      <p className="p-6 text-center text-stone-400 italic bg-stone-50 rounded-xl">
                        Nenhuma tarefa pendente para este departamento.
                      </p>
                    ) : (
                      filteredTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-stone-900">{t.title}</h5>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'Concluído'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.status === 'Em andamento'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <p className="text-stone-600 text-[11px]">{t.description}</p>
                          <div className="flex items-center justify-between text-[10.5px] text-stone-400 pt-1 border-t border-stone-100">
                            <span>
                              Responsável: <strong>{t.assignedTo}</strong> • Prazo: {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                            <div className="flex items-center gap-1">
                              {t.status !== 'Concluído' && (
                                <button
                                  onClick={() => handleUpdateTaskStatus(t.id, 'Concluído')}
                                  className="text-emerald-700 hover:text-emerald-900 font-bold"
                                >
                                  Concluir ✓
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
                Selecione um departamento para ver detalhes e tarefas.
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
