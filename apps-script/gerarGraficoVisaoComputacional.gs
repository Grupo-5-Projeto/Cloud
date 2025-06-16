const START_ROW_VCS = 2; // A linha onde seus dados começam (pulando o cabeçalho)
const COL_DATA_VSC = 0;
const COL_ID_UPA = 1;
const COL_MEDIA_PESSOAS = 2;

function getGraficoVisaoComputacionalSemanal(idUpa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("VisaoComputacionalSemanal");
  if (!sheet) {
    console.error(`Planilha VisaoComputacionalSemanal não encontrada.`);
    return {}; // Retorna um objeto vazio para indicar ausência de dados
  }

  const range = sheet.getDataRange();
  const values = range.getValues();
  const dataRows = values.slice(START_ROW_VCS - 1);

  if (dataRows.length === 0) {
    console.warn(
      "Nenhuma linha de dados encontrada na planilha (além do cabeçalho)."
    );
    return {};
  }

  const valoresGrafico = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row[COL_ID_UPA] !== Number(idUpa)) {
      break;
    }

    let [dia, mes] = row[COL_DATA_VSC].split("/");
    let dia_mes = `${dia}/${mes}`;

    valoresGrafico.push({
      x: dia_mes,
      y: parseInt(row[COL_MEDIA_PESSOAS]),
    });
  }

  return valoresGrafico;
}
