Passos para subir os recursos corretamente:

- Crie uma chave PEM dentro do console da AWS 
    - EC2 > Pares de chaves

- Com a chave criada, coloque o nome dela no parâmetro `Ec2KeyPairName`, dentro do arquivo jupyerfinal.yaml

- Altere o nome dos buckets

- Comente os seguinte recursos:
    - LambdaInputData, SensorDataTable, RestApi, IoTDataResource, PostMethod, RestApiDeploy, LambdaProcessorDynamo, EventBridgeScheduler

- Rode o comando
```
aws cloudformation create-stack --stack-name arquitetura-upa-atualizada --template-body file://jupyterfinal.yaml
```

- Vá no console em **Cloudformation** > **Pilhas** e verifique se a stack está com o status **CREATE_COMPLETE**

- Dentro do **scheduler.py**, altera o valor da variável `S3_BUCKET`, colocando o nome do seu bucket raw
- Faça o zip dos dois arquivos python: **index.py** e **scheduler.py**
    - os zips devem estar com o nome **index.zip** e **scheduler.zip** 

- Suba esses dois arquivos zip dentro do seu bucket RAW

- Descomente os recursos comentados anteriormente

- Atualize a stack com o comando abaixo:
```
aws cloudformation update-stack --stack-name arquitetura-upa-atualizada --template-body file://jupyterfinal.yaml
```

- Vá no console em **Cloudformation** > **Pilhas** e verifique se a stack está com o status **UPDATE_COMPLETE**




