import papermill as pm
import concurrent.futures
import boto3
from datetime import datetime, timedelta, timezone

# python3 -m pip install ipykernel
# python3 -m ipykernel install --user

nome_arquivo = None
def executar_notebook():
    pm.execute_notebook(
        '../../opt/jupyter/notebook/limpeza-camera-visao-comp.ipynb',
        '../../opt/jupyter/notebook/limpeza-camera-visao-comp-exec.ipynb',
        parameters=dict(nome_arquivo=nome_arquivo)
    )


client = boto3.client('s3')

last_time = datetime.strftime(datetime.now(timezone.utc) - timedelta(minutes=5), "%Y-%m-%d %H:%M:%S")

pag = client.get_paginator('list_objects_v2')
page_it = pag.paginate(Bucket="bucket-raw-upa-connect-eduardo")
filtered = page_it.search(f"Contents[?to_string(LastModified)>='\"{last_time}\"'].Key")

for page in filtered:
    nome_arquivo = page
    break

if nome_arquivo != None:
    timeout_global = 300

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        futuro = executor.submit(executar_notebook)
        try:
            resultado = futuro.result(timeout=timeout_global)
            print("Notebook executado com sucesso!")
        except concurrent.futures.TimeoutError:
            print("erro ao executar o jupyter notebook")