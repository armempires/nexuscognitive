export type Category = "Lógico" | "Visual" | "Verbal" | "Padrões";
export type Question = { category: Category; prompt: string; options: string[]; answer: number };

export type ScoreBand = {
  label: string;
  tone: string;
  description: string;
};

export type CategoryStat = {
  category: Category;
  value: number;
};

export type Profile = {
  title: string;
  description: string;
  primaryCategory?: Category;
  secondaryCategory?: Category;
  careers?: string[];
  courses?: string[];
  processingStyle?: string;
};

export function calculateScore(correct: number, fastAnswers: number, mediumAnswers: number) {
  return Math.min(145, Math.max(70, Math.round(82 + correct * 1.55 + fastAnswers * 0.7 + mediumAnswers * 0.35)));
}

export function classify(score: number): ScoreBand {
  if (score < 85) {
    return {
      label: "A desenvolver",
      tone: "Abaixo da média",
      description: "Seu resultado sugere espaço para fortalecer estratégias de raciocínio e atenção.",
    };
  }
  if (score <= 115) {
    return {
      label: "Faixa média",
      tone: "Médio",
      description: "Você apresentou desempenho equilibrado em relação ao conjunto de referência.",
    };
  }
  if (score <= 130) {
    return {
      label: "Acima da média",
      tone: "Acima da média",
      description: "Seu desempenho indicou facilidade consistente para identificar relações e padrões.",
    };
  }
  return {
    label: "Muito acima da média",
    tone: "Superior",
    description: "Você demonstrou alta consistência na resolução de desafios variados.",
  };
}

export function getCategoryStats(questions: Question[], answers: number[]): CategoryStat[] {
  const categories: Category[] = ["Lógico", "Visual", "Verbal", "Padrões"];
  return categories.map(category => {
    const indexes = questions
      .map((question, index) => (question.category === category ? index : -1))
      .filter(index => index >= 0);
    const hits = indexes.filter(index => answers[index] === questions[index]?.answer).length;
    return { category, value: Math.round((hits / indexes.length) * 100) || 0 };
  });
}

export function getDominantCategory(stats: CategoryStat[]): Category {
  return [...stats].sort((a, b) => b.value - a.value)[0]?.category || "Lógico";
}

export function getProfile(category: Category): Profile {
  const profiles: Record<Category, Profile> = {
    Lógico: {
      title: "O estrategista analítico",
      description: "Seu resultado aponta para facilidade em decompor problemas, reconhecer relações e construir decisões com método.",
      primaryCategory: "Lógico",
      careers: ["Engenharia de Software", "Ciência de Dados", "Economia", "Consultoria Estratégica"],
      courses: ["Arquitetura de Sistemas", "Estatística Aplicada", "Inteligência Artificial"],
    },
    Visual: {
      title: "O navegador visual",
      description: "Seu resultado aponta para facilidade em perceber formas, orientação espacial e relações que se revelam no conjunto.",
      primaryCategory: "Visual",
      careers: ["Arquitetura & Urbanismo", "UI/UX Design", "Design Industrial", "Animação 3D"],
      courses: ["Design Gráfico & Gestalt", "Modelagem Tridimensional", "Computação Gráfica"],
    },
    Verbal: {
      title: "O intérprete de ideias",
      description: "Seu resultado aponta para facilidade em compreender conceitos, nuances de linguagem e relações entre significados.",
      primaryCategory: "Verbal",
      careers: ["Direito & Advocacia", "Jornalismo de Dados", "Psicologia", "Comunicação Corporativa"],
      courses: ["Lógica & Argumentação", "Comunicação Estratégica", "Psicologia Cognitiva"],
    },
    Padrões: {
      title: "O detector de padrões",
      description: "Seu resultado aponta para facilidade em reconhecer regularidades, antecipar sequências e conectar sinais.",
      primaryCategory: "Padrões",
      careers: ["Cyber Security", "Criptografia", "UX Research", "Pesquisa Operacional"],
      courses: ["Segurança da Informação", "Estatística Avançada", "Análise de Tendências"],
    },
  };
  return profiles[category];
}

