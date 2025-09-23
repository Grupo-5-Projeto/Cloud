from decimal import Decimal
from zoneinfo import ZoneInfo
import boto3
import json
from datetime import datetime, timedelta, timezone
from botocore.exceptions import ClientError
from boto3.dynamodb.types import TypeDeserializer
import io
import csv

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

TABLE_NAME = "SensorIotRawData"          
S3_BUCKET = "raw-iot-final-data-edu-2"           
S3_PREFIX = ""                
FILE_EXTENSION = ".csv"

utc_minus_3 = timezone(timedelta(hours=-3))

def lambda_handler(event, context):
    today = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%Y-%m-%d")
    file_key = f"{S3_PREFIX}{today}{FILE_EXTENSION}"

    table = dynamodb.Table(TABLE_NAME)

    five_minutes_ago = datetime.now(ZoneInfo("America/Sao_Paulo")) - timedelta(minutes=5)
    five_minutes_ago_timestamp = int(Decimal(str(five_minutes_ago.timestamp())))
    print(five_minutes_ago_timestamp)

    response = table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr("timestamp").gte(five_minutes_ago_timestamp)
    )
    csv_itens = None
    try:
        s3_response = s3.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content = s3_response["Body"].read().decode("utf-8")
        csv_itens = csv.DictReader(io.StringIO(file_content))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            print(f"Arquivo {file_key} não existe. Criando novo.")
        else:
            raise

    items = [
        {
            'fk_sensor': item['fk_sensor'],
            'data_hora': item['data_hora'],
            'valor': item['valor'],
            'fk_upa': item['fk_upa']
        }
        for item in response.get('Items', [])
    ]

    csv_buffer = io.StringIO()

    fields = ["fk_sensor", "data_hora", "valor", "fk_upa"]

    if items:
        writer = csv.DictWriter(csv_buffer, fieldnames=fields)
        writer.writeheader()
        if csv_itens != None:
            writer.writerows(list(csv_itens))
        writer.writerows(items)

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=file_key,
            Body=csv_buffer.getvalue(),
            ContentType="text/csv"
        )

        print(f"Arquivo CSV '{file_key}' enviado para o bucket '{S3_BUCKET}' com sucesso.")
    else:
        print("Nenhum item para salvar no CSV.")

    return {
        "statusCode": 200,
    }
