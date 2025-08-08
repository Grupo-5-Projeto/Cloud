// gerarGraficoOximetria.gs

// --- DEFINIÇÕES DE CONSTANTES NO TOPO DO ARQUIVO ---
const OXY_DATA_SHEET_NAME = 'OximetriaPaciente'; // O nome exato da sua planilha
const COL_NOME_PACIENTE = 1;      // Coluna A: nome_paciente
const COL_OXIMETRIA_MEDIA = 2;    // Coluna B: Oximetria_Media
const COL_TEMPERATURA_MEDIA = 3;  // Coluna C: Temperatura_Media
const COL_LEGENDA_GRAVIDADE = 4;  // Coluna D: Legenda Gravidade
const COL_COR_INDICATIVA = 5;     // Coluna E: Cor Indicativa
const COL_DATA_CHEGADA = 6;       // Coluna F: data_chegada
const COL_HORARIO_CHEGADA = 7;    // Coluna G: horario_chegada
const COL_FK_UPA = 8;             // Coluna H: fk_upa_id (o ID numérico para filtro)
const COL_NOME_DA_UPA = 9;        // Coluna I: fk_nome_da_upa (nome da UPA para tooltip, etc.)
// --- FIM DAS DEFINIÇÕES DE CONSTANTES ---

const DATA_START_ROW = 2; // A linha onde seus dados começam (pulando o cabeçalho)

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
 * Os dados são filtrados pelo nome da UPA, pela data e pelos horários (opcionalmente).
 *
 * @param {string} upaNome O nome da UPA a ser filtrada.
 * @param {string} dateString A data no formato "yyyy-MM-dd".
 * @param {string} [horaInicio="00:00:00"] Horário inicial opcional (formato "HH:mm:ss").
 * @param {string} [horaFim="23:59:59"] Horário final opcional (formato "HH:mm:ss").
 * @returns {Array<Object>} Array de pontos formatados para o gráfico.
 */
function getScatterChartDataForUpaAndDate(upaNome, dateString, horaInicio = "00:00:00", horaFim = "23:59:59") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(OXY_DATA_SHEET_NAME);
  if (!sheet) {
    console.error(`Planilha com nome "${OXY_DATA_SHEET_NAME}" não encontrada.`);
    return [];
  }

  const values = sheet.getDataRange().getValues();
  const dataRows = values.slice(1); // Remove cabeçalho

  const scatterChartData = [];

  const [ano, mes, dia] = dateString.split('-').map(Number);
  const selectedDate = new Date(ano, mes - 1, dia); // YYYY-MM-DD

  const [hIni, mIni, sIni] = horaInicio.split(':').map(Number);
  const [hFim, mFim, sFim] = horaFim.split(':').map(Number);

  const inicioMillis = hIni * 3600000 + mIni * 60000 + sIni * 1000;
  const fimMillis = hFim * 3600000 + mFim * 60000 + sFim * 1000;

  dataRows.forEach((row, index) => {
    const currentUpaRaw = row[COL_NOME_DA_UPA - 1];
    const rowDateRaw = row[COL_DATA_CHEGADA - 1];
    const horarioChegadaRaw = row[COL_HORARIO_CHEGADA - 1];

    // Converter data da planilha
    let dateFromSheet = null;
    if (rowDateRaw instanceof Date) {
      dateFromSheet = rowDateRaw;
    } else if (typeof rowDateRaw === 'string' && rowDateRaw.includes('/')) {
      const parts = rowDateRaw.split('/');
      if (parts.length === 3) {
        dateFromSheet = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (typeof rowDateRaw === 'number') {
      dateFromSheet = new Date((rowDateRaw - 25569) * 86400 * 1000);
    }

    let dateMatch = false;
    if (dateFromSheet) {
      const normalizedSheetDate = new Date(dateFromSheet.getFullYear(), dateFromSheet.getMonth(), dateFromSheet.getDate());
      dateMatch = normalizedSheetDate.getTime() === selectedDate.getTime();
    }

    // --- Novo Filtro: horário_chegada ---
    let horarioMatch = true; // Padrão: aceitar tudo

    if (horarioChegadaRaw && typeof horarioChegadaRaw === 'string' && horarioChegadaRaw.includes(':')) {
      const [h, m, s] = horarioChegadaRaw.split(':').map(Number);
      const horarioMillis = h * 3600000 + m * 60000 + (s || 0) * 1000;
      horarioMatch = horarioMillis >= inicioMillis && horarioMillis <= fimMillis;
    }

    // Filtro final
    if (currentUpaRaw === upaNome && dateMatch && horarioMatch) {
      const temperatura = parseNumber(row[COL_TEMPERATURA_MEDIA - 1]);
      const oximetria = parseNumber(row[COL_OXIMETRIA_MEDIA - 1]);
      const nomePaciente = row[COL_NOME_PACIENTE - 1];
      const legenda = row[COL_LEGENDA_GRAVIDADE - 1];
      const cor = row[COL_COR_INDICATIVA - 1];

      if (!isNaN(temperatura) && !isNaN(oximetria)) {
        scatterChartData.push({
          x: temperatura,
          y: oximetria,
          paciente: nomePaciente,
          temperatura,
          oximetria,
          legenda,
          cor,
          upa: upaNome,
          chegada: `${dateFromSheet ? formatSheetDate(dateFromSheet, "dd/MM/yyyy") : 'Data Inválida'} ${horarioChegadaRaw}`
        });
      }
    }
  });

  return scatterChartData;
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

function contarOcorrenciasPorCriterio(criterio, upaNome, dateString, horaInicio, horaFim) {
  var horarioInicioGlobal = horaInicio;
  var horarioFimGlobal = horaFim;
  var nomeUpaGlobal = upaNome;
  console.log(dateString);
  const [ano, mes, dia] = dateString.split("-");
  var dataGlobal = `${dia}/${mes}/${ano}`; // formato dd/MM/yyyy

  if(horaInicio == "00:00:00" && horaFim == "00:00:00"){
    horarioInicioGlobal = horaInicio;
    horarioFimGlobal = "23:59:59";
  }

  console.log(nomeUpaGlobal, dataGlobal, horarioInicioGlobal, horarioFimGlobal);

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName("OximetriaPaciente");
  const dados = aba.getDataRange().getValues();

  const header = dados[0];
  const indiceLegenda = header.indexOf("Legenda Gravidade");
  const indiceHorario = header.indexOf("horario_chegada");
  const indiceData = header.indexOf("data_chegada");
  const indiceUpa = header.indexOf("nome_da_upa");

  let contador = 0;

  for (let i = 1; i < dados.length; i++) {
    const legenda = dados[i][indiceLegenda];
    const horario = formatarHora(dados[i][indiceHorario]);
    const data = formatarData(dados[i][indiceData]);
    const upa = dados[i][indiceUpa];

    const criterioIgual = legenda === criterio;
    const upaCorreta = upa === nomeUpaGlobal;
    const dataCorreta = data === dataGlobal;
    const dentroDoHorario = horario >= horarioInicioGlobal && horario <= horarioFimGlobal;

    if (criterioIgual && upaCorreta && dataCorreta && dentroDoHorario) {
      contador++;
    }
  }

  return contador;
}

// Formata objeto Date ou string de data para "dd/MM/yyyy"
function formatarData(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return valor;
}

// Formata hora para "HH:mm:ss"
function formatarHora(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm:ss');
  }
  return valor;
}
