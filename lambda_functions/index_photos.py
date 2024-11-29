import json
import boto3
import os
from elasticsearch import Elasticsearch
 
ES_HOST="<ES_HOST>"
ES_INDEX_NAME="photos"
ES_PASSWORD="<ES_PASSWORD>"
ES_USERNAME="<ES_USERNAME>"

def index_doc(index_name='photos', document={'temp': 'temp'}):
    client = Elasticsearch(
    hosts=[{'host': ES_HOST, 'port': 443}],
        http_auth=(ES_USERNAME, ES_PASSWORD),
        scheme="https",
        port=443
    )

    response = client.index(
        index=ES_INDEX_NAME,
        body=document
    )

    print(f"Elasticsearch Response: {response}")
    return response

def lambda_handler(event, context):
    print(event)
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    image_name = event['Records'][0]['s3']['object']['key']
    
    print(f"Bucket Name: {bucket_name}, Image Name: {image_name}")
    print(bucket_name, image_name)
    rekognition = boto3.client('rekognition')

    s3 = boto3.client('s3')
    labels_reponse = rekognition.detect_labels(
        Image={
            'S3Object': {
                'Bucket': bucket_name,
                'Name': image_name,
            }
        }
    )
    
    print(f"Recognition Labels: {labels_reponse}")
    labels = [label['Name'] for label in labels_reponse['Labels']]
    head_response = s3.head_object(
        Bucket= bucket_name,
        Key =  image_name
        ) 
        
    print(head_response)
    if head_response['Metadata'] and head_response['Metadata']['customlabels'] not in labels:
        labels.append(head_response['Metadata']['customlabels'])
    

    print(f"All Labels: {labels}")
    timestamp = head_response['LastModified'].strftime("%Y-%m-%dT%H:%M:%S")
    data = {
        "objectKey": image_name, 
        "bucket": bucket_name,
        "createdTimestamp": timestamp,
        "labels": labels
    }

    response = index_doc(os.environ['ES_INDEX_NAME'], data)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Lambda to Index Photos')
    }