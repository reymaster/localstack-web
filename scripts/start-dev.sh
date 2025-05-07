#!/bin/bash

# Função para verificar o resultado de um comando
check_result() {
    if [ $? -eq 0 ]; then
        echo "SUCESSO: $1"
    else
        echo "ERRO: $1"
        exit 1
    fi
}

# Seta as variáveis de ambiente da AWS
awsqueima -l && $(awsqueima -b dev)
check_result "Setando credenciais do ambiente DEV"

# Imprime as variáveis de ambiente da AWS que estão no comando env
echo ""
echo "Variáveis de ambiente da AWS:"
env | grep AWS
echo ""

echo ""
echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
echo "Verificando serviços                ✳"
echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"

# Verifica se o container postgres-container está rodando
# Se não estiver, inicia o container
if [ ! "$(docker ps -q -f name=postgres-container)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=postgres-container)" ]; then
        docker rm postgres-container
    fi
    docker run --name postgres-container -e POSTGRES_PASSWORD=123 -p 5432:5432 -d postgres:latest
    check_result "Executando container do Postgres"
else
    echo "Container do Postgres já está rodando"
fi
echo ""

# Verifica se o container localstack está rodando
# Se não estiver, inicia o container
if [ ! "$(docker ps -q -f name=localstack)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=localstack)" ]; then
        docker rm localstack
    fi
    docker run --name localstack \
        -p 4566:4566 \
        -p 4510-4559:4510-4559 \
        -p 8080:8080 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -e SERVICES=sqs,sns,s3 \
        -e DEBUG=1 \
        -e DOCKER_HOST=unix:///var/run/docker.sock \
        -e LAMBDA_EXECUTOR=docker \
        -e AWS_DEFAULT_REGION=us-east-1 \
        -e AWS_ACCESS_KEY_ID=test \
        -e AWS_SECRET_ACCESS_KEY=test \
        -e CORS_ALLOW_ORIGINS=* \
        -d localstack/localstack:latest
    check_result "Executando container do LocalStack"
else
    echo "Container do LocalStack já está rodando"
fi
echo ""

# Verifica se o container alpine-redis está rodando
# Se não estiver, inicia o container
if [ ! "$(docker ps -q -f name=alpine-redis)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=alpine-redis)" ]; then
        docker rm alpine-redis
    fi
    docker run --name alpine-redis -d -p 6379:6379 redis:latest
    check_result "Executando container do Redis"
else
    echo "Container do Redis já está rodando"
fi
echo ""

# Verifica se o container alpine-rabbitmq está rodando
# Se não estiver, inicia o container
if [ ! "$(docker ps -q -f name=alpine-rabbitmq)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=alpine-rabbitmq)" ]; then
        docker rm alpine-rabbitmq
    fi
    docker run --name alpine-rabbitmq -p 5672:5672 -p 15672:15672 -v /var/lib/rabbitmq -d rabbitmq:3-management
    check_result "Executando container do RabbitMQ"
else
    echo "Container do RabbitMQ já está rodando"
fi
echo ""

# Aguarda o LocalStack estar pronto
echo "Aguardando o LocalStack ficar disponível"
TIMEOUT=120  # Aumentando o timeout para 120 segundos
COUNTER=0
SLEEP_TIME=5  # Tempo de espera inicial para o LocalStack iniciar completamente

# Aguarda um tempo inicial para o LocalStack iniciar
echo "Aguardando $SLEEP_TIME segundos para o LocalStack iniciar completamente..."
sleep $SLEEP_TIME

while [ $COUNTER -lt $TIMEOUT ]; do
    # Verifica se o container ainda está rodando
    if [ ! "$(docker ps -q -f name=localstack)" ]; then
        echo ""
        echo "ERRO: Container do LocalStack parou de executar"
        exit 1
    fi

    # Tenta fazer uma requisição para o endpoint de saúde
    if curl -s http://localhost:4566/_localstack/health > /dev/null; then
        # Se a requisição foi bem sucedida, verifica os serviços
        if curl -s http://localhost:4566/_localstack/health | grep -q '"sqs": "available"' && \
           curl -s http://localhost:4566/_localstack/health | grep -q '"sns": "available"' && \
           curl -s http://localhost:4566/_localstack/health | grep -q '"s3": "available"'; then
            echo ""
            echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
            echo "✔ LocalStack disponível"
            echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
            echo ""
            break
        fi
    fi

    echo -n "."
    sleep 1
    COUNTER=$((COUNTER + 1))
done

if [ $COUNTER -eq $TIMEOUT ]; then
    echo ""
    echo "ERRO: Timeout aguardando o LocalStack ficar disponível"
    echo "Verifique os logs do container com: docker logs localstack"
    exit 1
fi

echo ""
echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
echo "Criando filas do SQS e tópicos do SNS    ✳"
echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
echo ""

# Configuração do endpoint do LocalStack
ENDPOINT_URL="http://localhost:4566"

# Função para criar uma fila no LocalStack
create_queue() {
    curl -s -X POST "http://localhost:4566" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "Action=CreateQueue" \
        -d "QueueName=$1" \
        -d "Version=2012-11-05" \
        -d "Attribute.1.Name=VisibilityTimeout" \
        -d "Attribute.1.Value=30" > /dev/null
    check_result "Criando fila SQS: $1"
}

# Função para criar um tópico no LocalStack
create_topic() {
    curl -s -X POST "http://localhost:4566" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "Action=CreateTopic" \
        -d "Name=$1" \
        -d "Version=2010-03-31" > /dev/null
    check_result "Criando tópico SNS: $1"
}

# Pegar todas as queues que já estão criadas na AWS e extrair o nome da fila
DEV_QUEUES=($(aws sqs list-queues --region us-east-1 --output json | jq -r '.QueueUrls[]' | awk -F/ '{print $NF}'))

# Criar filas remotas
if [ ${#DEV_QUEUES[@]} -gt 0 ]; then
    echo "Criando filas remotas..."
    for queue in "${DEV_QUEUES[@]}"; do
        if [ ! -z "$queue" ]; then
            echo "Criando fila remota: $queue"
            create_queue "$queue"
        fi
    done
else
    echo "Nenhuma fila remota encontrada para criar"
fi

# Lista de filas customizadas
CUSTOM_QUEUES=("newqueue" "minifactu_response" "minifactu_request")

# Lista de tópicos customizados
CUSTOM_TOPICS=("notifications" "events")

# Criar filas locais
for queue in "${CUSTOM_QUEUES[@]}"; do
    echo "Criando fila local: $queue"
    create_queue "$queue"
done

# Criar tópicos
for topic in "${CUSTOM_TOPICS[@]}"; do
    echo "Criando tópico: $topic"
    create_topic "$topic"
done

echo ""
echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
echo "✔ Ambiente DEV criado com sucesso   ✳"
echo "✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳ ✳"
echo ""
echo "📊 Interface Web do LocalStack"
echo "-----------------------------"
echo "URL: http://localhost:8080"
echo "Credenciais:"
echo "  - Access Key: test"
echo "  - Secret Key: test"
echo "  - Region: us-east-1"
echo ""
echo "Para listar recursos via CLI:"
echo "  - SQS: aws --endpoint-url=http://localhost:4566 sqs list-queues --region us-east-1"
echo "  - SNS: aws --endpoint-url=http://localhost:4566 sns list-topics --region us-east-1"
echo "  - S3:  aws --endpoint-url=http://localhost:4566 s3 ls --region us-east-1"
echo ""
