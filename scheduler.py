import boto3
import json
import datetime
from botocore.exceptions import ClientError

# Clientes AWS
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

# Configurações
TABLE_NAME = "SensorData"          # nome da tabela DynamoDB
S3_BUCKET = "raw-iot-data-edu"            # bucket de destino
S3_PREFIX = ""                # prefixo dentro do bucket (pode ser vazio)
FILE_EXTENSION = ".json"            # pode trocar para ".csv" se preferir

def lambda_handler(event, context):
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    file_key = f"{S3_PREFIX}{today}{FILE_EXTENSION}"

    # === 1. Buscar dados do DynamoDB do dia atual ===
    table = dynamodb.Table(TABLE_NAME)

    # Aqui assumo que você tem um atributo "data" na tabela em formato ,YYYY-MM-DD
    response = table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr("data").begins_with(today)
    )
    dynamo_items = response.get("Items", [])

    print(f"Registros encontrados no DynamoDB ({today}): {len(dynamo_items)}")

    # === 2. Verificar se arquivo já existe no S3 ===
    existing_data = []
    try:
        s3_response = s3.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content = s3_response["Body"].read().decode("utf-8")
        existing_data = json.loads(file_content)
        print(f"Arquivo {file_key} encontrado no S3. Registros existentes: {len(existing_data)}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            print(f"Arquivo {file_key} não existe. Criando novo.")
        else:
            raise

    # === 3. Reescrever com dados novos (pode sobrescrever ou concatenar) ===
    # Aqui vou sobrescrever com os dados do Dynamo
    final_data = dynamo_items  

    # Se quiser concatenar com os já existentes, use:
    # final_data = existing_data + dynamo_items

    # === 4. Salvar novamente no S3 ===
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=file_key,
        Body=json.dumps(final_data, ensure_ascii=False, indent=2),
        ContentType="application/json"
    )

    print(f"Arquivo {file_key} atualizado com {len(final_data)} registros.")
    return {
        "statusCode": 200,
        "body": json.dumps({"file": file_key, "records": len(final_data)})
    }
