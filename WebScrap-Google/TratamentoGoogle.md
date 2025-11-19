# Explicação Detalhada da Coleta e Tratamento de Dados - Avaliações do Google

Este documento descreve passo a passo o processo completo de coleta e tratamento de dados de avaliações de UPAs do Google Maps. O processo está dividido em dois notebooks principais:
- `ColetaAvaliacoesGoogle.ipynb` - Coleta dos dados via API Apify
- `TratativaAvaliacoesGoogle.ipynb` - Tratamento e limpeza dos dados com PySpark

---

## PARTE 1: COLETA DE DADOS (ColetaAvaliacoesGoogle.ipynb)

### 1. Instalação de Dependências e Configuração Inicial

- **O que foi feito:** Instalação das bibliotecas necessárias para a coleta e upload dos dados.
- **Detalhes Técnicos:**
    - Bibliotecas instaladas: `apify-client`, `boto3` e `pandas`
    - `apify-client`: para interagir com a API do Apify e coletar avaliações do Google Maps
    - `boto3`: cliente AWS para realizar upload dos dados para o S3
    - `pandas`: para manipulação e estruturação dos dados coletados

### 2. Coleta de Avaliações via API Apify

- **O que foi feito:** Configuração e execução do actor Apify para coletar avaliações de 34 UPAs da cidade de São Paulo.
- **Detalhes Técnicos:**
    - Inicialização do cliente Apify com token de autenticação
    - Configuração do actor com parâmetros:
        - `language`: "pt-BR" (português brasileiro)
        - `maxReviews`: 100 (até 100 avaliações por UPA)
        - `personalData`: False (não coletar dados pessoais)
        - `startUrls`: lista com 34 URLs do Google Maps de diferentes UPAs
    - Execução do actor `Xb8osYTtOjlsgI6k9` e aguardo da conclusão
    - Coleta dos resultados do dataset gerado pela execução

### 3. Processamento e Limpeza Inicial dos Dados

- **O que foi feito:** Tratamento inicial dos dados coletados para preparação do CSV.
- **Detalhes Técnicos:**
    - Conversão dos itens da API para lista Python
    - Definição dos campos/headers do CSV: `address`, `city`, `location`, `neighborhood`, `postalCode`, `publishedAtDate`, `reviewOrigin`, `reviewsCount`, `scrapedAt`, `stars`, `state`, `street`, `text`, `title`, `totalScore`
    - Limpeza do campo `text` (avaliação):
        - Remoção de quebras de linha (`\n` e `\r`)
        - Remoção de aspas duplas (`"`)
        - Substituição por espaços simples para manter legibilidade

### 4. Salvamento Local e Upload para S3

- **O que foi feito:** Salvamento do arquivo CSV localmente e upload automático para o bucket S3.
- **Detalhes Técnicos:**
    - Criação do arquivo `reviewsTeste.csv` localmente
    - Utilização do `csv.DictWriter` para escrever os dados com encoding UTF-8
    - Configuração do cliente S3 via `boto3`
    - Upload do arquivo para o bucket `bucket-raw-upa-connect-otavio`
    - Nome do arquivo no S3: `reviews-teste.csv`
    - Tratamento de exceções para credenciais AWS e erros de upload

---

## PARTE 2: TRATAMENTO DE DADOS (TratativaAvaliacoesGoogle.ipynb)

### 1. Configuração do Ambiente Spark e Carregamento dos Dados

- **O que foi feito:** Configuração do ambiente Spark para interagir com o serviço de armazenamento AWS S3 e carregar os dados brutos coletados.
- **Detalhes Técnicos:**
    - Criação de uma sessão Spark com dependências para acesso ao S3 (`hadoop-aws:3.3.4` e `aws-java-sdk-bundle:1.11.901`)
    - Configuração de credenciais AWS via `InstanceProfileCredentialsProvider`
    - Leitura do arquivo CSV `reviews-teste.csv` do bucket S3 `s3a://bucket-raw-upa-connect-otavio/`
    - Configuração de opções de leitura: delimitador vírgula, header true, e reconhecimento de valores nulos
    - Resultado armazenado no DataFrame `TabelaCompleta`

### 2. Reorganização e Tradução das Colunas

- **O que foi feito:** As colunas do DataFrame original foram selecionadas, renomeadas para o português e reordenadas para facilitar a compreensão e o manuseio dos dados.
- **Detalhes Técnicos:**
    - Utilização da função `select()` para escolher as colunas de interesse
    - Utilização da função `alias()` para renomear cada coluna para português
    - Mapeamento de colunas:
        - `title` → `Nome_Upa`
        - `reviewsCount` → `Contagem_Avaliacoes`
        - `totalScore` → `Pontuacao_Total`
        - `city` → `Cidade`
        - `state` → `Estado`
        - `neighborhood` → `Bairro`
        - `street` → `Rua`
        - `postalCode` → `CEP`
        - `reviewOrigin` → `Origem_Avaliacao`
        - `scrapedAt` → `Data_Coleta`
        - `publishedAtDate` → `Data_Publicacao_Avaliacao`
        - `text` → `Texto_Avaliacao`
        - `stars` → `Estrelas`
    - O novo DataFrame com a estrutura ajustada foi salvo como `TabelaOrganizada`

