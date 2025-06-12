// --- CONSTANTES ---
const TEMP_DATA_SHEET_NAME = 'temperatura_paciente';
const COL_ANO = 1;
const COL_MES = 2;
const Temperatura_Media_Paciente = 3;
const Temperatura_Media_Ambiente = 4;

// --- Função Principal ---
function gerarGraficoTemperaturaPaciente() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(TEMP_DATA_SHEET_NAME);
  
  if (!aba) {
    Logger.log(`Aba "${TEMP_DATA_SHEET_NAME}" não encontrada.`);
    return;
  }

  const dados = aba.getDataRange().getValues();
  const linhas = dados.slice(1); // Remove cabeçalho

  const dadosFiltrados = [['Mês', 'Paciente', 'Ambiente']];

  linhas.forEach((linha) => {
    const mes = linha[COL_MES - 1];
    const tempPaciente = parseFloat(String(linha[Temperatura_Media_Paciente - 1]).replace(",", "."));
    const tempAmbiente = parseFloat(String(linha[Temperatura_Media_Ambiente - 1]).replace(",", "."));

    Logger.log(`Mês: ${mes} | Paciente: ${tempPaciente} | Ambiente: ${tempAmbiente}`);

    if (!isNaN(tempPaciente) && !isNaN(tempAmbiente)) {
      dadosFiltrados.push([mes, tempPaciente, tempAmbiente]);
    }
  });

  if (dadosFiltrados.length === 1) {
    Logger.log("Nenhum dado válido encontrado.");
    return;
  }

  const abaTemp = planilha.getSheetByName("TEMP_GRAFICO") || planilha.insertSheet("TEMP_GRAFICO");
  abaTemp.clearContents();
  abaTemp.getRange(1, 1, dadosFiltrados.length, 3).setValues(dadosFiltrados);

  const grafico = abaTemp.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(abaTemp.getRange(1, 1, dadosFiltrados.length, 3))
    .setPosition(59, 2, 0, 0)
    .setOption("width", 700)
    .setOption("height", 500)
    .setOption("title", "Temperaturas do Paciente e do Ambiente")
    .setOption("hAxis", { title: "Mês" })
    .setOption("vAxis", { title: "Temperatura (°C)" })
    .setOption("legend", { position: "bottom" })
    .build();

  abaTemp.insertChart(grafico);
}

function gerarGraficoTemperaturaPaciente2() {
  //Usar a variavel 'idUpaSelecionada' para pegar id da UPA a ser gerado o gráfico
  //Usar a variavel 'dataEscolhida' para pegar a data a ser gerado o gráfico
  //Usar a variável 'nomeUpaEscolhida' para pegar o nome da UPA escolhida

  //Seu gráfico deve estar nessa posição e ter essas dimensões
      // .setPosition(59, 2, 0, 0)
      // .setOption("width", 700)
      // .setOption("height", 500)
}
