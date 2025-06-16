// --- DEFINIÇÕES DE CONSTANTES NO TOPO DO ARQUIVO ---Add commentMore actions
const BIOMETRY_DATA_SHEET_NAME = 'BiometriaPaciente'; // O nome exato da sua planilha
const COL_FAIXA_ETARIA = 4;       // Coluna D: Faixa_Etaria
const COL_DATA_BIOMETRIA = 5;     // Coluna E: data_biometria
const COL_HORA_BIOMETRIA = 6;     // Coluna F: hora_biometria
const COL_FAIXA_HORA = 7;         // Coluna G: Faixa_Hora
const COL_FK_UPA_BIOMETRIA = 8;             // Coluna H: fk_upa
const COL_NOME_DA_UPA_BIOMETRIA = 9; // Coluna I: fk_nome_da_upa (assumindo que seja a mesma estrutura de nome da UPA)
// --- FIM DAS DEFINIÇÕES DE CONSTANTES ---

//const DATA_START_ROW_BIOMETRIA = 2; // A linha onde seus dados começam (pulando o cabeçalho)

// --- Funções de Ajuda ---

/**
 * Formata uma data para o fuso horário da planilha em um formato específico.
 * @param {Date} dateObj O objeto Date a ser formatado.
 * @param {string} format O formato de saída (ex: "dd/MM/yyyy", "HH:mm").
 * @returns {string} A string de data formatada.
 */
function formatSheetDate(dateObj, format) {
  if (!(dateObj instanceof Date)) {
    return 'Data Inválida';
  }
  const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(dateObj, timeZone, format);
}


// --- Função Principal para Obter Dados de Biometria ---

/**
 * Retorna os dados formatados para o gráfico de biometria.
 * Os dados são filtrados pelo nome da UPA e pela data selecionada.
 *
 * @param {string} upaNome O nome da UPA a ser filtrada (vindo do HTML).
 * @param {string} dateString A data no formato "yyyy-MM-dd" (vindo do HTML).
 * @returns {Array<Object>} Um array de objetos com dados de biometria.
 */
function getBiometricChartDataForUpaAndDate(upaNome, dateString) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BIOMETRY_DATA_SHEET_NAME);
  if (!sheet) {
    console.error(`Planilha com nome "${BIOMETRY_DATA_SHEET_NAME}" não encontrada.`);
    return [];
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  const dataRows = values.slice(1); // Pula o cabeçalho (primeira linha)

  const biometricData = [];
  const partesDataSelecionada = dateString.split('-');
  const anoSelecionado = parseInt(partesDataSelecionada[0]);
  const mesSelecionado = parseInt(partesDataSelecionada[1]) - 1; // Mês é base 0
  const diaSelecionado = parseInt(partesDataSelecionada[2]);

  // Esta é a data que você selecionou, no fuso horário do seu script.
  const selectedDate = new Date(anoSelecionado, mesSelecionado, diaSelecionado);
  console.log(`Função chamada com UPA: "${upaNome}" e Data: "${dateString}" (Objeto Date: ${selectedDate.toLocaleDateString('pt-BR')})`);

  if (dataRows.length === 0) {
    console.warn("Nenhuma linha de dados encontrada na planilha (além do cabeçalho).");
    return [];
  }

  dataRows.forEach((row, index) => {
    // Obter valores brutos da linha
    const currentUpaRaw = row[COL_NOME_DA_UPA_BIOMETRIA - 1];
    const rowDateRaw = row[COL_DATA_BIOMETRIA - 1];

    // --- Depuração de UPA ---
    console.log(`--- Linha ${index + 2} ---`); // +2 porque pula o cabeçalho e é base 1
    console.log(`UPA na linha: "${currentUpaRaw}" | UPA Selecionada: "${upaNome}"`);
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
      const faixaEtaria = row[COL_FAIXA_ETARIA - 1];
      const horaBiometria = row[COL_HORA_BIOMETRIA - 1];
      const faixaHora = row[COL_FAIXA_HORA - 1];
      const fkUpaId = row[COL_FK_UPA_BIOMETRIA - 1]; // Assuming you might still want this ID for some reason

      const faixaEtariaNormalizada = typeof faixaEtaria === 'string' ? faixaEtaria.trim().replace(/–/g, '-') : faixaEtaria;
      const faixaHoraNormalizada = typeof faixaHora === 'string' ? faixaHora.trim().replace(/–/g, '-') : faixaHora;

      console.log(`Condição de filtro ATENDIDA! Processando linha...`);
      console.log(`Valores para biometria: Faixa Etária="${faixaEtariaNormalizada}", Hora="${horaBiometria}", Faixa Hora="${faixaHoraNormalizada}"`);

      biometricData.push({
        faixaEtaria: faixaEtariaNormalizada,
        dataBiometria: dateFromSheet ? formatSheetDate(dateFromSheet, "dd/MM/yyyy") : 'Data Inválida',
        horaBiometria: horaBiometria,
        faixaHora: faixaHoraNormalizada,
        upa: upaNome,
        fkUpaId: fkUpaId
      });
      console.log("Ponto adicionado aos dados de biometria.");
    } else {
      console.log("Condição de filtro NÃO ATENDIDA.");
    }
  });

  console.log(`Dados filtrados para biometria (final): ${JSON.stringify(biometricData)}`);
  return biometricData;
}