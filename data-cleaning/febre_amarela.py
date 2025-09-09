import pandas as pd

file_path = "file_path"

df = pd.read_csv(file_path, sep=';', encoding='latin-1', low_memory=False)

colunas_desejadas = ['ID', 'UF_LPI', 'MUN_LPI', 'SEXO', 'IDADE', 'DT_IS', 'ANO_IS', 'OBITO', 'DT_OBITO']
df_limpo = df[colunas_desejadas]

df_limpo = df_limpo[df_limpo['UF_LPI'] == 'SP']

# Converter colunas para valores numéricos
df_limpo['ID'] = pd.to_numeric(df_limpo['ID'], errors='coerce')
df_limpo['IDADE'] = pd.to_numeric(df_limpo['IDADE'], errors='coerce')
df_limpo['ANO_IS'] = pd.to_numeric(df_limpo['ANO_IS'], errors='coerce')

# Remove qualquer linha que tenha pelo menos um valor nulo em qualquer coluna
df_limpo = df_limpo.dropna(how='any')

df_limpo.to_csv("fa_casoshumanos_SP_clean.csv", index=False, sep=';', encoding='latin-1')

print("Arquivo limpo salvo como: fa_casoshumanos_SP_clean.csv")
