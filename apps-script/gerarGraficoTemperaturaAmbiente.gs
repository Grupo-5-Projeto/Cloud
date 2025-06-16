function getOcupacaoTemperaturaPorHora() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('TemperaturaAmbiente'); // Troque o nome da aba se for diferente
  if (!aba) return [];

  const dados = aba.getDataRange().getValues();
  const linhas = dados.slice(1); // Remove cabeçalho

  const resultado = linhas.map(linha => {
    const dataHora = linha[0]; // Coluna A (data_hora)
    const temperatura = parseFloat(String(linha[3]).replace(",", ".")); // Coluna D (temperatura)
    const ocupacao = parseInt(linha[4]); // Coluna E (ocupacao)

    let horarioFormatado = '';

    if (dataHora instanceof Date) {
      // Formatar como HH:mm
      const horas = String(dataHora.getHours()).padStart(2, '0');
      const minutos = String(dataHora.getMinutes()).padStart(2, '0');
      horarioFormatado = `<span class="math-inline">\{horas\}\:</span>{minutos}`;
    } else if (typeof dataHora === 'string') {
      // Caso venha como string: "2025-05-22 00:25:00"
      const partesHora = dataHora.split(' ')[1];
      horarioFormatado = partesHora ? partesHora.substring(0, 5) : '';
    }

    if (!isNaN(temperatura) && !isNaN(ocupacao) && horarioFormatado) {
      return {
        horario: horarioFormatado,
        temperatura: temperatura,
        ocupacao: ocupacao
      };
    }
    return null;
  }).filter(Boolean);

  // Adicione esta linha para logar o resultado
  Logger.log(resultado);

  return resultado;
}