export function calculateDetailedProfile(stats: CategoryStat[], seconds: number[] = []): Profile {
  if (!stats || stats.length === 0) return getProfile("Lógico");

  const sorted = [...stats].sort((a, b) => b.value - a.value);
  const primary = sorted[0];
  const secondary = sorted[1] || sorted[0];
  const lowest = sorted[sorted.length - 1];

  const avgSeconds = seconds.length ? seconds.reduce((a, b) => a + b, 0) / seconds.length : 0;
  const processingStyle = avgSeconds > 0 && avgSeconds <= 15
    ? "Processamento Ágil & Intuitivo"
    : avgSeconds > 15
    ? "Processamento Analítico & Reflexivo"
    : undefined;

  const range = primary.value - lowest.value;
  const gapToSecondary = primary.value - secondary.value;

  // Polímata (equilibrado)
  if (range <= 15 && primary.value >= 40) {
    return {
      title: "O Polímata Multidomínio",
      description: "Você exibe um equilíbrio notável entre todas as dimensões cognitivas. Essa versatilidade permite alternar sem esforço entre lógica, visão espacial, expressão verbal e reconhecimento de padrões.",
      primaryCategory: primary.category,
      secondaryCategory: secondary.category,
      processingStyle,
      careers: ["Gestão Geral & Produto", "Empreendedorismo", "Consultoria Multidisciplinar", "Inovação Corporativa"],
      courses: ["Gestão Estratégica (MBA)", "Design Thinking", "Liderança de Operações", "Gestão do Conhecimento"],
    };
  }

  // Especialista Focal
  if (gapToSecondary >= 25) {
    return {
      title: `O Especialista em ${primary.category}`,
      description: `Seu resultado revela uma mente hiperfocada na dimensão ${primary.category.toLowerCase()}, com desempenho significativamente superior em relação às demais áreas.`,
      primaryCategory: primary.category,
      secondaryCategory: secondary.category,
      processingStyle,
      careers: primary.category === "Lógico"
        ? ["Ciência de Dados", "Engenharia de Software", "Matemática Aplicada"]
        : primary.category === "Visual"
        ? ["Arquitetura", "Design Tridimensional", "Direção de Arte"]
        : primary.category === "Verbal"
        ? ["Linguística", "Direito Constitucional", "Análise Editorial"]
        : ["Criptografia", "Cyber Security", "Bioinformática"],
      courses: ["Especialização Técnica Avançada", "Metodologia de Pesquisa", "Resolução de Problemas Complexos"],
    };
  }

  // Combinados Híbridos (Primary + Secondary)
  const pairKey = `${primary.category}-${secondary.category}`;

  const hybridProfiles: Record<string, { title: string; description: string; careers: string[]; courses: string[] }> = {
    "Lógico-Visual": {
      title: "O Arquiteto de Sistemas",
      description: "Sua mente combina o rigor analítico com uma visão espacial apurada, permitindo estruturar problemas abstratos em arquiteturas e modelos funcionais.",
      careers: ["Engenharia de Software", "Arquitetura & Urbanismo", "Inteligência Artificial", "Game Design", "Ciência de Dados"],
      courses: ["Arquitetura de Software", "Modelagem 3D & CAD", "Algoritmos e Estruturas de Dados", "UX Architecture"],
    },
    "Lógico-Verbal": {
      title: "O Estrategista Argumentativo",
      description: "Excelente facilidade para encadear raciocínios analíticos de forma clara, persuasiva e embasada em forte rigor conceitual.",
      careers: ["Direito & Advocacia", "Economia & Finanças", "Consultoria Estratégica", "Jornalismo de Dados", "Filosofia Analítica"],
      courses: ["Lógica & Argumentação", "Economia Aplicada", "Negociação Estratégica", "Análise de Políticas Públicas"],
    },
    "Lógico-Padrões": {
      title: "O Criptoanalista",
      description: "Sensibilidade elevada para reconhecer regras ocultas em dados e otimizar sequências numéricas e algorítmicas.",
      careers: ["Cyber Security", "Criptografia", "Engenharia de Machine Learning", "Finanças Quantitativas", "Pesquisa Operacional"],
      courses: ["Segurança da Informação", "Estatística Avançada", "Modelagem Matemática", "Engenharia de Prompts"],
    },
    "Visual-Lógico": {
      title: "O Modelador de Conceitos Visuais",
      description: "Combina percepção tridimensional com rigor técnico, convertendo ideias e requisitos visuais em estruturas precisas.",
      careers: ["Engenharia Civil", "Design de Interação (UI/UX)", "Computação Gráfica", "Design Industrial", "Robótica"],
      courses: ["Design de Interfaces", "Computação Gráfica", "Cálculo & Física Aplicada", "Design Systems"],
    },
    "Visual-Verbal": {
      title: "O Comunicador Multimodal",
      description: "Articula ideias abstratas usando tanto a precisão das palavras quanto o apelo de metáforas e elementos visuais.",
      careers: ["Direção de Arte", "Marketing & Publicidade", "Edição de Vídeo & Cinema", "Design Editorial", "Curadoria Cultural"],
      courses: ["Storytelling Visual", "Direção Criativa", "Produção Audiovisual", "Comunicação de Marca"],
    },
    "Visual-Padrões": {
      title: "O Designer de Sintaxe & Forma",
      description: "Identifica com agilidade simetrias, anomalias e estruturas visuais recorrentes no ambiente antes que outros as notem.",
      careers: ["UI/UX Design", "Análise de Dados Visuais", "Fotografia Técnica", "Design de Identidade Visual", "Cartografia"],
      courses: ["Design Gráfico Avançado", "Visualização de Dados (DataViz)", "Percepção Visual & Gestalt", "Design de Experiência"],
    },
    "Verbal-Lógico": {
      title: "O Analista Conceitual",
      description: "Facilidade para decompor termos complexos, examinar nuances linguísticas e construir argumentos irrefutáveis.",
      careers: ["Consultoria Estratégica", "Gestão de Projetos", "Linguística Computacional", "Auditoria de Compliance", "Diplomacia"],
      courses: ["Comunicação Corporativa", "Análise Textual & Discurso", "Gestão do Conhecimento", "Direito Regulatório"],
    },
    "Verbal-Visual": {
      title: "O Ilustrador de Ideias",
      description: "Excelente facilidade em traduzir conceitos teóricos em representações visuais didáticas, engajando equipes e alunos.",
      careers: ["Educação & EdTech", "Design de Apresentações", "Marketing de Conteúdo", "Divulgação Científica", "Jornalismo Visual"],
      courses: ["Design Instrucional", "Redação Criativa", "Comunicação Visual", "Visual Thinking"],
    },
    "Verbal-Padrões": {
      title: "O Linguista Sintético",
      description: "Reconhece padrões estruturais em narrativas, códigos semânticos e linguagens, organizando ideias com fluidez.",
      careers: ["Engenharia de Prompt", "SEO & Copywriting", "Tradução Técnica", "Análise de Sentimento", "Relações Públicas"],
      courses: ["Processamento de Linguagem Natural", "Copywriting Avançado", "Semiótica & Semântica", "Gestão de Reputação"],
    },
    "Padrões-Lógico": {
      title: "O Engenheiro de Algoritmos",
      description: "Capacidade ágil para transformar observações sobre repetições de dados em regras e sistemas de automação.",
      careers: ["Desenvolvimento Back-end", "Bioinformática", "Análise de Dados", "Automação de Processos (RPA)", "Consultoria Técnica"],
      courses: ["Engenharia de Dados", "Inteligência de Negócios (BI)", "Algoritmos Genéticos", "Automação de Sistemas"],
    },
    "Padrões-Visual": {
      title: "O Mapeador Espacial",
      description: "Identifica com facilidade repetições e variações geométricas em conjuntos visuais complexos.",
      careers: ["Sensoriamento Remoto", "Análise de Imagens Médicas", "Design de Jogos 2D/3D", "Geoprocessamento", "Controle de Qualidade"],
      courses: ["Processamento de Imagens", "Sistemas de Informação Geográfica", "Navegação & Cartografia", "Inspeção Visual"],
    },
    "Padrões-Verbal": {
      title: "O Mestre de Tendências & Narrativas",
      description: "Conecta pistas comportamentais e linguísticas sutis para prever tendências e antecipar dinâmicas de comunicação.",
      careers: ["Pesquisa de Mercado", "UX Research", "Análise de Tendências", "Estratégia de Mídia", "Sociologia Aplicada"],
      courses: ["Pesquisa Qualitativa & Quantitativa", "Análise de Tendências", "Psicologia do Consumidor", "Estratégia Digital"],
    },
  };

  const hybrid = hybridProfiles[pairKey] || {
    title: `O Estrategista ${primary.category}`,
    description: `Seu perfil combina forte facilidade na dimensão ${primary.category.toLowerCase()} enriquecida pela dimensão ${secondary.category.toLowerCase()}.`,
    careers: getProfile(primary.category).careers || [],
    courses: getProfile(primary.category).courses || [],
  };

  return {
    ...hybrid,
    primaryCategory: primary.category,
    secondaryCategory: secondary.category,
    processingStyle,
  };
}

export function calculateClientScore(answers: number[], seconds: number[], questions: Question[]): number {
  const correct = answers.reduce((total, answer, index) => total + (answer === questions[index]?.answer ? 1 : 0), 0);
  const categories: Category[] = ["Lógico", "Visual", "Verbal", "Padrões"];
  const categoryScores = categories.map(category => {
    const indexes = questions
      .map((question, index) => (question.category === category ? index : -1))
      .filter(index => index >= 0);
    return indexes.length ? indexes.filter(index => answers[index] === questions[index]?.answer).length / indexes.length : 0;
  });
  const categoryBalance = categoryScores.reduce((sum, value) => sum + value, 0) / categoryScores.length;
  const speed = seconds.reduce((total, value) => total + (value <= 12 ? 0.7 : value <= 24 ? 0.35 : 0), 0);
  return Math.min(145, Math.max(70, Math.round(70 + correct * 1.45 + categoryBalance * 12 + speed)));
}

