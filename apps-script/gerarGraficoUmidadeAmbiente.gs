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
    return [];
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  const dataRows = values.slice(1); // Pula o cabeçalho (primeira linha)

  const lineChartData = [];
  const partesDataSelecionada = dateString.split('-');
  const anoSelecionado = parseInt(partesDataSelecionada[0]);
  const mesSelecionado = parseInt(partesDataSelecionada[1]) - 1; // Mês é base 0
  const diaSelecionado = parseInt(partesDataSelecionada[2]);

  // Esta é a data que você selecionou, no fuso horário do seu script.
  const selectedDate = new Date(anoSelecionado, mesSelecionado, diaSelecionado); // A data vem como YYYY-MM-DD do HTML
  console.log(`Função chamada com UPA: "<span class="math-inline">\{upaNome\}" e Data\: "</span>{dateString}" (Objeto Date: ${selectedDate.toLocaleDateString('pt-BR')})`);

  if (dataRows.length === 0) {
    console.warn("Nenhuma linha de dados encontrada na planilha (além do cabeçalho).");
  }

  dataRows.forEach((row, index) => {
    // Obter valores brutos da linha
    const currentUpaRaw = row[COLUNA_NOME_DA_UPA - 1];
    const rowDateRaw = row[COL_DATA_CHEGADA - 1];

    // --- Depuração de UPA ---
    console.log(`--- Linha ${index + 2} ---`); // +2 porque pula o cabeçalho e é base 1
    console.log(`UPA na linha: "<span class="math-inline">\{currentUpaRaw\}" \| UPA Selecionada\: "</span>{upaNome}"`);
    console.log(`Comparação UPA: ${currentUpaRaw === upaNome}`);

    // --- Depuração de Data ---
    let dateFromSheet = null;
    if (rowDateRaw instanceof Date) {
      dateFromSheet = rowDateRaw;
    } else if (typeof rowDateRaw === 'string' && rowDateRaw.includes('/')) {
      const parts = rowDateRaw.split('/');
      if (parts.length === 3) {
        // Converte "DD/MM/YYYY" para um objeto Date
        dateFromSheet = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (typeof rowDateRaw === 'string' && rowDateRaw.includes('-')) {
      // Assume "YYYY-MM-DD" ou formato similar de string, tenta criar Date
      dateFromSheet = new Date(rowDateRaw);
    } else if (typeof rowDateRaw === 'number') {
      // Se for um número que representa uma data (serial number de Excel/Sheets)
      dateFromSheet = new Date((rowDateRaw - (25569)) * 86400 * 1000); // Conversão para datas serial
    }

    let dateMatch = false;
    if (dateFromSheet) {
      // Normaliza as datas para comparação (removendo a hora)
      const normalizedSheetDate = new Date(dateFromSheet.getFullYear(), dateFromSheet.getMonth(), dateFromSheet.getDate());

      dateMatch = (normalizedSheetDate.getTime() === selectedDate.getTime());
    }

    console.log(`Data na linha (bruta): "${rowDateRaw}" | Data convertida: ${dateFromSheet ? dateFromSheet.toLocaleDateString('pt-BR') : 'Inválida'}`);
    console.log(`Data Selecionada (convertida): ${selectedDate.toLocaleDateString('pt-BR')}`);
    console.log(`Comparação Data (normalized): ${dateMatch}`);

    // Condição final de filtro
    if (currentUpaRaw === upaNome && dateMatch) {
      const umidade = parseFloat(row[COL_MEDIA_UMID_HORA - 1]);
      const legenda = row[COL_LEGENDA_UMIDADE - 1];
      const hora = row[COL_HORA - 1];
      const temperatura_minima = row[COL_TEMP_MIN - 1];
      const temperatura_maxima = row[COL_TEMP_MAX - 1];
      const temperatura_media = row[COL_TEMP_MEDIA - 1];
      const dateObjFromSheet = rowDateRaw; // Usa o valor bruto para o tooltip, ou o dateFromSheet

      console.log(`Condição de filtro ATENDIDA! Processando linha...`);
      console.log(`Valores para gráfico: Umidade=<span class="math-inline">\{umidade\}, TempMin\=</span>{temperatura_minima}, TempMax\=</span>{temperatura_maxima}, TempMedia\=</span>{temperatura_media},`);
      // console.log(`É NaN: Temp=<span class="math-inline">\{isNaN\(temperatura\)\}, Oxi\=</span>{isNaN(oximetria)}`);

      if (!isNaN(umidade) && !isNaN(temperatura_minima) && !isNaN(temperatura_maxima) && !isNaN(temperatura_media)) {
        lineChartData.push({
          x: hora,
          y: umidade,
          umidade: umidade,
          temp_min: temperatura_minima,
          temp_max: temperatura_maxima,
          temp_media: temperatura_media,
          legenda: legenda,
          upa: upaNome,
          // Usa formatSheetDate para garantir que a data no tooltip esteja no formato DD/MM/YYYY
          hora: `${dateFromSheet ? formatSheetDate(dateFromSheet, "dd/MM/yyyy") : 'Data Inválida'} ${hora}`
        });
        console.log("Dado adicionado ao gráfico.");
      } else {
        console.warn(`Dados inválidos (NaN) para umidade: ${row.join(', ')}`);
      }
    } else {
      console.log("Condição de filtro NÃO ATENDIDA.");
    }
  });

  console.log(`Dados filtrados para gráfico de umidade (final): ${JSON.stringify(lineChartData)}`);
  return lineChartData;
}

function formatSheetDate(dateValue, format) {
  if (dateValue instanceof Date) {
    const day = String(dateValue.getDate()).padStart(2, '0');
    const month = String(dateValue.getMonth() + 1).padStart(2, '0'); // Mês é base 0
    const year = dateValue.getFullYear();
    if (format === "dd/MM/yyyy") {
      return `${day}/${month}/${year}`; // Corrigido aqui
    }
  }
  return dateValue; // Retorna o valor original se não for Date ou formato não suportado
}
