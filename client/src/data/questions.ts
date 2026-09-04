export type Category = "Lógico" | "Visual" | "Verbal" | "Padrões";
export type Question = { category: Category; prompt: string; options: string[]; answer: number };

export const questions: Question[] = [
  { category: "Lógico", prompt: "Qual item completa melhor a sequência? 2, 4, 8, 16, ...", options: ["20", "24", "32", "36"], answer: 2 },
  { category: "Padrões", prompt: "Qual símbolo vem a seguir? ▲ ● ▲ ● ▲ ...", options: ["▲", "●", "■", "◆"], answer: 1 },
  { category: "Verbal", prompt: "'Chave' está para 'abrir' assim como 'lápis' está para...", options: ["apagar", "escrever", "cortar", "medir"], answer: 1 },
  { category: "Visual", prompt: "Qual forma tem exatamente um eixo de simetria?", options: ["Círculo", "Triângulo equilátero", "Triângulo isósceles", "Quadrado"], answer: 2 },
  { category: "Lógico", prompt: "Todos os Neris são azuis. Alguns objetos azuis são leves. O que é necessariamente verdade?", options: ["Todos os Neris são leves", "Nenhum Neri é leve", "Neris são azuis", "Todos os azuis são Neris"], answer: 2 },
  { category: "Padrões", prompt: "Complete: AB, DE, GH, ...", options: ["IJ", "JK", "LM", "NO"], answer: 1 },
  { category: "Verbal", prompt: "Qual palavra não pertence ao grupo?", options: ["Rosa", "Tulipa", "Cedro", "Lírio"], answer: 2 },
  { category: "Visual", prompt: "Um cubo é pintado por fora e dividido em 8 cubos iguais. Quantos cubos pequenos têm três faces pintadas?", options: ["2", "4", "6", "8"], answer: 3 },
  { category: "Lógico", prompt: "Se hoje é terça-feira, que dia será daqui a 17 dias?", options: ["Quinta", "Sexta", "Sábado", "Domingo"], answer: 1 },
  { category: "Padrões", prompt: "Qual número substitui o ponto de interrogação? 1, 1, 2, 3, 5, ?", options: ["6", "7", "8", "9"], answer: 2 },
  { category: "Verbal", prompt: "Qual é o oposto mais preciso de 'flexível'?", options: ["Frágil", "Rígido", "Lento", "Pequeno"], answer: 1 },
  { category: "Visual", prompt: "Ao girar uma seta apontando para cima 90° no sentido horário, ela apontará para...", options: ["baixo", "esquerda", "direita", "cima"], answer: 2 },
  { category: "Lógico", prompt: "Ana é mais alta que Bia. Bia é mais alta que Lia. Quem é a mais baixa?", options: ["Ana", "Bia", "Lia", "Não é possível saber"], answer: 2 },
  { category: "Padrões", prompt: "Escolha a continuação: 3, 6, 12, 24, ...", options: ["30", "36", "42", "48"], answer: 3 },
  { category: "Verbal", prompt: "'Livro' está para 'biblioteca' assim como 'obra de arte' está para...", options: ["museu", "oficina", "palco", "estúdio"], answer: 0 },
  { category: "Visual", prompt: "Qual objeto não pode ser obtido ao dobrar uma folha quadrada ao meio duas vezes?", options: ["Um quadrado menor", "Um retângulo", "Um triângulo perfeito", "Quatro camadas"], answer: 2 },
  { category: "Lógico", prompt: "Há três caixas: uma vermelha, uma azul e uma verde. A vermelha não é a maior. A azul é maior que a verde. Qual pode ser a ordem?", options: ["Azul, verde, vermelha", "Vermelha, azul, verde", "Verde, vermelha, azul", "Vermelha, verde, azul"], answer: 0 },
  { category: "Padrões", prompt: "Qual letra completa a série? Z, X, V, T, ...", options: ["S", "R", "Q", "P"], answer: 1 },
  { category: "Verbal", prompt: "Qual par mantém a mesma relação: 'calmo : tranquilo'", options: ["rápido : veloz", "frio : quente", "alto : baixo", "claro : escuro"], answer: 0 },
  { category: "Visual", prompt: "Uma figura é refletida no espelho vertical. O que muda?", options: ["A cor", "A orientação horizontal", "O tamanho", "A quantidade de lados"], answer: 1 },
  { category: "Lógico", prompt: "Se alguns artistas são professores e todos os professores estudam, o que pode ser concluído?", options: ["Todos os artistas estudam", "Alguns artistas estudam", "Nenhum artista estuda", "Todos os que estudam são artistas"], answer: 1 },
  { category: "Padrões", prompt: "Observe: 10, 9, 7, 4, ... Qual vem depois?", options: ["0", "1", "2", "3"], answer: 0 },
  { category: "Verbal", prompt: "Qual palavra completa: 'A decisão foi tomada de forma ___, sem hesitação.'", options: ["vacilante", "decisiva", "aleatória", "indireta"], answer: 1 },
  { category: "Visual", prompt: "Qual forma possui maior número de diagonais?", options: ["Triângulo", "Quadrado", "Pentágono", "Hexágono"], answer: 3 },
  { category: "Lógico", prompt: "Quatro pessoas estão em fila. João está antes de Maria e depois de Paulo. Quem certamente não está em primeiro?", options: ["João", "Maria", "Paulo", "Não é possível saber"], answer: 0 },
  { category: "Padrões", prompt: "Qual grupo foge à regra dos demais?", options: ["2–4–6", "3–6–9", "4–8–12", "5–10–14"], answer: 3 },
  { category: "Verbal", prompt: "Qual conceito melhor resume 'observar, comparar e concluir'?", options: ["Impulso", "Raciocínio", "Memorização", "Imitação"], answer: 1 },
];

export const categoryColors: Record<Category, string> = {
  Lógico: "#9f8cff",
  Visual: "#5bd6c5",
  Verbal: "#f6c66a",
  Padrões: "#ff8da1",
};
