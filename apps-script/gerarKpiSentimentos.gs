function getTop3PalavrasSentimento() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AnalizadorLexico');
  if (!aba) return [];

  const dados = aba.getDataRange().getValues();
  const linhas = dados.slice(1); // Ignora cabeçalho

  const contagem = {}; // { palavra: { quantidade, sentimento } }

  linhas.forEach(linha => {
    const palavra = String(linha[0]).trim().toLowerCase();
    const sentimento = String(linha[1]).trim().toLowerCase();

    if (!palavra || !sentimento) return;

    if (!contagem[palavra]) {
      contagem[palavra] = { quantidade: 1, sentimento };
    } else {
      contagem[palavra].quantidade += 1;
    }
  });

  // Converte objeto em array, ordena e pega top 3
  const top3 = Object.entries(contagem)
    .sort((a, b) => b[1].quantidade - a[1].quantidade)
    .slice(0, 3)
    .map(([palavra, info]) => ({
      palavra,
      sentimento: info.sentimento
    }));

  console.log("aqui: " + top3)

  return top3;
}
