from pyspark import SparkConf
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, upper, translate, when
from pyspark.sql.types import IntegerType

# =======================================================================
# 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO SPARK
# =======================================================================
conf = SparkConf()
conf.set(
    "spark.jars.packages",
    "org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.11.901"
)
conf.set(
    "spark.hadoop.fs.s3a.aws.credentials.provider",
    "com.amazonaws.auth.InstanceProfileCredentialsProvider"
)

spark = SparkSession.builder.config(conf=conf).getOrCreate()

# Função para remover acentos de uma coluna
def remover_acentos(df, nome_coluna):
    acentos = "áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"
    sem_acentos = "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"
    return df.withColumn(nome_coluna, translate(col(nome_coluna), acentos, sem_acentos))

# =======================================================================
# 2. LEITURA DOS DADOS (UTF-8)
# =======================================================================
df_raw = spark.read.option('delimiter', ';') \
                     .option('header', 'true') \
                     .option('nullValue', 'null') \
                     .option('encoding', 'UTF-8') \
    .csv("s3a://bucket-trusted-upa-connect-teste/fa_casoshumanos_1994-2025.csv")

# =======================================================================
# 3. SELEÇÃO E LIMPEZA
# =======================================================================
colunas_desejadas = ['ID', 'UF_LPI', 'MUN_LPI', 'SEXO', 'IDADE', 'DT_IS', 'ANO_IS', 'OBITO', 'DT_OBITO']
df_limpo = df_raw.select(*colunas_desejadas)

# Substitui strings vazias por null nas colunas numéricas e converte para Integer
colunas_numericas = ['ID', 'IDADE', 'ANO_IS']
for c in colunas_numericas:
    df_limpo = df_limpo.withColumn(c, when(col(c) == "", None).otherwise(col(c)))
    df_limpo = df_limpo.withColumn(c, col(c).cast(IntegerType()))

# Remove linhas com nulos nas colunas críticas
colunas_para_verificar = ['ID', 'UF_LPI', 'MUN_LPI', 'SEXO', 'IDADE', 'DT_IS', 'ANO_IS', 'OBITO']
df_limpo = df_limpo.na.drop(subset=colunas_para_verificar)

# Filtra apenas UF_LPI = SP
df_limpo = df_limpo.filter(col("UF_LPI") == "SP")

# Converte colunas de texto para maiúsculas
colunas_maiusculas = ['UF_LPI', 'MUN_LPI', 'SEXO', 'OBITO']
for c in colunas_maiusculas:
    df_limpo = df_limpo.withColumn(c, upper(col(c)))

# =======================================================================
# 4. VALIDAÇÃO: se OBITO = SIM, DT_OBITO deve estar preenchida
# =======================================================================
# Linhas que serão removidas
linhas_invalidas = df_limpo.filter(
    (col("OBITO") == "SIM") & ((col("DT_OBITO").isNull()) | (col("DT_OBITO") == ""))
)

# Mostra os IDs dessas linhas
ids_invalidos = linhas_invalidas.select("ID").rdd.flatMap(lambda x: x).collect()
print(f"IDs removidos na validação OBITO: {ids_invalidos}")

# Contagem para log
linhas_removidas = linhas_invalidas.count()
print(f"Validação OBITO: {linhas_removidas} linhas removidas onde OBITO = SIM e DT_OBITO estava vazio ou nulo")

# Aplica o filtro para manter apenas linhas válidas
df_limpo = df_limpo.filter(
    (col("OBITO") != "SIM") | ((col("OBITO") == "SIM") & (col("DT_OBITO").isNotNull()) & (col("DT_OBITO") != ""))
)


# =======================================================================
# 5. ESCRITA NO BUCKET DESTINO (UTF-8)
# =======================================================================
output_path = "s3a://bucket-client-upa-connect-teste/fa_casoshumanos_1994-2025.csv"

df_limpo.coalesce(1).write \
       .option('delimiter', ';') \
       .option('header', 'true') \
       .option('encoding', 'UTF-8') \
       .mode('overwrite') \
       .csv(output_path)

print(f"Arquivo limpo salvo em: {output_path}")
