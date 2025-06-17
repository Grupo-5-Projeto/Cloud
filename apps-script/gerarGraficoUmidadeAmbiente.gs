/**
 * Função para gerar um gráfico de % de umidade por hora na UPA,
 * relacionando com linhas retas para indicar onde está a temperatura
 * máxima, mínima e média do dia.
 */

// --- DEFINIÇÕES DE CONSTANTES ---
const UMIDADE_DATA_SHEET_NAME = 'UmidadeAmbiente'; // O nome exato da sua planilha
const COLUNA_FK_UPA = 1;                              // Coluna A: fk_upa
const COL_DATA = 2;                                // Coluna B: data
const COL_HORA = 3;                                // Coluna C: hora
const COLUNA_NOME_DA_UPA = 4;                         // Coluna D: nome da upa
const COL_MEDIA_UMID_HORA = 5;                     // Coluna E: média da umidade por hora
const COL_UNIDADE_DE_MEDIDA = 6;                // Coluna F: unidade de medida - não usada diretamente no gráfico
const COL_LEGENDA_UMIDADE = 7;                          // Coluna G: legenda - não usada diretamente no gráfico
const COL_TEMP_MIN = 8;                            // Coluna H: temperatura mínima - climatempo
const COL_TEMP_MAX = 9;                            // Coluna I: temperatura máxima - climatempo
const COL_TEMP_MEDIA = 10;                         // Coluna J: temperatura média - climatempo
// --- FIM DAS DEFINIÇÕES DE CONSTANTES ---
const START_ROW = 2; // A linha onde seus dados começam (pulando o cabeçalho)

// --- Funções de Ajuda ---

/**
 * Converte um valor para número (float), lidando com vírgula como separador decimal.
 * Retorna 0 se a conversão falhar.
 * @param {any} value O valor a ser convertido.
 * @returns {number} O número convertido ou 0.
 */
function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleanedValue = value.replace(',', '.'); // Troca vírgula por ponto
    return parseFloat(cleanedValue) || 0;
  }
  return 0;
}

/**
 * Formata uma data para o fuso horário da planilha em um formato específico.
 * @param {Date} dateObj O objeto Date a ser formatado.
 * @param {string} format O formato de saída (ex: "dd/MM/yyyy", "HH:mm").
 * @returns {string} A string de data formatada.
 */
function formatSheetDate(dateObj, format) {
  const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(dateObj, timeZone, format);
}


// --- Função Principal para Obter Dados do Gráfico de Dispersão ---

/**
 * Retorna os dados formatados para o gráfico de dispersão de Oximetria vs Temperatura.
 * Os dados são filtrados pelo ID da UPA e pela data selecionada.
 *
 * @param {string|number} idUpaParaFiltrar O ID numérico da UPA a ser filtrada (vindo do HTML).
 * @param {string} dataParaFiltrar A data no formato "yyyy-MM-dd" (vindo do HTML).
 * @returns {Array<Object>} Um array de objetos com dados para o gráfico de dispersão.
 */
