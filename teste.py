import papermill as pm

pm.execute_notebook(
    '/opt/jupyter/notebook/limpeza-camera-visao-comp.ipynb',
    '/opt/jupyter/notebook/limpeza-camera-visao-comp-exec.ipynb',
    parameters=dict(nome_arquivo="visao_computacional.csv")
)