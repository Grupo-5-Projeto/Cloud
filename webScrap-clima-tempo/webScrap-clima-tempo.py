import requests
from datetime import date
import calendar
import json

def pegar_historico_mensal_json(latitude, longitude):
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

    with open("historico_temperatura.json", "w", encoding='utf-8') as f:
        json.dump(historico, f, indent=4, ensure_ascii=False)

    print("✅ Arquivo 'historico_temperatura.json' gerado com média incluída!")

# São Paulo: -23.55, -46.63
pegar_historico_mensal_json(-23.55, -46.63)
