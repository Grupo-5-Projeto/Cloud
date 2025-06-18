/**
 * Calcula a temperatura média interna e externa para um dia e UPA específicos.
 */
function getKpiTemperaturaMedia(dataSelecionadaInput, upaSelecionada) {
  if (!dataSelecionadaInput || !upaSelecionada) return null;

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('TemperaturaAmbiente'); // Assumindo o nome da planilha do gráfico
  if (!aba) return null;

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  // Nomes das colunas da sua planilha
  const nomeColunaDataHora = "data_hora";
  const nomeColunaTemperaturaInterna = "temperatura";
  const nomeColunaTemperaturaExterna = "temperatura_media"; // Esta coluna será usada para a temp. externa
  const nomeColunaUpa = "nome_upa";

  // Encontra os índices das colunas no cabeçalho
  const indiceDataHora = cabecalho.indexOf(nomeColunaDataHora);
  const indiceTemperaturaInterna = cabecalho.indexOf(nomeColunaTemperaturaInterna);
  const indiceTemperaturaExterna = cabecalho.indexOf(nomeColunaTemperaturaExterna);
  const indiceUpa = cabecalho.indexOf(nomeColunaUpa);

  // Verifica se todas as colunas necessárias foram encontradas
  if (indiceDataHora === -1 || indiceTemperaturaInterna === -1 || indiceTemperaturaExterna === -1 || indiceUpa === -1) {
    console.error("Uma ou mais colunas necessárias não foram encontradas na planilha 'TemperaturaAmbiente'.");
    console.error("Cabeçalho da planilha:", cabecalho);
    console.error(`Procurando por: "${nomeColunaDataHora}", "${nomeColunaTemperaturaInterna}", "${nomeColunaTemperaturaExterna}", "${nomeColunaUpa}"`);
    return null;
  }

  let totalTemperaturaInterna = 0;
  let contagemTemperaturaInterna = 0;
  let temperaturasExternasDoDia = []; // Para coletar todas as temperaturas externas do dia

  // Prepara a data selecionada para comparação (ignorando a hora)
  const partesDataSelecionada = dataSelecionadaInput.split('-');
  const anoSelecionado = parseInt(partesDataSelecionada[0]);
  const mesSelecionado = parseInt(partesDataSelecionada[1]) - 1; // Mês é base 0
  const diaSelecionado = parseInt(partesDataSelecionada[2]);
  const dataSelecionadaObjeto = new Date(anoSelecionado, mesSelecionado, diaSelecionado);
  dataSelecionadaObjeto.setHours(0, 0, 0, 0); // Zera a hora para comparação

  linhas.forEach((linha, index) => {
    const valorDataHoraBruto = linha[indiceDataHora];
    const valorUpa = linha[indiceUpa];

    // Pula linhas sem dados essenciais
    if (!valorDataHoraBruto || !valorUpa) {
        return;
    }

    let dataObjeto;
    // Tenta converter o valor da data/hora para um objeto Date
    if (valorDataHoraBruto instanceof Date) {
      dataObjeto = valorDataHoraBruto;
    } else if (typeof valorDataHoraBruto === 'number') {
      // Converte números seriais do Excel para Date
      dataObjeto = new Date((valorDataHoraBruto - 25569) * 86400000);
    } else if (typeof valorDataHoraBruto === 'string') {
        // Tenta parsear a string em diferentes formatos comuns
        const parts = valorDataHoraBruto.split(/[\/\- :]/);
        if (parts.length >= 5) { // Ex: YYYY-MM-DD HH:MM:SS ou DD/MM/YYYY HH:MM:SS
            if (parts[0].length === 4) { // Assume YYYY-MM-DD
               dataObjeto = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5] || 0);
            } else { // Assume DD/MM/YYYY
               dataObjeto = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5] || 0);
            }
        } else if (parts.length === 3) { // Ex: YYYY-MM-DD ou DD/MM/YYYY sem hora
            if (parts[0].length === 4) { // Assume YYYY-MM-DD
                dataObjeto = new Date(parts[0], parts[1] - 1, parts[2]);
            } else { // Assume DD/MM/YYYY
                dataObjeto = new Date(parts[2], parts[1] - 1, parts[0]);
            }
            dataObjeto.setHours(0, 0, 0, 0); // Garante que a hora seja zerada para comparação
        } else {
            dataObjeto = new Date(valorDataHoraBruto); // Última tentativa de parsing
        }
    } else {
      console.warn(`Tipo de dado inesperado para 'data_hora' na linha ${index + 2}: ${typeof valorDataHoraBruto}. Valor: ${valorDataHoraBruto}`);
      return;
    }

    // Valida se a conversão resultou em uma data válida
    if (isNaN(dataObjeto.getTime())) {
      console.warn(`Data/Hora inválida após conversão na linha ${index + 2}. Valor bruto: ${valorDataHoraBruto}`);
      return;
    }

    // Normaliza a data da linha para comparação (ignora a hora)
    const dataDaLinhaNormalizada = new Date(dataObjeto.getFullYear(), dataObjeto.getMonth(), dataObjeto.getDate());
    dataDaLinhaNormalizada.setHours(0, 0, 0, 0);

    // Filtra por data e UPA
    if (dataDaLinhaNormalizada.getTime() === dataSelecionadaObjeto.getTime() &&
        String(valorUpa).trim().toLowerCase() === String(upaSelecionada).trim().toLowerCase()) {

      // Coleta dados para a temperatura interna (coluna 'temperatura')
      const temperaturaInterna = parseFloat(String(linha[indiceTemperaturaInterna]).replace(",", "."));
      if (!isNaN(temperaturaInterna)) {
        totalTemperaturaInterna += temperaturaInterna;
        contagemTemperaturaInterna++;
      }

      // Coleta dados para a temperatura externa (coluna 'temperatura_media')
      const temperaturaExterna = parseFloat(String(linha[indiceTemperaturaExterna]).replace(",", "."));
      if (!isNaN(temperaturaExterna)) {
        temperaturasExternasDoDia.push(temperaturaExterna);
      }
    }
  });

  // Calcula a média interna
  const mediaInterna = contagemTemperaturaInterna > 0 ? (totalTemperaturaInterna / contagemTemperaturaInterna).toFixed(1) : null;

  // Calcula a média externa
  const mediaExterna = temperaturasExternasDoDia.length > 0 ?
                       (temperaturasExternasDoDia.reduce((a, b) => a + b, 0) / temperaturasExternasDoDia.length).toFixed(1) :
                       null;

  console.log(`KPI Temperatura Média para o dia ${dataSelecionadaInput}, UPA ${upaSelecionada}: Interna = ${mediaInterna}°C, Externa = ${mediaExterna}°C`);
  return { mediaInterna: mediaInterna, mediaExterna: mediaExterna };
}