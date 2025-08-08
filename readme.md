Para encontrar o nome da sua stack:
Pesquise por **Cloudformation** >  **Pilhas**

comando para subir cloudformation:
```
    1. Colocar a credencial da AWS na pasta .aws
    
    2. Criar par de chaves (EC2 -> par de chaves -> urubu100-key e colocar no seu repositório CLOUD)

    3. Primeira vez criando a stack?
    aws cloudformation create-stack --stack-name <nome-da-stack> --template-body file://./jupyterfinal.yaml

    4. Atualizando a stack?
    aws cloudformation update-stack --stack-name <nome-da-stack> --template-body file://./jupyterfinal.yaml 
```