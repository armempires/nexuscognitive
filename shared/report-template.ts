export type CognitiveReportData = {
  name: string;
  score: number;
  classification: string;
  profileTitle: string;
  profileDescription: string;
  categories: Array<{ name: string; value: number }>;
  recommendations: string[];
};

export function buildCognitiveReportEmail(data: CognitiveReportData) {
  const categoryLines = data.categories.map(category => `${category.name}: ${category.value}%`).join("\n");
  const recommendationLines = data.recommendations.map(item => `• ${item}`).join("\n");
  return `Olá, ${data.name}.\n\nSeu relatório Nexus está disponível.\n\nScore: ${data.score}/145\nClassificação: ${data.classification}\n\nPerfil cognitivo: ${data.profileTitle}\n${data.profileDescription}\n\nDesempenho por dimensão:\n${categoryLines}\n\nPossíveis caminhos para explorar:\n${recommendationLines}\n\nEste resultado é indicativo e não substitui uma avaliação psicológica profissional.`;
}
