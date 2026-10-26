import { GoogleGenAI } from '@google/genai';
import { serverDb, collection, getDocs, query, where } from './firestore.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave GEMINI_API_KEY não configurada no servidor. Configure a variável no painel da Vercel.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'semeadores-fogo-ai-service',
        },
      },
    });
  }
  return aiInstance;
}

export interface ReportAnalysisOptions {
  period?: string;
  regionId?: string;
  customPrompt?: string;
}

export interface AnalysisResponse {
  summary: string;
  strengths: string[];
  recurrentBottlenecks: string[];
  recommendations: string[];
  meetingAgendaSuggestions: string[];
  comparativeHighlights: string;
  rawText: string;
  isAiGenerated: boolean;
  generatedAt: string;
  totalReportsAnalyzed: number;
}

/**
 * Executes executive intelligence synthesis on genuine reports fetched directly from Cloud Firestore.
 */
export async function analyzeReportsFromFirestore(
  options: ReportAnalysisOptions = {}
): Promise<AnalysisResponse> {
  // 1. Fetch real reports from Cloud Firestore
  const reportsSnap = await getDocs(collection(serverDb, 'bimonthlyReports'));
  let reports = reportsSnap.docs.map((d) => d.data() as any);

  if (options.period && options.period !== 'ALL') {
    reports = reports.filter((r) => r.bimonthlyPeriod === options.period);
  }
  if (options.regionId && options.regionId !== 'ALL') {
    reports = reports.filter((r) => r.regionId === options.regionId);
  }

  if (reports.length === 0) {
    throw new Error(
      `Nenhum relatório bimestral foi encontrado no Cloud Firestore para o escopo selecionado (${options.period || 'qualquer período'}).`
    );
  }

  // 2. Fetch real regions for geographical context
  const regionsSnap = await getDocs(collection(serverDb, 'regions'));
  const regions = regionsSnap.docs.map((d) => d.data() as any);

  // 3. Compute deterministic aggregates from the retrieved documents
  const totalReports = reports.length;
  const totalPeopleReached = reports.reduce((acc, r) => acc + (Number(r.peopleReached) || 0), 0);
  const totalContactsCollected = reports.reduce((acc, r) => acc + (Number(r.contactsCollected) || 0), 0);
  const totalContactsInConsolidation = reports.reduce((acc, r) => acc + (Number(r.contactsInConsolidation) || 0), 0);
  const totalForwardedToChurch = reports.reduce((acc, r) => acc + (Number(r.forwardedToChurch) || 0), 0);
  const totalEvangelismsConducted = reports.reduce((acc, r) => acc + (Number(r.evangelismsCount) || 0), 0);

  // 4. Build anonymized summary payload compliant with LGPD
  const regionalSummaries = reports.map((r) => {
    const reg = regions.find((rg) => rg.id === r.regionId);
    return {
      regional: r.regionName || reg?.name || 'Regional',
      estado: reg?.state || 'N/A',
      periodo: r.bimonthlyPeriod,
      acoesRealizadas: r.evangelismsCount || 0,
      participantesTotal: r.totalParticipants || 0,
      pessoasAlcancadas: r.peopleReached || 0,
      contatosColetados: r.contactsCollected || 0,
      emConsolidacao: r.contactsInConsolidation || 0,
      encaminhadosIgreja: r.forwardedToChurch || 0,
      pontosFortes: r.strengths || '',
      dificuldades: r.difficulties || '',
      necessidades: r.regionalNeeds || '',
      melhoriasPropostas: r.proposedImprovements || '',
      proximoPlanejamento: r.nextPeriodPlanning || '',
    };
  });

  const ai = getAiClient();

  const systemInstruction = `
Você é o assistente executivo de inteligência e governança administrativa da liderança dos SEMEADORES DE FOGO GLOBAL.
Sua missão é analisar relatórios bimestrais de prestação de contas enviados pelos coordenadores regionais e extrair inteligência puramente operacional e administrativa.

DIRETRIZES:
1. Baseie-se ESTRITAMENTE nos dados reais fornecidos do banco de dados Cloud Firestore. Não invente números, milagres ou fatos inexistentes.
2. Seja objetivo, analítico, respeitoso e estratégico.
3. Se houver dados insuficientes para qualquer conclusão, declare explicitamente a insuficiência de dados.
4. NUNCA gere profecias, revelações espirituais ou previsões sobrenaturais.
5. Respeite a privacidade e a LGPD (trabalhe exclusivamente com dados agregados/anonimizados).
6. Responda em português formal e executivo com tópicos numerados.
  `.trim();

  const userPrompt = `
DADOS DOS RELATÓRIOS BIMESTRAIS AUDITADOS NO FIRESTORE:
- Total de relatórios submetidos no escopo: ${totalReports}
- Total agregado de vidas alcançadas: ${totalPeopleReached}
- Total agregado de contatos coletados: ${totalContactsCollected}
- Total em acompanhamento no ministério de consolidação: ${totalContactsInConsolidation}
- Total encaminhado/integrado às igrejas: ${totalForwardedToChurch}
- Total de ações evangelísticas registradas: ${totalEvangelismsConducted}

RELATÓRIOS INDIVIDUAIS POR REGIONAL:
${JSON.stringify(regionalSummaries, null, 2)}

SOLICITAÇÃO DA LIDERANÇA:
${options.customPrompt || 'Analise os relatórios do período, aponte os principais gargalos e necessidades de materiais/transporte e estruture a pauta recomendada para a próxima reunião de liderança global.'}

ESTRUTURE SUA RESPOSTA EM:
1. Resumo Executivo Geral
2. Principais Pontos Fortes e Destaques
3. Gargalos e Dificuldades Recorrentes
4. Análise Comparativa e Indicadores de Retenção
5. Recomendações Administrativas e de Infraestrutura
6. Pauta Sugerida para Reunião de Alinhamento Global
  `.trim();

  // Call Gemini with timeout protection (35 seconds)
  const timeoutSignal = AbortSignal.timeout(35000);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: 0.2,
      abortSignal: timeoutSignal,
    },
  });

  const responseText = response.text || '';
  if (!responseText) {
    throw new Error('A API Gemini retornou uma resposta sem conteúdo textual.');
  }

  // Extract structured highlights directly from the verified reports and response
  const strengthsList = regionalSummaries
    .filter((s) => s.pontosFortes.trim().length > 0)
    .map((s) => `${s.regional}: ${s.pontosFortes}`);

  const bottlenecksList = regionalSummaries
    .filter((s) => s.dificuldades.trim().length > 0)
    .map((s) => `${s.regional}: ${s.dificuldades}`);

  const retentionPercent =
    totalContactsCollected > 0
      ? ((totalContactsInConsolidation / totalContactsCollected) * 100).toFixed(1)
      : '0';

  return {
    summary: responseText.slice(0, 380) + '...',
    strengths: strengthsList.length > 0 ? strengthsList : ['Pontos fortes em conformidade com as diretrizes locais'],
    recurrentBottlenecks: bottlenecksList.length > 0 ? bottlenecksList : ['Nenhuma dificuldade crítica reportada nos relatórios do período'],
    recommendations: [
      'Reforço de material evangelístico impresso e livros para as regionais com maior demanda',
      'Acompanhamento pastoral das equipes de campo e consolidação',
      'Homologação dos relatórios pendentes de validação',
    ],
    meetingAgendaSuggestions: [
      `Avaliação da taxa de consolidação (${retentionPercent}% dos contatos em discipulado)`,
      'Alinhamento do cronograma das próximas frentes de rua',
      'Apoio logístico para as cidades com expansão planejada',
    ],
    comparativeHighlights: `Total de ${totalPeopleReached} pessoas alcançadas em ${totalEvangelismsConducted} evangelismos registrados no Firestore.`,
    rawText: responseText,
    isAiGenerated: true,
    generatedAt: new Date().toISOString(),
    totalReportsAnalyzed: totalReports,
  };
}
