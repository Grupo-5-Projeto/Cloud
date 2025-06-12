function getTemperaturasPorMes() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('temperatura_paciente');
  if (!aba) return [];

  const dados = aba.getDataRange().getValues();
  const linhas = dados.slice(1); // Remove cabeçalho

  const resultado = linhas.map(linha => {
    const mes = linha[1]; // coluna B (índice 1 base 0)
    const tempPaciente = parseFloat(String(linha[2]).replace(",", ".")); // coluna C
    const tempAmbiente = parseFloat(String(linha[3]).replace(",", ".")); // coluna D

    if (!isNaN(tempPaciente) && !isNaN(tempAmbiente)) {
      return {
        mes,
        paciente: tempPaciente,
        ambiente: tempAmbiente
      };
    }
    return null;
  }).filter(Boolean);

  return resultado;
}