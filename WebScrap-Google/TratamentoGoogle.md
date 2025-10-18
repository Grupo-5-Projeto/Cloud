# Explicação Detalhada do Tratamento de Dados - Avaliações do Google

Este documento descreve passo a passo o processo de tratamento e limpeza dos dados de avaliações de UPAs, coletados do Google. O processo foi implementado no notebook `TratativaAvaliacoesGoogle.ipynb` utilizando PySpark.

## 1. Configuração do Ambiente e Carregamento dos Dados

- **O que foi feito:** A primeira etapa consiste em configurar o ambiente Spark para interagir com o serviço de armazenamento AWS S3 e carregar os dados brutos.
- **Detalhes Técnicos:**
    - Uma sessão Spark é inicializada com as dependências necessárias para acessar o S3 (`hadoop-aws` e `aws-java-sdk-bundle`).
    - Os dados são lidos de um arquivo CSV localizado no bucket S3 `s3a://bucket-raw-upa-connect-otavio/`.
    - O arquivo lido é o `reviews-teste.csv`.
    - O resultado é um DataFrame chamado `TabelaCompleta`.

## 2. Reorganização e Tradução das Colunas

- **O que foi feito:** As colunas do DataFrame original foram selecionadas, renomeadas para o português e reordenadas para facilitar a compreensão e o manuseio.
- **Detalhes Técnicos:**
    - A função `select()` foi utilizada para escolher as colunas de interesse.
    - A função `alias()` foi usada para renomear cada coluna. Por exemplo, `title` foi renomeada para `Nome_Upa` e `reviewsCount` para `Contagem_Avaliacoes`.
    - O novo DataFrame com a estrutura ajustada foi salvo como `TabelaOrganizada`.

## 3. Conversão de Tipos de Dados (Tipagem)

- **O que foi feito:** Os tipos de dados de várias colunas foram corrigidos para garantir a consistência e permitir cálculos e formatações corretas.
- **Detalhes Técnicos:**
    - Colunas numéricas como `Contagem_Avaliacoes` e `Estrelas` foram convertidas para o tipo `Integer` (inteiro).
    - A coluna `Pontuacao_Total` foi convertida para `Double` (número de ponto flutuante).
    - As colunas de data (`Data_Coleta` e `Data_Publicacao_Avaliacao`) foram padronizadas para o formato de string ISO 8601 `yyyy-MM-dd'T'HH:mm:ss`.
    - O DataFrame resultante foi nomeado `TabelaTipada`.

## 4. Tratamento de Valores Nulos

- **O que foi feito:** Foi verificado que a coluna de texto das avaliações (`Texto_Avaliacao`) continha valores nulos. Esses valores foram substituídos por um texto padrão.
- **Detalhes Técnicos:**
    - A função `fillna()` foi aplicada para substituir os valores `null` na coluna `Texto_Avaliacao` pela string "Avaliação não preenchida".
    - O DataFrame atualizado foi salvo como `TabelaSemNulos`.

## 5. Padronização de Texto

- **O que foi feito:** Para garantir a consistência nos dados textuais, todos os acentos foram removidos e os textos foram convertidos para letras maiúsculas.
- **Detalhes Técnicos:**
    - Uma função customizada (`remover_acentos`) foi criada e registrada como uma UDF (User-Defined Function) no Spark.
    - Essa função foi aplicada em um loop a todas as colunas de texto relevantes (`Nome_Upa`, `Cidade`, `Estado`, `Bairro`, `Rua`, `Texto_Avaliacao`).
    - Em seguida, a função `upper()` do Spark foi usada para converter todo o texto para caixa alta.

## 6. Padronização dos Nomes das UPAs

- **O que foi feito:** Os nomes das UPAs (`Nome_Upa`) apresentavam diversas variações. Foi realizado um tratamento complexo para padronizá-los.
- **Detalhes Técnicos:**
    - **Substituições Específicas:** Nomes que precisavam de uma troca completa foram mapeados usando a função `when()`. Por exemplo, "PRONTO SOCORRO MUNICIPAL DA LAPA" foi substituído por "UPA LAPA - PROF. JOÃO CATARIN MEZOMO".
    - **Limpeza Geral:** Termos e abreviações indesejados (como " III", "/UBS", " - SANTA MARCELINA") foram removidos de todos os nomes usando a função `regexp_replace()` de forma encadeada.
    - **Remoção de Espaços:** A função `trim()` foi usada ao final para remover espaços em branco no início e no fim dos nomes.
    - O DataFrame com os nomes padronizados foi salvo como `TabelaFinal`.

## 7. Salvamento do DataFrame Tratado

- **O que foi feito:** Após todas as transformações, o DataFrame final e limpo foi salvo de volta no S3, em um local destinado a dados tratados.
- **Detalhes Técnicos:**
    - O DataFrame `TabelaFinal` foi salvo no formato CSV.
    - O caminho de destino foi o bucket `s3a://bucket-trusted-upa-connect-otavio/`, no diretório `avaliacoes-google-tratadas`.
    - O modo de salvamento utilizado foi `overwrite`, que substitui os dados existentes se o diretório já existir.
    - O delimitador do novo arquivo CSV foi definido como ponto e vírgula (`;`).
    - `coalesce(1)` foi usado para garantir que a saída seja um único arquivo CSV, facilitando o consumo por outras ferramentas.
