import mysql.connector
import csv
import base64
import sys

##########################     ATENÇÃO       ########################
#Para executar este script, veja se você está com o terminal aberto dentro do diretório dados_para_tratar
#depois execute o comando: python exportar_paciente_csv.py py

# --- Configurações do Banco de Dados ---
# ATENÇÃO: Substitua os placeholders com suas credenciais do MySQL
DB_CONFIG = {
    'host': 'localhost',       # Ex: 'localhost' ou o IP do seu servidor MySQL
    'database': 'upa_connect', # Ex: 'upa_connect'
    'user': 'admin_upa_connect',          # Ex: 'root'
    'password': 'urubu100'         # Sua senha do MySQL
}

# --- Nome do Arquivo de Saída ---
# O arquivo será salvo no diretório de execução do script.
OUTPUT_CSV_FILE = 'paciente.csv' 

def export_paciente_table_to_csv():
    """
    Conecta-se ao banco de dados MySQL, busca os dados da tabela 'paciente'
    e exporta para um arquivo CSV, decodificando a biometria de Base64 para texto.
    """
    conn = None
    cursor = None
    try:
        print("Conectando ao banco de dados MySQL...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Conexão bem-sucedida.")

        # Consulta SQL para selecionar todos os dados da tabela 'paciente'.
        # Usamos TO_BASE64() para converter o BLOB 'biometria' em uma string Base64.
        # Posteriormente, no Python, essa string Base64 será decodificada para o texto original.
        #
        # A biometria é a 5ª coluna. As colunas antes dela na sua tabela são:
        # id_paciente, nome, cpf, data_nascimento
        query = "SELECT id_paciente, nome, cpf, data_nascimento, TO_BASE64(biometria) AS biometria FROM paciente"
        
        print(f"Executando consulta SQL: {query}")
        cursor.execute(query)

        # Obter os nomes das colunas
        column_names = [col[0] for col in cursor.description]
        print(f"Colunas encontradas: {column_names}")

        print(f"Escrevendo dados para '{OUTPUT_CSV_FILE}'...")
        with open(OUTPUT_CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            csv_writer.writerow(column_names) # Escrever cabeçalho

            # O índice da coluna 'biometria' (5ª coluna, portanto índice 4 em Python)
            biometria_col_index = 4 

            for row in cursor:
                row_list = list(row) # Converte a tupla para uma lista mutável

                # Decodificar a biometria de Base64 para uma string de texto
                # Primeiro, verificamos se o valor não é None e se é uma string (já que TO_BASE64() retorna string)
                if row_list[biometria_col_index] is not None and isinstance(row_list[biometria_col_index], str):
                    try:
                        # Decodifica a string Base64 para bytes
                        decoded_bytes = base64.b64decode(row_list[biometria_col_index].encode('utf-8'))
                        # Decodifica os bytes para a string original, substituindo erros
                        row_list[biometria_col_index] = decoded_bytes.decode('utf-8', errors='replace')
                    except Exception as e:
                        # Em caso de erro na decodificação (ex: não é um Base64 válido),
                        # mantém o valor original ou define como vazio/erro.
                        sys.stderr.write(f"Erro ao decodificar Base64 para biometria '{row_list[biometria_col_index]}': {e}\n")
                        row_list[biometria_col_index] = "" # Ou mantenha o valor Base64 ou defina como None/''
                
                csv_writer.writerow(row_list) # Escrever a linha com a biometria decodificada
        
        print(f"Dados exportados com sucesso para '{OUTPUT_CSV_FILE}'.")

    except mysql.connector.Error as err:
        print(f"Erro ao conectar ou consultar o MySQL: {err}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("Conexão com o banco de dados fechada.")

if __name__ == "__main__":
    export_paciente_table_to_csv()
