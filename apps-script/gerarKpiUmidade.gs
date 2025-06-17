/**
 * Conta o número de registros de umidade que estão fora do padrão ideal
 * (menor ou igual a 40% OU maior ou igual a 70%) para um dia e UPA específicos.
 *
 * @param {string} dataSelecionadaInput A data para a qual a contagem deve ser feita, no formato "YYYY-MM-DD".
 * @param {string} upaSelecionada O nome da UPA para a qual a contagem deve ser feita.
 * @returns {number | null} O número de registros fora do padrão no dia e UPA especificados, ou null se houver um erro.
 */
function getKpiUmidadeForaDoPadrao(dataSelecionadaInput, upaSelecionada) { // Adicionado upaSelecionada
  if (!dataSelecionadaInput) {
    console.log("Erro: Nenhuma data foi fornecida como entrada.");
    return null;
  }
  if (!upaSelecionada) { // Verificação para UPA também
    console.log("Erro: Nenhuma UPA foi fornecida como entrada.");
    return null;
  }

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('UmidadeAmbiente');
  if (!aba) {
    console.log("Erro: A aba 'UmidadeAmbiente' não foi encontrada.");
    return null;
  }

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  const nomeColunaData = "data";
  const nomeColunaUmidade = "media_umid_hora";
  const nomeColunaUpa = "nome_da_upa"; // <-- 4. CONFIRME O NOME DA SUA COLUNA DE UPA AQUI!

  const indiceData = cabecalho.indexOf(nomeColunaData);
  const indiceUmidade = cabecalho.indexOf(nomeColunaUmidade);
  const indiceUpa = cabecalho.indexOf(nomeColunaUpa); // Obtenha o índice da coluna UPA

  if (indiceData === -1 || indiceUmidade === -1 || indiceUpa === -1) { // Adicionado verificação para UPA
    console.log(`Erro: Verifique se os nomes das colunas "${nomeColunaData}", "${nomeColunaUmidade}" e "${nomeColunaUpa}" estão corretos no cabeçalho.`);
    return null;
  }

  let contagemDoDia = 0;

  linhas.forEach((linha) => {
    const valorDataBruto = linha[indiceData];
    const valorUpa = linha[indiceUpa]; // Pega o valor da UPA da linha
    
    if (!valorDataBruto || !valorUpa) return; // Pula a linha se data ou UPA estiverem vazios

    let dataObjeto;

    if (typeof valorDataBruto === 'object' && valorDataBruto instanceof Date) {
      dataObjeto = valorDataBruto;
    } else if (typeof valorDataBruto === 'number') {
      dataObjeto = new Date((valorDataBruto - 25569) * 86400000);
    } else if (typeof valorDataBruto === 'string') {
      const partesData = valorDataBruto.split('/');
      if (partesData.length === 3) {
        const dia = parseInt(partesData[0], 10);
        const mes = parseInt(partesData[1], 10) - 1; // Mês é zero-based (0-11)
        const ano = parseInt(partesData[2], 10);
        
        dataObjeto = new Date(ano, mes, dia);
        dataObjeto.setHours(0, 0, 0, 0); // Zera o tempo
      } else {
        dataObjeto = new Date(valorDataBruto);
      }
    } else {
      console.warn("Tipo de dado inesperado para data:", typeof valorDataBruto, "Valor:", valorDataBruto);
      return;
    }

    if (isNaN(dataObjeto.getTime())) {
      console.warn("Data inválida após conversão. Valor bruto:", valorDataBruto);
      return;
    }

    let dataDaLinhaFormatada;
    try {
      dataDaLinhaFormatada = Utilities.formatDate(dataObjeto, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd");
    } catch (e) {
      console.error("Erro ao formatar data com Utilities.formatDate:", e, "Valor original:", valorDataBruto, "Objeto Date:", dataObjeto);
      return;
    }

    // --- NOVA CONDIÇÃO DE FILTRO: COMPARA A UPA DA LINHA COM A UPA SELECIONADA ---
    // A comparação é case-insensitive para maior robustez
    if (dataDaLinhaFormatada === dataSelecionadaInput && 
        String(valorUpa).trim().toLowerCase() === String(upaSelecionada).trim().toLowerCase()) {
      
      const umidade = parseFloat(String(linha[indiceUmidade]).replace(",", "."));
      const umidadeBruta = linha[indiceUmidade];
      console.log("Umidade Bruta:", umidadeBruta, "Umidade Convertida:", umidade); // Mantenha ou desative para depuração

      if (isNaN(umidade)) {
        return;
      }

      if (umidade >= 70 || umidade <= 40) {
        console.log("Registro FORA DO PADRÃO detectado. Umidade:", umidade, "UPA:", valorUpa); // Mantenha ou desative para depuração
        contagemDoDia++;
      }
    }
  });

  console.log(`KPI para o dia ${dataSelecionadaInput}, UPA ${upaSelecionada}: ${contagemDoDia} registros com umidade fora do padrão (<= 40% ou >= 70%).`);
  return contagemDoDia;
}