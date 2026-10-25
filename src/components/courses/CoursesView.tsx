import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Video,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Plus,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { CourseModule, CourseClass, Enrollment, Certificate } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const CoursesView: React.FC = () => {
  const { currentUser, regions, activeRegionFilter } = useAuth();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeTab, setActiveTab] = useState<'modules' | 'classes' | 'students' | 'certificates'>('modules');

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCertToView, setSelectedCertToView] = useState<Certificate | null>(null);

  // Enroll Form
  const [enrollForm, setEnrollForm] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    regionId: '',
    classId: '',
    hasPhysicalBook: true,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, []);

  const loadCourseData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
        setClasses(data.classes || []);
        setEnrollments(data.enrollments || []);
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classes.find((c) => c.id === enrollForm.classId) || classes[0];
    const targetRegionId =
      enrollForm.regionId ||
      (activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || 'reg-sp-01');

    try {
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...enrollForm,
          regionId: targetRegionId,
          classId: targetClass?.id,
          moduleTitle: targetClass?.moduleTitle,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        setIsEnrollModalOpen(false);
        setEnrollForm({
          studentName: '',
          studentEmail: '',
          studentPhone: '',
          regionId: '',
          classId: '',
          hasPhysicalBook: true,
        });
        loadCourseData();
        setActiveTab('students');
      }
    } catch (err) {
      console.error('Error enrolling student:', err);
    }
  };

  const handleIssueCertificate = async (enr: Enrollment) => {
    const reg = regions.find((r) => r.id === enr.regionId);
    try {
      const res = await fetch('/api/courses/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: enr.studentName,
          courseTitle: `Formação Ministerial em ${enr.moduleTitle}`,
          workloadHours: 16,
          signedBy: 'Lucas Moreira & Arthur',
          regionName: reg?.name || 'Direção Global',
          enrollmentId: enr.id,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });

      if (res.ok) {
        const cert = await res.json();
        setSelectedCertToView(cert);
        loadCourseData();
      }
    } catch (err) {
      console.error('Error issuing certificate:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Escola Bíblica de Capacitação
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Aulas via Zoom & Livros Físicos Obrigatórios
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Ensino e Formação de Semeadores
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Curso trimestral com aulas mensais gratuitas aos jovens, estudo dos 4 módulos físicos e emissão de certificados digitais oficiais.
          </p>
        </div>

        <button
          onClick={() => {
            setEnrollForm((prev) => ({
              ...prev,
              regionId: activeRegionFilter !== 'ALL' ? activeRegionFilter : regions[0]?.id || '',
              classId: classes[0]?.id || '',
            }));
            setIsEnrollModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Matricular Semeador</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-stone-200 text-xs font-semibold text-stone-500">
        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'modules'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Os 4 Módulos de Estudo
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'classes'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Turmas e Links Zoom ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Alunos Matriculados ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'certificates'
              ? 'border-red-700 text-stone-900 font-bold'
              : 'border-transparent hover:text-stone-700'
          }`}
        >
          Certificados Emitidos ({certificates.length})
        </button>
      </div>

      {/* Tab: Os 4 Módulos de Estudo */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4 hover:border-red-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Módulo Oficial {mod.moduleNumber}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-1">
                    {mod.title}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                  {mod.moduleNumber}
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {mod.description}
              </p>

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1.5">
                  Tópicos Ministrados nas Aulas:
                </span>
                <ul className="text-xs text-stone-700 space-y-1">
                  {mod.topics.map((t, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-700 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Carga Horária: {mod.totalHours} horas</span>
                <span className="text-amber-700 font-bold">Livro Físico Obrigatório</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Turmas e Zoom */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {cls.status}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {cls.quarter}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mt-1">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Docentes: <strong>{cls.instructorName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={cls.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Acessar Sala Zoom</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">
                    Cronograma das Aulas
                  </span>
                  <span className="font-semibold text-stone-800">
                    {cls.scheduleDescription}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">
                    Período da Turma
                  </span>
                  <span className="font-semibold text-stone-800">
                    {new Date(cls.startDate).toLocaleDateString('pt-BR')} a {new Date(cls.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Alunos Matriculados */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Aluno</th>
                <th className="py-3 px-4">Regional</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4 text-center">Frequência</th>
                <th className="py-3 px-4">Livro Físico</th>
                <th className="py-3 px-4 text-right">Ação / Certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {enrollments.map((enr) => {
                const reg = regions.find((r) => r.id === enr.regionId);
                return (
                  <tr key={enr.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{enr.studentName}</div>
                      <div className="text-[10px] text-stone-400">{enr.studentPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-medium">
                      {reg?.name || 'Regional'}
                    </td>
                    <td className="py-3 px-4 text-stone-800 font-semibold">
                      {enr.moduleTitle}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-stone-900">{enr.attendanceCount}</span>
                      <span className="text-stone-400"> / {enr.totalClasses} aulas</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {enr.hasPhysicalBook ? 'Adquirido' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {enr.status === 'Concluído' ? (
                        <button
                          onClick={() => {
                            const cert = certificates.find((c) => c.id === enr.certificateId) || {
                              id: 'cert-temp',
                              certificateCode: 'SF-CERT-2026-0089',
                              studentName: enr.studentName,
                              courseTitle: enr.moduleTitle,
                              completionDate: '2026-10-01',
                              workloadHours: 16,
                              issuer: 'Semeadores de Fogo Global',
                              signedBy: 'Lucas Moreira & Arthur',
                              regionName: reg?.name || 'Regional',
                            };
                            setSelectedCertToView(cert);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] hover:bg-emerald-200 transition-colors"
                        >
                          Ver Certificado
                        </button>
                      ) : (
                        <button
                          onClick={() => handleIssueCertificate(enr)}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-[11px] transition-colors"
                        >
                          Concluir e Emitir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Certificados Emitidos */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCertToView(cert)}
              className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-red-300 shadow-2xs transition-all cursor-pointer space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 font-bold text-[10px] border border-red-200">
                  {cert.certificateCode}
                </span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">{cert.studentName}</h4>
              <p className="text-stone-500">{cert.courseTitle}</p>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>Conclusão: {new Date(cert.completionDate).toLocaleDateString('pt-BR')}</span>
                <span className="font-bold text-red-700">Visualizar</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Matrícula de Semeador */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Matricular Semeador na Escola de Formação
            </h3>
            <form onSubmit={handleEnrollStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Nome do Aluno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do semeador"
                  value={enrollForm.studentName}
                  onChange={(e) => setEnrollForm({ ...enrollForm, studentName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Turma *
                </label>
                <select
                  aria-label="Turma da Escola de Formação"
                  value={enrollForm.classId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, classId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(XX) 99999-9999"
                    value={enrollForm.studentPhone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentPhone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Regional
                  </label>
                  <select
                    aria-label="Regional do Aluno"
                    value={enrollForm.regionId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, regionId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrollForm.hasPhysicalBook}
                    onChange={(e) => setEnrollForm({ ...enrollForm, hasPhysicalBook: e.target.checked })}
                    className="rounded text-amber-700"
                  />
                  <span className="text-[11px] text-amber-900 font-semibold">
                    Possui ou encomendou o livro físico oficial do módulo
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizador de Certificado Digital Oficial */}
      {selectedCertToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-amber-600/40 w-full max-w-2xl p-8 space-y-6 relative text-center">
            <button
              onClick={() => setSelectedCertToView(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-900"
            >
              ✕
            </button>

            {/* Certificate Header */}
            <div className="space-y-1">
              <span className="text-[11px] tracking-widest font-black text-amber-700 uppercase">
                Certificado Digital de Conclusão Ministerial
              </span>
              <h1 className="text-2xl font-black text-stone-950">
                SEMEADORES DE FOGO GLOBAL
              </h1>
              <p className="text-xs text-stone-500 italic">
                Ministério Evangelístico Internacional
              </p>
            </div>

            {/* Certificate Body */}
            <div className="py-4 border-y-2 border-stone-200/80 space-y-3">
              <p className="text-xs text-stone-600">
                Certificamos para os devidos fins ministeriais e eclesiásticos que
              </p>
              <h2 className="text-2xl font-black text-stone-900 tracking-wide font-serif">
                {selectedCertToView.studentName}
              </h2>
              <p className="text-xs text-stone-700 max-w-lg mx-auto leading-relaxed">
                concluiu com êxito a formação teológico-prática de capacitação apostólica no curso:
              </p>
              <p className="text-base font-extrabold text-red-900">
                {selectedCertToView.courseTitle}
              </p>
              <p className="text-xs text-stone-500">
                Carga horária de {selectedCertToView.workloadHours} horas-aula • Regional: {selectedCertToView.regionName}
              </p>
            </div>

            {/* Signatures & Code */}
            <div className="grid grid-cols-2 gap-8 text-xs text-stone-700 pt-2">
              <div className="border-t border-stone-300 pt-2">
                <p className="font-bold text-stone-900">Lucas Moreira</p>
                <p className="text-[10px] text-stone-500">Direção Ministerial Global</p>
              </div>
              <div className="border-t border-stone-300 pt-2">
                <p className="font-bold text-stone-900">Arthur</p>
                <p className="text-[10px] text-stone-500">Estruturação e Governança</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-stone-400">
              <span className="font-mono">Código de Autenticidade: {selectedCertToView.certificateCode}</span>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-stone-700 hover:text-stone-900 font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Certificado</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
