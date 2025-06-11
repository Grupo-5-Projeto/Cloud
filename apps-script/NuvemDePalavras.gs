/**
 * @OnlyCurrentDoc
 * Arquivo para funções relacionadas à geração da nuvem de palavras.
 */

// Variável global para a planilha AnalizadorLexico
let ANALIZADOR_LEXICO_SHEET_NAME;
let analizadorLexicoSheet;

/**
 * Inicializa as variáveis globais específicas para a nuvem de palavras.
 * Esta função pode ser chamada a partir de main.gs no inicializarVariaveis()
 * para garantir que as folhas estejam prontas.
 */
function inicializarVariaveisNuvemDePalavras() {
  if (!ss) { // Garante que 'ss' (SpreadsheetApp.getActiveSpreadsheet()) já foi inicializado
    inicializarVariaveis(); // Chama a inicialização principal se ainda não foi feita
  }
  ANALIZADOR_LEXICO_SHEET_NAME = "AnalizadorLexico"; // Nome da sua planilha de dados para nuvem
  analizadorLexicoSheet = ss.getSheetByName(ANALIZADOR_LEXICO_SHEET_NAME);

  if (!analizadorLexicoSheet) {
    Logger.log(`ERRO: Planilha "${ANALIZADOR_LEXICO_SHEET_NAME}" não encontrada.`);
    // Opcional: Criar a planilha se não existir, ou lançar um erro mais explícito
  }
}

/**
 * Busca as palavras e seus tipos da planilha "AnalizadorLexico"
 * e os prepara para a nuvem de palavras.
 *
 * A estrutura da sua tabela AnalizadorLexico é:
 * coluna A: palavra
 * coluna B: tipo (sentimento_positivo, sentimento_negativo, etc.)
 *
 * @returns {Array<Object>} Um array de objetos, onde cada objeto tem { text: string, weight: number, color: string, type: string }.
 */
function getWordsForWordCloud() {
  Logger.log("getWordsForWordCloud() chamada.");
  if (!analizadorLexicoSheet) {
    inicializarVariaveisNuvemDePalavras(); // Garante que a folha está carregada
  }

  if (!analizadorLexicoSheet) {
    Logger.log("getWordsForWordCloud(): 'analizadorLexicoSheet' é nulo. Não foi possível ler os dados.");
    return [];
  }

  // Assume que as palavras e tipos estão nas colunas A e B, a partir da linha 2.
  // Ajuste "A2:B" se a estrutura for diferente.
  const range = "A2:B"; // Coluna A para palavra, Coluna B para tipo
  let data;
  try {
    data = analizadorLexicoSheet.getRange(range).getValues();
    Logger.log(`Dados brutos da planilha "${ANALIZADOR_LEXICO_SHEET_NAME}" lidos: ${JSON.stringify(data)}`);
  } catch (e) {
    Logger.log(`ERRO ao ler dados de "${ANALIZADOR_LEXICO_SHEET_NAME}" do range ${range}: ${e.message}`);
    return [];
  }

  const wordFrequencies = new Map(); // Map<palavra, { frequency: number, type: string }>

  // Define cores para os sentimentos
  const sentimentColors = {
    'sentimento_positivo': '#28a745', // Verde
    'sentimento_negativo': '#dc3545', // Vermelho
    'sentimento_neutro': '#ffc107', // Amarelo
    // Adicione mais tipos de sentimento e cores conforme necessário
  };

  data.forEach(row => {
    const word = String(row[0]).trim().toLowerCase(); // Coluna da palavra (índice 0)
    const type = String(row[1]).trim().toLowerCase(); // Coluna do tipo (índice 1)

    if (word && word !== "vazia") { // Ignora palavras vazias ou 'vazia'
      // Incrementa a frequência da palavra
      const currentFrequency = wordFrequencies.has(word) ? wordFrequencies.get(word).frequency : 0;
      wordFrequencies.set(word, {
        frequency: currentFrequency + 1,
        type: type // Armazena o tipo associado
      });
    }
  });

  // Converte o mapa em um array de objetos para a nuvem de palavras
  // A "weight" (peso) é a frequência.
  // A "color" é baseada no tipo (sentimento).
  // NOVO: Adicionamos a propriedade 'type' no objeto retornado
  const wordCloudData = Array.from(wordFrequencies.entries()).map(([word, { frequency, type }]) => {
    const color = sentimentColors[type] || '#6c757d'; // Cor padrão se o tipo não for mapeado
    return {
      text: word,
      weight: frequency,
      color: color,
      type: type // Adiciona o tipo para ser usado no frontend (ex: tooltip)
    };
  });

  // Opcional: Ordenar por frequência para depuração, se necessário.
  // wordCloudData.sort((a, b) => b.weight - a.weight);

  Logger.log(`Dados da Nuvem de Palavras preparados: ${JSON.stringify(wordCloudData)}`);
  return wordCloudData;
}