### 3. Conversão de Tipos de Dados (Tipagem)

- **O que foi feito:** Os tipos de dados de várias colunas foram corrigidos para garantir a consistência e permitir cálculos e formatações corretas.
- **Detalhes Técnicos:**
    - Importação de tipos específicos do PySpark: `IntegerType`, `DoubleType`
    - Conversão de colunas numéricas:
        - `Contagem_Avaliacoes` → `IntegerType()` (número inteiro)
        - `Estrelas` → `IntegerType()` (número inteiro)
        - `Pontuacao_Total` → `DoubleType()` (número decimal de ponto flutuante)
    - Conversão e formatação de colunas de data/hora:
        - Conversão inicial com `to_timestamp()` para reconhecer os formatos de data originais
        - Formatação com `date_format()` para o padrão ISO 8601: `yyyy-MM-dd'T'HH:mm:ss`
        - Aplicado em: `Data_Coleta` e `Data_Publicacao_Avaliacao`
    - Verificação do schema com `printSchema()` para validar as conversões
    - O DataFrame resultante foi nomeado `TabelaTipada`

### 4. Tratamento de Valores Nulos

- **O que foi feito:** Identificação e tratamento de valores nulos na coluna de texto das avaliações.
- **Detalhes Técnicos:**
    - Utilização da função `fillna()` do PySpark para substituir valores nulos
    - Valores `null` na coluna `Texto_Avaliacao` foram substituídos pela string padrão: `"Avaliação não preenchida"`
    - Esta padronização garante que análises posteriores não sejam afetadas por dados faltantes
    - O DataFrame atualizado foi salvo como `TabelaSemNulos`
    - Exibição dos dados com `show()` para validação do tratamento

### 5. Padronização de Texto (Remoção de Acentos e Conversão para Maiúsculas)

- **O que foi feito:** Padronização completa dos dados textuais para garantir consistência e facilitar análises futuras.
- **Detalhes Técnicos:**
    - **Criação da função customizada `remover_acentos`:**
        - Importação do módulo `unicodedata` do Python
        - A função normaliza o texto usando `unicodedata.normalize('NFKD', texto)`
        - Separação dos caracteres base de seus acentos/diacríticos
        - Remoção dos caracteres combinados (acentos) mantendo apenas caracteres ASCII
        - Tratamento de valores `None` para evitar erros
    - **Registro como UDF (User-Defined Function):**
        - Função Python convertida em UDF do Spark com `udf(remover_acentos, StringType())`
        - Permite aplicação em larga escala nos DataFrames
    - **Aplicação em colunas de texto:**
        - Lista de colunas alvo: `Nome_Upa`, `Cidade`, `Estado`, `Bairro`, `Rua`, `Texto_Avaliacao`
        - Loop iterativo aplicando duas transformações sequenciais:
            1. Remoção de acentos com a UDF `remover_acentos_udf`
            2. Conversão para maiúsculas com a função `upper()` do PySpark
    - Exibição do resultado com `show()` para verificação da padronização

### 6. Padronização dos Nomes das UPAs

- **O que foi feito:** Tratamento complexo e completo dos nomes das UPAs que apresentavam diversas variações e inconsistências.
- **Detalhes Técnicos:**
    
    **PASSO 1 - Substituições Completas (Casos Específicos):**
    - Utilização da função `when()` do PySpark para mapeamento de casos específicos
    - Substituições realizadas:
        - `"PRONTO SOCORRO MUNICIPAL DA LAPA"` → `"UPA LAPA - PROF. JOÃO CATARIN MEZOMO"`
        - `"UPA MOOCA"` → `"UPA MOOCA - DOM PAULO EVARISTO ARNS"`
        - `"UPA PERUS"` → `"UPA PERUS - DR. LUIZ ANTONIO DE ABREU SAMPAIO DORIA"`
        - `"UPA SANTO AMARO"` → `"UPA SANTO AMARO - DR JOSÉ SYLVIO DE CAMARGO"`
        - `"UPA TATUAPE"` → `"UPA TATUAPE - WALDEMAR ROSSI"`
        - `"UPA VILA MARIA"` → `"UPA VILA MARIA - DR JOSE MAURO DEL ROIO CORREA"`
        - `"UPA VILA MARIANA - UNIDADE DE PRONTO ATENDIMENTO"` → `"UPA VILA MARIANA"`
        - `"UPA - CAMPO LIMPO"` → `"UPA CAMPO LIMPO - DR FERNANDO MAURO PROENÇA DE GOUVEA"`
        - Nomes contendo `"AMA / UBS INTEGRADA"` → `"UPA JARDIM ICARAI QUINTANA"`
    - Uso de `.otherwise(col("Nome_Upa"))` para manter valores não mapeados
    
    **PASSO 2 - Lista de Regras de Limpeza (Substituições Parciais):**
    - Definição de tuplas com padrões a serem removidos ou substituídos:
        - `" III"` → `""` (remove numeração romana)
        - `"UPA -"` → `"UPA"` (padroniza hífen)
        - `"/UBS"` → `""` (remove referência a UBS)
        - `"CARRAO - "` → `"CARRAO "` (padroniza espaçamento)
        - `" - SANTA MARCELINA"` → `""` (remove nome da entidade gestora)
        - `" - EMERGENCY CARE UNIT"` → `""` (remove tradução em inglês)
    
    **PASSO 3 - Aplicação Sequencial com `reduce()`:**
    - Importação da função `reduce` do módulo `functools`
    - Uso de `reduce()` para aplicar todas as regras de limpeza cumulativamente
    - Função `regexp_replace()` aplicada iterativamente sobre o resultado do Passo 1
    - Cada iteração aplica uma regra de substituição
    
    **PASSO 4 - Aplicação Final e Ordenação:**
    - Sobrescrita da coluna `Nome_Upa` com o resultado das transformações
    - Aplicação de `trim()` para remover espaços extras no início e fim
    - Ordenação do DataFrame pela coluna `Nome_Upa` em ordem ascendente (A-Z) com `.orderBy(col("Nome_Upa").asc())`
    - O DataFrame padronizado foi salvo como `TabelaFinal`
    
    **Validação:**
    - Exibição dos nomes ANTES da padronização com `distinct().show(n=100)`
    - Exibição dos nomes DEPOIS da padronização para verificação visual
    - Visualização completa dos dados com `show()`

