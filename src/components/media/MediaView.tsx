import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Download,
  Upload,
  CheckCircle2,
  FileText,
  Image,
  Shirt,
  Sparkles,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { MediaAsset } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const MediaView: React.FC = () => {
  const { currentUser, isGlobalAdmin } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Submissions State
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error('Error fetching media assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFakeDownload = (asset: MediaAsset) => {
    // Generate simulated SVG or text file download for user
    const element = document.createElement('a');
    const file = new Blob(
      [
        `SEMEADORES DE FOGO GLOBAL\nMaterial Oficial Homologado: ${asset.title}\nCategoria: ${asset.category}\nAutorizado por: Eduardo Felyx (Mídia & Comunicação)\nData: 2026-10-16`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${asset.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionSuccess(true);
    setTimeout(() => {
      setSubmissionSuccess(false);
      setIsSubmitModalOpen(false);
      setSubmissionTitle('');
      setSubmissionDescription('');
    }, 2000);
  };

  const categories = [
    'ALL',
    'Logotipos e Identidade',
    'Camisetas e Bonés',
    'Folhetos e Panfletos',
    'Redes Sociais',
    'Documentos Oficiais',
  ];

  const filteredAssets = assets.filter((a) => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Departamento de Mídia & Identidade Visual
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Curadoria: Eduardo Felyx
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1">
            Biblioteca de Mídia & Materiais Oficiais
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            Arquivos vetorizados do logotipo, manual de identidade, modelos de camisetas, bonés e panfletos padronizados para todas as regionais.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Enviar Registros de Ações (Fotos/Vídeos)</span>
        </button>
      </div>

      {/* Categories Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-red-800 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {cat === 'ALL' ? 'Todos os Materiais' : cat}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-red-300 shadow-2xs transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                  {asset.category}
                </span>
                <h3 className="font-bold text-stone-900 text-base mt-1.5">
                  {asset.title}
                </h3>
              </div>

              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-800 flex items-center justify-center font-black text-xs shrink-0">
                {asset.fileFormat.split(' ')[0]}
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {asset.description}
            </p>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-stone-500">
              <span>
                Formato: <strong>{asset.fileFormat}</strong> • Tamanho: {asset.fileSize}
              </span>

              <button
                onClick={() => handleFakeDownload(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Pacote</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notice on Brand Protection & Social Media */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-900 block font-bold">
            Diretrizes de Mídia e Redes Sociais:
          </strong>
          <p className="leading-relaxed">
            As regionais devem utilizar exclusivamente as artes vetorizadas e modelos homologados. Não é permitida a criação de versões paralelas do símbolo ministerial da pomba e chamas. Publicações nas redes sociais devem seguir o tom de reverência, sem postagens diretas não autorizadas.
          </p>
        </div>
      </div>

      {/* Modal: Enviar Fotos de Evangelismo para Avaliação */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Enviar Registros de Ações Evangelísticas
            </h3>
            <p className="text-xs text-stone-500">
              Os registros serão avaliados pela equipe global de mídia (Eduardo Felyx) antes de uso institucional.
            </p>

            {submissionSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-center font-bold">
                ✓ Registro enviado com sucesso para a curadoria de mídia!
              </div>
            ) : (
              <form onSubmit={handleSendSubmission} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Título / Identificação da Ação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fotos do Evangelismo na Praça da Sé"
                    value={submissionTitle}
                    onChange={(e) => setSubmissionTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Link do Drive ou Descrição dos Registros *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Insira o link da pasta do Google Drive com as fotos em alta resolução e autorizações de uso de imagem..."
                    value={submissionDescription}
                    onChange={(e) => setSubmissionDescription(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold"
                  >
                    Enviar para Avaliação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
