const OCUPACAO_DATA_SHEET_NAME = 'TemperaturaAmbiente'; // O nome exato da sua planilha
const COL_OCUP_DATA_HORA = 1;                           // Coluna A: data_hora (timestamp completo)
const COL_OCUP_FK_UPA = 2;                              // Coluna B: fk_upa
const COL_OCUP_NOME_DA_UPA = 3;                         // Coluna C: nome_upa
const COL_OCUP_TEMPERATURA = 4;                         // Coluna D: temperatura
const COL_OCUP_OCUPACAO = 5;                            // Coluna E: ocupacao
const OCUPACAO_START_ROW = 2; // A linha onde seus dados começam (pulando o cabeçalho)

/**
 * Retorna os dados formatados para o gráfico de Ocupação da Sala vs. Temperatura Ambiente.
 * Os dados são filtrados pelo nome da UPA e pela data selecionada, e agregados por hora.
 *
 * @param {string} upaNome O nome da UPA a ser filtrada.
 * @param {string} dateString A data no formato "yyyy-MM-dd".
 * @returns {Object} Um objeto com arrays de dados para ocupação e temperatura.
 */
function getOccupancyChartDataForUpaAndDate(upaNome, dateString) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(OCUPACAO_DATA_SHEET_NAME);
  if (!sheet) {
    console.error(`Planilha com nome "${OCUPACAO_DATA_SHEET_NAME}" não encontrada.`);
    return { ocupacao: [], temperatura: [] };
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  const dataRows = values.slice(OCUPACAO_START_ROW - 1);

  const partesDataSelecionada = dateString.split('-');
  const anoSelecionado = parseInt(partesDataSelecionada[0]);
  const mesSelecionado = parseInt(partesDataSelecionada[1]) - 1; // Mês é base 0
  const diaSelecionado = parseInt(partesDataSelecionada[2]);

  const selectedDate = new Date(anoSelecionado, mesSelecionado, diaSelecionado);

  const hourlyData = {}; 

  if (dataRows.length === 0) {
    console.warn("Nenhuma linha de dados encontrada na planilha (além do cabeçalho) para Ocupação/Temperatura.");
    return { ocupacao: [], temperatura: [] };
  }

  dataRows.forEach((row, index) => {
    const currentUpaRaw = row[COL_OCUP_NOME_DA_UPA - 1];
    const rowDateTimeRaw = row[COL_OCUP_DATA_HORA - 1];

    const normalizedUpaFromSheet = String(currentUpaRaw).trim();
    const normalizedUpaName = String(upaNome).trim();

    let dateTimeFromSheet = null;
    if (rowDateTimeRaw instanceof Date) {
      dateTimeFromSheet = rowDateTimeRaw;
    } else if (typeof rowDateTimeRaw === 'string') {
      // Tenta parsear a string, ajustando para o fuso horário correto se necessário
      dateTimeFromSheet = new Date(rowDateTimeRaw.replace(' ', 'T')); 
      if (isNaN(dateTimeFromSheet.getTime())) {
          const parts = rowDateTimeRaw.split(/[\/\- :]/);
          if (parts.length >= 5) {
              if (parts[0].length === 4) { // YYYY-MM-DD
                 dateTimeFromSheet = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5] || 0);
              } else { // DD/MM/YYYY
                 dateTimeFromSheet = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5] || 0);
              }
          }
      }
    } else if (typeof rowDateTimeRaw === 'number') {
        dateTimeFromSheet = new Date((rowDateTimeRaw - 25569) * 86400 * 1000); // Excel serial number to Date
    }


    let dateMatch = false;
    let hour = null;

    if (dateTimeFromSheet && !isNaN(dateTimeFromSheet.getTime())) {
      const normalizedSheetDate = new Date(dateTimeFromSheet.getFullYear(), dateTimeFromSheet.getMonth(), dateTimeFromSheet.getDate());
      dateMatch = (normalizedSheetDate.getTime() === selectedDate.getTime());
      hour = dateTimeFromSheet.getHours(); // Pega a hora da data_hora
    } else {
      console.warn(`Data/Hora inválida na linha ${index + OCUPACAO_START_ROW}: ${rowDateTimeRaw}`);
    }

    if (normalizedUpaFromSheet === normalizedUpaName && dateMatch && hour !== null) {
      const temperatura = parseNumber(row[COL_OCUP_TEMPERATURA - 1]);
      const ocupacao = parseNumber(row[COL_OCUP_OCUPACAO - 1]);

      if (!isNaN(temperatura) && !isNaN(ocupacao)) {
        if (!hourlyData[hour]) {
          hourlyData[hour] = {
            temperaturas: [],
            ocupacoes: []
          };
        }
        hourlyData[hour].temperaturas.push(temperatura);
        hourlyData[hour].ocupacoes.push(ocupacao);
      } else {
        console.warn(`Dados inválidos (NaN) para temperatura ou ocupação na linha: ${row.join(', ')}`);
      }
    }
  });

  const ocupacaoChartPoints = [];
  const temperaturaChartPoints = [];

  // Agrega os dados por hora (calculando a média) e prepara para o Chart.js
  for (let h = 0; h <= 23; h++) {
    if (hourlyData[h]) {
      const avgTemp = hourlyData[h].temperaturas.reduce((a, b) => a + b, 0) / hourlyData[h].temperaturas.length;
      const avgOcupacao = hourlyData[h].ocupacoes.reduce((a, b) => a + b, 0) / hourlyData[h].ocupacoes.length;

      ocupacaoChartPoints.push({ x: h, y: avgOcupacao });
      temperaturaChartPoints.push({ x: h, y: avgTemp });
    } else {
      ocupacaoChartPoints.push({ x: h, y: 0 });
      temperaturaChartPoints.push({ x: h, y: 0 });
    }
  }

  // Ordena os pontos por hora (garantia, mas o loop de 0 a 23 já faz isso)
  ocupacaoChartPoints.sort((a, b) => a.x - b.x);
  temperaturaChartPoints.sort((a, b) => a.x - b.x);

  const result = {
    ocupacao: ocupacaoChartPoints,
    temperatura: temperaturaChartPoints
  };

  console.log(`Dados filtrados e agregados para gráfico de Ocupação vs. Temperatura (final): ${JSON.stringify(result)}`);
  return result;
}