/**
 * @OnlyCurrentDoc
 * Função para gerar um gráfico de dispersão no dashboard com tooltips e interatividade (preparação para interatividade).
 * Os dados são lidos da planilha "OximetriaPaciente" (a partir da coluna I),
 * filtrados por uma UPA específica, e preparados na planilha de apoio "DadosGraficoDashboard".
 * O gráfico exibirá a relação entre Temperatura Média e Oximetria Média dos pacientes,
 * mostrando detalhes do paciente no tooltip ao passar o mouse e exibindo informações
 * em uma célula do dashboard ao clicar em um ponto (a parte de clique requer configuração adicional
 * fora deste script para ser totalmente funcional em um dashboard do Looker Studio/Data Studio).
 */

// Variáveis globais para todos arquivos .gs
let ss;
let DASHBOARD_SHEET_NAME;
let dashboardSheet;
let UPA_SHEET_NAME;
let upaSheet;
let nomeUpaEscolhida;
let dataEscolhida;
let idUpaSelecionada;

// Adicione as variáveis globais para a nuvem de palavras aqui, se preferir mantê-las em main.gs
// let ANALIZADOR_LEXICO_SHEET_NAME; // Já está no NuvemDePalavras.gs
// let analizadorLexicoSheet;        // Já está no NuvemDePalavras.gs

// Inicialização das variáveis globais
function inicializarVariaveis() {
  ss = SpreadsheetApp.getActiveSpreadsheet();
  DASHBOARD_SHEET_NAME = "Dashboard";
  dashboardSheet = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  UPA_SHEET_NAME = "UPA";
  upaSheet = ss.getSheetByName(UPA_SHEET_NAME);

  // Chame a inicialização da nuvem de palavras aqui
  inicializarVariaveisNuvemDePalavras();
}

function onOpen() {
  inicializarVariaveis();

  const ui = SpreadsheetApp.getUi();
  // Cria um novo menu chamado "Dashboard"
  ui.createMenu('Dashboard')
      // Adiciona um item ao menu que chama a função 'abrirDashboard'
      .addItem('Abrir Dashboard', 'abrirDashboard')
      // Adiciona o menu à interface do usuário
      .addToUi();
}

/**
 * Abre uma janela temporária (que pode ser grande por padrão) para detectar o tamanho real da janela do navegador.
 * Esta função é o ponto de entrada inicial.
 */
function abrirDashboard() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('ScreenSizeDetector')
      .setTitle('Detectando Tamanho da Tela...');
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Carregando ...');
}

/**
 * Recebe as dimensões da janela do navegador (reportadas pelo ScreenSizeDetector) e abre o dashboard principal.
 * Esta função é chamada pelo JavaScript dentro de 'ScreenSizeDetector.html'.
 * @param {number} width A largura da janela do navegador do usuário em pixels.
 * @param {number} height A altura da janela do navegador do usuário em pixels.
 */
function openDashboardWithDynamicSize(width, height) {
  // Ajusta as dimensões para usar 90% da largura e altura da tela para o dashboard principal
  const dashboardWidth = Math.round(width * 10);
  const dashboardHeight = Math.round(height * 10);

  const html = HtmlService.createHtmlOutputFromFile('PopUpDashboard')
      .setWidth(dashboardWidth)
      .setHeight(dashboardHeight)
      .setTitle('Dashboard de Atendimentos'); // Título do seu dashboard
  SpreadsheetApp.getUi().showModalDialog(html, 'Dashboard de Atendimentos');
}

/**
 * Função auxiliar para fechar o diálogo atual.
 * Usado pelo ScreenSizeDetector.html para fechar a si mesmo.
 */
function closeDialog() {
  // Esta função é uma forma de sinalizar ao cliente que pode fechar o diálogo.
  // No caso de showModalDialog, o cliente precisará fechar a janela do navegador.
  // Para sidebars ou dialogs sem showModalDialog, você pode usar:
  // google.script.host.close();
  // Para showModalDialog, o usuário precisará fechar a janela manualmente ou o script irá abrir uma nova por cima.
  // A melhor prática é que o ScreenSizeDetector.html se feche após enviar os dados.
}

/**
 * Retorna uma lista de nomes de UPAs da planilha "UPA".
 * @returns {Array<string>} Uma lista de nomes de UPA.
 */