function getLineChartDataForUpaAndDate(upaNome, dateString) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(UMIDADE_DATA_SHEET_NAME);
  if (!sheet) {
    console.error(`Planilha com nome "${UMIDADE_DATA_SHEET_NAME}" não encontrada.`);
    return {}; // Retorna um objeto vazio para indicar ausência de dados
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  // O slice deve começar em START_ROW - 1, pois os arrays são base 0
  const dataRows = values.slice(START_ROW - 1);

  const umidadeDataPoints = [];
  let tempMinima = null;
  let tempMedia = null;
  let tempMaxima = null;

  const partesDataSelecionada = dateString.split('-');
  const anoSelecionado = parseInt(partesDataSelecionada[0]);
  const mesSelecionado = parseInt(partesDataSelecionada[1]) - 1; // Mês é base 0
  const diaSelecionado = parseInt(partesDataSelecionada[2]);


  // Cria um objeto Date para a data selecionada, normalizando para o início do dia
  // Importante: new Date(year, month, day) cria a data no fuso horário local do script.
  const selectedDate = new Date(anoSelecionado, mesSelecionado, diaSelecionado);

  if (dataRows.length === 0) {
    console.warn("Nenhuma linha de dados encontrada na planilha (além do cabeçalho).");
    return {};
  }

  dataRows.forEach((row, index) => {
    // Obter valores brutos da linha
    const currentUpaRaw = row[COLUNA_NOME_DA_UPA - 1];
    const rowDateRaw = row[COL_DATA - 1];

    // Normaliza os nomes da UPA para comparação (remove espaços em branco e garante string)
    const normalizedUpaFromSheet = String(currentUpaRaw).trim();
    const normalizedUpaName = String(upaNome).trim();

    // --- Depuração e Normalização de Data da Planilha ---
    let dateFromSheet = null;
    if (rowDateRaw instanceof Date) {
      dateFromSheet = rowDateRaw;
    } else if (typeof rowDateRaw === 'string' && rowDateRaw.includes('/')) {
        const parts = rowDateRaw.split('/');
        if (parts.length === 3) {
          // Converte "DD/MM/YYYY" para um objeto Date. Observação: o mês é baseado em 0 (janeiro é 0).
          // new Date(ano, mês, dia) cria a data no fuso horário local do script.
          dateFromSheet = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
    } else if (typeof rowDateRaw === 'string' && rowDateRaw.includes('-')) {
      // Assume "YYYY-MM-DD" ou formato similar de string, tenta criar Date
      dateFromSheet = new Date(rowDateRaw); // This will parse in local timezone or UTC depending on string format
    } else if (typeof rowDateRaw === 'number') {
      // Se for um número que representa uma data (serial number de Excel/Sheets)
      // Ajusta o epoch para 1970-01-01 e converte para milissegundos
      dateFromSheet = new Date((rowDateRaw - 25569) * 86400 * 1000);
    }

    let dateMatch = false;
    if (dateFromSheet) {
      // Normaliza as datas para comparação (removendo a hora, fuso horário do script)
      const normalizedSheetDate = new Date(dateFromSheet.getFullYear(), dateFromSheet.getMonth(), dateFromSheet.getDate());
      dateMatch = (normalizedSheetDate.getTime() === selectedDate.getTime());
    } else {
      console.log("Data na linha inválida, não pode ser parseada.");
    }

    // Condição final de filtro
    if (normalizedUpaFromSheet === normalizedUpaName && dateMatch) {
      const umidade = parseNumber(row[COL_MEDIA_UMID_HORA - 1]);
      // Extrai apenas a parte da hora da string "HH:MM:SS" ou assume que é um número
      let hora = row[COL_HORA - 1];
      if (typeof hora === 'string' && hora.includes(':')) {
          hora = parseInt(hora.split(':')[0]); // Pega só a hora e converte para número
      } else {
          hora = parseNumber(hora); // Se já for número ou outro formato, tenta parsear
      }

      // Captura as temperaturas diárias da primeira linha que corresponde
      if (tempMinima === null) {
          tempMinima = parseNumber(row[COL_TEMP_MIN - 1]);
          tempMedia = parseNumber(row[COL_TEMP_MEDIA - 1]);
          tempMaxima = parseNumber(row[COL_TEMP_MAX - 1]);
      }

      // Adiciona o ponto de umidade apenas se for um número válido
      if (!isNaN(umidade) && !isNaN(hora)) {
        umidadeDataPoints.push({
          x: hora,
          y: umidade
        });
      } else {
        console.warn(`Dados inválidos (NaN) para umidade ou hora na linha: ${row.join(', ')}`);
      }
    } else {
      console.log("Condição de filtro NÃO ATENDIDA.");
    }
  });

  // Ordena os pontos de umidade por hora para garantir a renderização correta do gráfico de linha
  umidadeDataPoints.sort((a, b) => a.x - b.x);

  // Prepara o objeto de retorno no formato esperado pelo frontend
  const result = {
    umidade: umidadeDataPoints,
    tempMinima: tempMinima !== null ? tempMinima : 0, // Retorna 0 se não encontrar dados
    tempMedia: tempMedia !== null ? tempMedia : 0,
    tempMaxima: tempMaxima !== null ? tempMaxima : 0
  };
  return result;
}