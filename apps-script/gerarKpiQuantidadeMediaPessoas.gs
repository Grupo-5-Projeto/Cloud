function getKpiQuantidadeMediaPessoas(dataSelecionadaInput) {
  // Mantemos para teste no editor, ou você pode remover/comentar
  // dataSelecionadaInput = "2025-04";

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('temperatura_paciente');
  if (!aba) return null;

  const dados = aba.getDataRange().getValues();
  const linhas = dados.slice(1); // Ignora o cabeçalho

  console.log("dataSelecionadaInput:", dataSelecionadaInput);

  // O ano e mês selecionados continuam vindo do input '2025-05'
  const [anoSelecionado, mesSelecionado] = dataSelecionadaInput.split('-').map(str => parseInt(str));
  Logger.log("Ano Selecionado (Input):", anoSelecionado, "Mês Selecionado (Input):", mesSelecionado);

  const valores = [];
  let valoresDoMes = [];

  linhas.forEach(linha => {
    // --- MUDANÇA AQUI ---
    // Pega o ano e o mês diretamente das colunas 0 e 1
    const anoDaLinha = parseInt(linha[0]); // Assumindo que a coluna 0 é o Ano
    const mesDaLinha = parseInt(linha[1]); // Assumindo que a coluna 1 é o Mês
    const valor = parseFloat(String(linha[4]).replace(",", ".")); // Valor da 5ª coluna (índice 4)

    // Verifica se ano, mês e valor são números válidos
    if (isNaN(anoDaLinha) || isNaN(mesDaLinha) || isNaN(valor)) {
      Logger.log(`Dados inválidos na linha (Ano: ${linha[0]}, Mês: ${linha[1]}, Valor: ${linha[4]}). Pulando linha.`);
      return; // Pula esta linha se algum dado essencial for inválido
    }

    Logger.log(`Ano da Linha: ${anoDaLinha}, Mês da Linha: ${mesDaLinha}, Valor: ${valor}`);

    valores.push(valor); // Adiciona ao total geral

    // Compara com o ano e mês selecionados
    if (mesDaLinha === mesSelecionado && anoDaLinha === anoSelecionado) {
      valoresDoMes.push(valor); // Adiciona ao total do mês selecionado
    }
  });

  Logger.log("Total geral de valores:", valores.length, "Total do mês selecionado:", valoresDoMes.length);
  console.log("Total geral de valores:", valores.length, "Total do mês selecionado:", valoresDoMes.length)

  if (valores.length === 0 || valoresDoMes.length === 0) {
    Logger.log("Sem dados suficientes para calcular as médias e variação.");
    return null;
  }

  const mediaGeral = valores.reduce((soma, v) => soma + v, 0) / valores.length;
  const mediaDoMes = valoresDoMes.reduce((soma, v) => soma + v, 0) / valoresDoMes.length;
  const variacao = ((mediaDoMes - mediaGeral) / mediaGeral) * 100;

  Logger.log("Média geral:", mediaGeral, "Média do mês:", mediaDoMes, "Variação:", variacao);

  return variacao.toFixed(2);
}