function getListaUpas() {
  Logger.log("getListaUpas() chamada.");
  if (!upaSheet) {
    inicializarVariaveis();
  }

  if (!upaSheet) {
    Logger.log("getListaUpas(): upaSheet ainda é nulo após inicialização. Impossível ler dados.");
    return [];
  }
  Logger.log("Aba UPA encontrada: " + upaSheet.getName());

  // Assume que os NOMES das UPAs estão na COLUNA B da sua planilha "UPA", a partir da linha 2.
  // Ajuste "B2:B" se a coluna for diferente.
  const rangeToReadNames = "B2:B";
  const rangeToReadIds = "A2:A";
  Logger.log("Tentando ler o range de nomes: " + rangeToReadNames + " da planilha '" + UPA_SHEET_NAME + "'.");

  let nomesUpas;
  let idsUpas;
  try {
    // .flat() transforma [[nome1], [nome2]] em [nome1, nome2]
    // .filter(String) remove valores nulos/undefined antes de .trim()
    nomesUpas = upaSheet.getRange(rangeToReadNames).getValues().flat().filter(String);
    idsUpas = upaSheet.getRange(rangeToReadIds).getValues().flat().filter(Number);

    Logger.log("Nomes de UPAs brutos lidos: " + JSON.stringify(nomesUpas));
  } catch (e) {
    Logger.log("ERRO ao ler os nomes das UPAs do range " + rangeToReadNames + ": " + e.message);
    return [];
  }

  // Filtra por valores que não sejam vazios ou apenas espaços em branco
  const filteredNames = nomesUpas.map(name => String(name).trim()).filter(name => name !== "");
  const filteredIds = idsUpas.map(id => Number(id)).filter(id => id !== 0);

  let upas = []
  for(let i = 0; i < filteredNames.length; i++) {
    upas.push({
      id: filteredIds[i],
      nome: filteredNames[i],
    })
  }

  Logger.log("Nomes de UPAs formatados para retorno: " + JSON.stringify(upas));
  // return filteredNames;
  return upas;
}

// --- Nova Função em main.gs para Buscar o ID pelo Nome ---
/**
 * Busca o ID de uma UPA dado o seu nome, na planilha "UPA".
 * @param {string} nomeUpa O nome da UPA a ser buscada.
 * @returns {number|null} O ID da UPA ou null se não encontrada.
 */
function getUpaIdByName(nomeUpa) {
  Logger.log("getUpaIdByName() chamada para nome: " + nomeUpa);
  if (!upaSheet) {
    inicializarVariaveis();
  }

  if (!upaSheet) {
    Logger.log("getUpaIdByName(): upaSheet é nulo. Impossível buscar ID.");
    return null;
  }

  // Assume que os IDs das UPAs estão na COLUNA A e os NOMES na COLUNA B da sua planilha "UPA".
  // Ajuste "A2:B" se as colunas forem diferentes ou a linha inicial.
  const allUpaDataRange = "A2:B";
  Logger.log("Tentando ler dados completos da UPA para busca de ID do range: " + allUpaDataRange);

  let upaData;
  try {
    upaData = upaSheet.getRange(allUpaDataRange).getValues();
    Logger.log("Dados completos da UPA para busca de ID lidos: " + JSON.stringify(upaData));
  } catch (e) {
    Logger.log("ERRO ao ler dados da UPA para busca de ID do range " + allUpaDataRange + ": " + e.message);
    return null;
  }

  let idUpaSelecionada = null;

  for (let i = 0; i < upaData.length; i++) {
    const row = upaData[i];
    // row[0] deve ser o ID, row[1] deve ser o Nome
    const id = row[0];
    const nome = row[1];

    // Compara os nomes (removendo espaços extras para maior tolerância)
    if (String(nome).trim() === String(nomeUpa).trim()) {
      idUpaSelecionada = id;
      Logger.log("ID encontrado para UPA '" + nomeUpa + "': " + idUpaSelecionada);
      break;
    }
  }

  if (!idUpaSelecionada) {
    Logger.log('ID para UPA selecionada "' + nomeUpa + '" não encontrado na planilha.');
  }
  return idUpaSelecionada;
}

// Função para iniciar os serviços do WebApp
function doGet() {
  return HtmlService.createHtmlOutputFromFile('PopUpDashboard'); // PopUpDashboard.html
}

/**
 * Funções 'getChartData' e 'selecionarUpaEData' do seu PopUp.gs original
 * não são mais necessárias aqui da mesma forma, pois a lógica foi movida/adaptada
 * para 'getScatterChartDataForUpaAndDate' e o HTML.
 */

// Se você ainda precisar de 'getChartData' para outros gráficos, considere renomeá-la
// ou torná-la mais genérica e adaptável.
// function getChartData() { ... }