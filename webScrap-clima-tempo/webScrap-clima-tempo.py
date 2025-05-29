import requests
from datetime import date
import calendar
import json
import boto3

def pegar_historico_mensal_json_enviar_s3(latitude, longitude, bucket_name, s3_key):
    hoje = date.today()
    ano = hoje.year
    mes_atual = hoje.month

    historico = {}

    for mes in range(1, mes_atual):
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia = date(ano, mes, calendar.monthrange(ano, mes)[1])

        url = (
            f'https://archive-api.open-meteo.com/v1/archive'
            f'?latitude={latitude}&longitude={longitude}'
            f'&start_date={primeiro_dia}&end_date={ultimo_dia}'
            f'&daily=temperature_2m_min,temperature_2m_max'
            f'&timezone=America%2FSao_Paulo'
        )

        resposta = requests.get(url)
        if resposta.status_code != 200:
            print(f'Erro ao acessar a API para o mês {mes:02d}.')
            continue

        dados = resposta.json()
        dias = dados['daily']['time']
        temp_min = dados['daily']['temperature_2m_min']
        temp_max = dados['daily']['temperature_2m_max']

        nome_mes = primeiro_dia.strftime("%B")
        historico[nome_mes] = []

        for i in range(len(dias)):
            minima = temp_min[i]
            maxima = temp_max[i]
            media = round((minima + maxima) / 2, 1)

            historico[nome_mes].append({
                "data": dias[i],
                "temperatura_minima": minima,
                "temperatura_maxima": maxima,
                "temperatura_media": media
            })

    json_conteudo = json.dumps(historico, indent=4, ensure_ascii=False)

    s3 = boto3.client('s3')
    try:
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json_conteudo.encode('utf-8'),
            ContentType='application/json'
        )
        print(f"✅ JSON enviado com sucesso para s3://{bucket_name}/{s3_key}")
    except Exception as e:
        print(f"Erro ao enviar para o S3: {e}")


# bucket_name: substitua pelo nome do seu bucket
pegar_historico_mensal_json_enviar_s3(
    latitude=-23.55,
    longitude=-46.63,
    bucket_name='bucket_name',
    s3_key='historico_2025.json'
)
