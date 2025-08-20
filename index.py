import json
import boto3
import time
import os
from decimal import Decimal

# Nome da tabela (pode ser definido via variável de ambiente)
TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "SensorData")

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))  # Log do evento completo

    try:
        body = event.get("body")
        if body is None:
            print("No body found in the event")
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "No body found"})
            }

        if isinstance(body, str):
            print("Parsing body string to dict")
            data = json.loads(body)
        elif isinstance(body, dict):
            print("Body is already a dict")
            data = body
        else:
            print("Unsupported body type:", type(body))
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Invalid body type"})
            }

        fk_sensor = data.get("fk_sensor")
        data_hora = data.get("data_hora")
        valor = data.get("valor")
        fk_upa = data.get("fk_upa")

        print(f"Parsed data - fk_sensor: {fk_sensor}, data_hora: {data_hora}, valor: {valor}, fk_upa: {fk_upa}")

        if fk_sensor is None or data_hora is None or valor is None or fk_upa is None:
            print("Missing required fields")
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing required fields"})
            }

        fk_unid_medida = data.get("fk_unid_medida")
        fk_paciente = data.get("fk_paciente")

        ttl = int(time.time()) + 30*24*60*60

        item = {
            "fk_sensor": int(fk_sensor),
            "data_hora": data_hora,
            "valor": Decimal(str(valor)),
            "fk_upa": int(fk_upa),
            "ttl": ttl
        }

        if fk_unid_medida is not None:
            item["fk_unid_medida"] = int(fk_unid_medida)
        if fk_paciente is not None:
            item["fk_paciente"] = int(fk_paciente)

        print("Putting item into DynamoDB:", item)
        table.put_item(Item=item)
        print("Item successfully stored")

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Event stored"})
        }

    except Exception as e:
        print("Error:", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"})
        }
