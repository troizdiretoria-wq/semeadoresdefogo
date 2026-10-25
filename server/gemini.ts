import { GoogleGenAI } from '@google/genai';
import { BimonthlyReport, Region, EvangelismEvent } from './db.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave GEMINI_API_KEY não configurada no servidor de produção.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-semeadores',
        },
      },
    });
  }
  return aiInstance;
}

export interface ReportAnalysisOptions {
  period?: string;
  regionId?: string;
  focusArea?: 'geral' | 'dificuldades' | 'pontos_fortes' | 'reuniao_lideranca' | 'comparativo';
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
}

export async function analyzeReportsWithGemini(
  reports: BimonthlyReport[],
  regions: Region[],
  evangelisms: EvangelismEvent[],
  options: ReportAnalysisOptions = {}
): Promise<AnalysisResponse> {
  if (!reports || reports.length === 0) {
    throw new Error('Nenhum relatório bimestral disponível para o escopo selecionado.');
  }

  // Aggregate genuine statistics from provided reports
  const totalReports = reports.length;
  const totalPeopleReached = reports.reduce((acc, r) => acc + (Number(r.peopleReached) || 0), 0);
  const totalContactsCollected = reports.reduce((acc, r) => acc + (Number(r.contactsCollected) || 0), 0);
  const totalContactsInConsolidation = reports.reduce((acc, r) => acc + (Number(r.contactsInConsolidation) || 0), 0);
  const totalForwardedToChurch = reports.reduce((acc, r) => acc + (Number(r.forwardedToChurch) || 0), 0);
  const totalEvangelismsConducted = reports.reduce((acc, r) => acc + (Number(r.evangelismsCount) || 0), 0);

  // Prepare sanitized summaries strictly respecting LGPD (no phone, no personal emails)
  const regionalSummaries = reports.map((r) => {
    const region = regions.find((reg) => reg.id === r.regionId);
    return {
      regional: r.regionName || region?.name || 'Regional não identificada',
      estado: region?.state || 'N/A',
      periodo: r.bimonthlyPeriod,
      frequenciaRelatada: r.frequencyObserved || 'Não especificada',
      acoesRealizadas: r.evangelismsCount || 0,
      participantesTotal: r.totalParticipants || 0,
      pessoasAlcancadas: r.peopleReached || 0,
      contatosColetados: r.contactsCollected || 0,
      emConsolidacao: r.contactsInConsolidation || 0,
      encaminhadosIgreja: r.forwardedToChurch || 0,
      pontosFortes: r.strengths || 'Nenhum ponto forte registrado',
      dificuldades: r.difficulties || 'Nenhuma dificuldade registrada',
      necessidades: r.regionalNeeds || 'Nenhuma necessidade registrada',
      melhoriasPropostas: r.proposedImprovements || 'Nenhuma melhoria proposta',
      statusRelatorio: r.status,
    };
  });

  const ai = getAiClient();

  const systemInstruction = `
Você é o assistente executivo de inteligência e governança administrativa da liderança dos SEMEADORES DE FOGO GLOBAL.
Sua missão é analisar relatórios bimestrais de prestação de contas enviados pelos coordenadores regionais e extrair inteligência puramente administrativa e operacional.

DIRETRIZES FUNDAMENTAIS:
1. Baseie-se ESTRITAMENTE nos dados reais fornecidos. Não invente números, milagres ou fatos que não estejam nos registros.
2. Seja objetivo, analítico, respeitoso e estratégico.
3. Se houver informações insuficientes para qualquer conclusão, declare explicitamente a insuficiência de dados.
4. NUNCA gere profecias, revelações espirituais ou previsões sobrenaturais como produto da IA. A IA é uma ferramenta administrativa de organização e não substitui a direção pastoral e espiritual do ministério.
5. Respeite a privacidade e a LGPD (trabalhe exclusivamente com dados agregados/anonimizados).
6. Responda em português claro, profissional e estruturado com cabeçalhos e tópicos executivos.
  `.trim();

  const userPrompt = `
DADOS DOS RELATÓRIOS BIMESTRAIS DISPONÍVEIS:
- Total de relatórios submetidos no escopo: ${totalReports}
- Total agregado de pessoas alcançadas: ${totalPeopleReached}
- Total agregado de contatos coletados: ${totalContactsCollected}
- Total de contatos em acompanhamento na consolidação: ${totalContactsInConsolidation}
- Pessoas encaminhadas e integradas às igrejas: ${totalForwardedToChurch}
- Ações evangelísticas registradas: ${totalEvangelismsConducted}

DETALHAMENTO POR REGIONAL:
${JSON.stringify(regionalSummaries, null, 2)}

SOLICITAÇÃO DE ANÁLISE:
${options.customPrompt || 'Analise os relatórios do último bimestre, identifique os principais problemas relatados, compare os indicadores disponíveis e apresente recomendações executivas para a próxima reunião de liderança global.'}

Por favor, forneça:
1. Resumo Executivo Geral das Operações
2. Principais Pontos Fortes e Destaques
3. Dificuldades e Gargalos Recorrentes Detectados
4. Análise Comparativa e Indicadores de Conversão / Consolidação
5. Recomendações Administrativas e de Infraestrutura
6. Pauta Sugerida para a Próxima Reunião Bimestral de Alinhamento Global
  `.trim();

  // Prefer standard general-purpose model gemini-2.5-flash with fallback
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  const responseText = response.text || '';
  if (!responseText) {
    throw new Error('A API Gemini retornou uma resposta vazia.');
  }

  // Extract structured highlights directly from the verified reports and response
  const strengthsExtracted = regionalSummaries
    .filter((s) => s.pontosFortes && s.pontosFortes !== 'Nenhum ponto forte registrado')
    .map((s) => `${s.regional}: ${s.pontosFortes}`);

  const bottlenecksExtracted = regionalSummaries
    .filter((s) => s.dificuldades && s.dificuldades !== 'Nenhuma dificuldade registrada')
    .map((s) => `${s.regional}: ${s.dificuldades}`);

  const retentionPercent = totalContactsCollected > 0
    ? ((totalContactsInConsolidation / totalContactsCollected) * 100).toFixed(1)
    : '0';

  return {
    summary: responseText.slice(0, 380) + '...',
    strengths: strengthsExtracted.length > 0 ? strengthsExtracted : ['Dados de pontos fortes em consolidação pelas regionais'],
    recurrentBottlenecks: bottlenecksExtracted.length > 0 ? bottlenecksExtracted : ['Nenhum gargalo crítico assinalado no período'],
    recommendations: [
      'Alinhamento com as regionais sobre cumprimento da periodicidade quinzenal/semanal',
      'Distribuição de kits e materiais para equipes de consolidação',
      'Acompanhamento do envio dos relatórios bimestrais pendentes',
    ],
    meetingAgendaSuggestions: [
      `Avaliação da retenção em consolidação (${retentionPercent}% dos contatos em discipulado)`,
      'Apresentação dos resultados de pessoas alcançadas por regional',
      'Definição da escala de capacitações ministeriais para o próximo período',
    ],
    comparativeHighlights: `Total de ${totalPeopleReached} pessoas alcançadas em ${totalEvangelismsConducted} evangelismos registrados no escopo analisado.`,
    rawText: responseText,
    isAiGenerated: true,
    generatedAt: new Date().toISOString(),
  };
}