### 7. Remoção de Ponto e Vírgula de Todas as Colunas de Texto

- **O que foi feito:** Limpeza adicional para remover caracteres de ponto e vírgula (`;`) que poderiam causar problemas na exportação CSV.
- **Detalhes Técnicos:**
    - **Identificação automática de colunas de texto:**
        - Iteração sobre `TabelaFinal.schema.fields` para acessar metadados das colunas
        - Filtragem de colunas do tipo `StringType` usando `isinstance(campo.dataType, StringType)`
        - Criação de lista `string_cols` com os nomes de todas as colunas de texto
    - **Aplicação da limpeza:**
        - Loop iterativo por todas as colunas de texto identificadas
        - Uso de `regexp_replace(col(nome_coluna), ";", "")` para substituir `;` por string vazia
        - Atualização cumulativa do DataFrame `TabelaFinal`
    - **Validação:**
        - Busca por linhas que ainda contenham `;` na coluna `Texto_Avaliacao`
        - Uso de `filter(col("Texto_Avaliacao").contains(";"))` para verificação
        - Exibição das colunas `Nome_Upa`, `Data_Publicacao_Avaliacao`, `Texto_Avaliacao` para identificação
    - Esta etapa garante que o CSV final não tenha problemas de delimitação

### 8. Salvamento do DataFrame Tratado no S3

- **O que foi feito:** Após todas as transformações, o DataFrame final e completamente limpo foi salvo de volta no S3, em um bucket destinado a dados tratados (trusted zone).
- **Detalhes Técnicos:**
    - **Configuração do caminho de destino:**
        - Bucket: `s3a://bucket-trusted-upa-connect-otavio/`
        - Diretório: `avaliacoes-google-tratadas`
        - Caminho completo: `s3a://bucket-trusted-upa-connect-otavio/avaliacoes-google-tratadas`
    - **Configurações de gravação:**
        - `coalesce(1)`: consolida os dados em um único arquivo CSV (em vez de múltiplos arquivos particionados)
        - `.write.mode("overwrite")`: sobrescreve dados existentes no diretório se houver
        - `.option("header", "true")`: inclui linha de cabeçalho com nomes das colunas
        - `.option("delimiter", ";")`: define ponto e vírgula como delimitador (padrão brasileiro)
        - `.csv()`: formato de saída CSV
    - **Vantagens da abordagem:**
        - Arquivo único facilita consumo por ferramentas de BI e análise
        - Delimitador `;` é mais compatível com Excel e sistemas brasileiros
        - Modo overwrite garante que sempre temos a versão mais atualizada
        - Header facilita identificação das colunas em ferramentas externas
    - Mensagem de confirmação impressa após conclusão da gravação

---

## Resumo do Pipeline Completo

**COLETA:**
1. Configuração da API Apify
2. Coleta de até 100 avaliações de 34 UPAs de São Paulo
3. Limpeza inicial (remoção de quebras de linha e aspas)
4. Salvamento local e upload para bucket RAW no S3

**TRATAMENTO:**
1. Carregamento dos dados do bucket RAW
2. Reorganização e tradução de colunas para português
3. Conversão de tipos de dados (inteiros, decimais, datas)
4. Tratamento de valores nulos
5. Padronização de texto (remoção de acentos e conversão para maiúsculas)
6. Padronização complexa dos nomes das UPAs
7. Remoção de ponto e vírgula de todas as colunas de texto
8. Salvamento final no bucket TRUSTED no S3

**Resultado:** Dados limpos, padronizados e prontos para análise e consumo por dashboards do Grafana.
