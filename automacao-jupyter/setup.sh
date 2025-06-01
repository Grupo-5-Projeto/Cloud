#!/bin/bash
sudo yum update -y

# Nome do ambiente virtual
ENV_NAME="venv"

# Diretório onde criar o venv (padrão: diretório atual)
DIR=${1:-"."}

# Lista de pacotes adicionais a instalar (opcional)
# Exemplo: PACKAGES="requests flask"
PACKAGES="boto3 papermill"

# Verifica se o Python 3 está disponível
if ! command -v python3 &>/dev/null; then
    sudo yum install python3
fi

# Cria o ambiente virtual
echo "Criando ambiente virtual no diretório: $DIR/$ENV_NAME"
python3 -m venv "$DIR/$ENV_NAME"

# Ativa o ambiente virtual
source "$DIR/$ENV_NAME/bin/activate"

# Atualiza o pip
echo "Atualizando o pip..."
pip install --upgrade pip

# Instala pacotes adicionais, se definidos no script
if [[ -n "$PACKAGES" ]]; then
    echo "Instalando pacotes adicionais: $PACKAGES"
    pip install $PACKAGES
fi

# Exibe a versão do Python no ambiente
echo "Ambiente virtual criado e configurado! Versão do Python:"
python --version

# Instruções para ativar o ambiente virtual manualmente
echo "Para ativar o ambiente virtual novamente, execute:"
echo "source $DIR/$ENV_NAME/bin/activate"
