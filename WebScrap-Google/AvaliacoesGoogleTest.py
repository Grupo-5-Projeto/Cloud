import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Configurações Iniciais ---
TERMO_DE_PESQUISA = "UPA 21 de Junho"
URL_MAPS = "https://www.google.com/maps"

print("--- INICIANDO SCRIPT DE SCRAPING ---")

# --- Passo 1: Configurar e Iniciar o Selenium ---
print("\n[PASSO 1] Configurando e iniciando o navegador...")
service = Service(ChromeDriverManager().install())
options = webdriver.ChromeOptions()
options.add_argument("--lang=pt-BR")
options.add_argument("--disable-notifications")
driver = webdriver.Chrome(service=service, options=options)
driver.get(URL_MAPS)
print("SUCESSO: Navegador iniciado e Google Maps carregado.")

# Espera pelo campo de busca
wait = WebDriverWait(driver, 15)
try:
    print("Aguardando campo de busca (ID: searchboxinput)...")
    search_box = wait.until(EC.presence_of_element_located((By.ID, "searchboxinput")))
    print("SUCESSO: Campo de busca encontrado.")
except Exception as e:
    print(f"FALHA CRÍTICA: Não foi possível encontrar o campo de busca. O script não pode continuar. Erro: {e}")
    driver.quit()
    exit()

# --- Passo 2: Pesquisar pela UPA ---
print(f"\n[PASSO 2] Pesquisando por: '{TERMO_DE_PESQUISA}'...")
search_box.send_keys(TERMO_DE_PESQUISA)
search_box.send_keys(Keys.RETURN)
print("SUCESSO: Termo enviado para a busca.")

# --- Passo 3: Clicar no Resultado da Busca para Abrir os Detalhes ---
print("\n[PASSO 3] Aguardando e clicando no resultado da busca...")
try:
    search_result_xpath = f'//a[contains(@aria-label, "{TERMO_DE_PESQUISA}")]'
    print(f"Tentando localizar elemento com XPath: {search_result_xpath}")
    result_element = wait.until(EC.element_to_be_clickable((By.XPATH, search_result_xpath)))
    print("SUCESSO: Elemento do resultado da busca localizado.")
    result_element.click()
    print("SUCESSO: Clique no resultado da busca realizado.")
except Exception as e:
    print(f"FALHA: Não foi possível localizar ou clicar no resultado da busca. Tentando continuar... Erro: {e}")

# --- Passo 4: Acessar a Aba de Avaliações ---
print("\n[PASSO 4] Aguardando e acessando a aba de avaliações...")
try:
    reviews_button_xpath = "//button[contains(., 'Avaliações')]"
    print(f"Tentando localizar elemento com XPath: {reviews_button_xpath}")
    reviews_button = wait.until(EC.element_to_be_clickable((By.XPATH, reviews_button_xpath)))
    print("SUCESSO: Botão 'Avaliações' localizado.")
    reviews_button.click()
    print("SUCESSO: Clique no botão 'Avaliações' realizado.")
except Exception as e:
    print(f"FALHA CRÍTICA: Não foi possível encontrar ou clicar no botão de avaliações. Encerrando. Erro: {e}")
    driver.quit()
    exit()

# --- Passo 5: Rolar a Página para Carregar Mais Avaliações ---
print("\n[PASSO 5] Carregando mais avaliações (scroll)...")
try:
    scrollable_div_xpath = f'//div[contains(@aria-label, "{TERMO_DE_PESQUISA}")]'
    print(f"Tentando localizar painel de rolagem com XPath: {scrollable_div_xpath}")
    scrollable_div = wait.until(EC.presence_of_element_located((By.XPATH, scrollable_div_xpath)))
    print("SUCESSO: Painel de rolagem encontrado.")

    num_scrolls = 2 # Diminuí para 2 para testes mais rápidos, aumente conforme necessário
    for i in range(num_scrolls):
        print(f"  - Realizando Scroll {i+1}/{num_scrolls}...")
        driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", scrollable_div)
        time.sleep(2)
    print("SUCESSO: Rolagem da página concluída.")
except Exception as e:
    print(f"FALHA: Não foi possível encontrar o painel de rolagem para carregar mais avaliações. Erro: {e}")

# --- Passo 6: Extrair os Dados com BeautifulSoup ---
print("\n[PASSO 6] Extraindo os dados com BeautifulSoup...")
page_source = driver.page_source
soup = BeautifulSoup(page_source, 'html.parser')
print("SUCESSO: HTML da página capturado e processado pelo BeautifulSoup.")

# LOG CRÍTICO: Verificar se o seletor principal encontra algum elemento
target_class = 'jftiEf fontBodyMedium'
print(f"Tentando encontrar blocos de avaliação com a classe: '{target_class}'")
review_blocks = soup.find_all('div', class_=target_class)

if not review_blocks:
    print(f"FALHA: Nenhum bloco de avaliação foi encontrado com a classe '{target_class}'. Verifique se a classe mudou no site do Google Maps.")
else:
    print(f"SUCESSO: Encontrados {len(review_blocks)} blocos de avaliação. Processando cada um...")

reviews_data = []
for i, review_block in enumerate(review_blocks):
    print(f"\n--- Processando Bloco de Avaliação {i+1} ---")
    try:
        # Extração do nome do usuário
        try:
            user_name = review_block.find('div', class_='d4r55').text.strip()
            print(f"  [OK] Nome do usuário: {user_name}")
        except Exception:
            user_name = None
            print("  [FALHA] Não foi possível extrair o nome do usuário.")

        # Extração da data
        try:
            review_date = review_block.find('span', class_='rsqaWe').text.strip()
            print(f"  [OK] Data: {review_date}")
        except Exception:
            review_date = None
            print("  [FALHA] Não foi possível extrair a data.")

        # Extração da nota
        try:
            rating_span = review_block.find('span', class_='kvMYJc')
            rating = rating_span['aria-label'].split()[0] if rating_span else None
            print(f"  [OK] Nota: {rating} estrelas")
        except Exception:
            rating = None
            print("  [FALHA] Não foi possível extrair a nota.")

        # Extração do texto
        try:
            review_text_span = review_block.find('span', class_='wiI7pd')
            review_text = review_text_span.text.strip() if review_text_span else ""
            print(f"  [OK] Texto: {review_text[:50]}...") # Mostra os primeiros 50 caracteres
        except Exception:
            review_text = ""
            print("  [FALHA] Não foi possível extrair o texto.")

        # Adiciona os dados apenas se conseguiu extrair o essencial (nome e nota)
        if user_name and rating:
            reviews_data.append({
                'upa': TERMO_DE_PESQUISA,
                'usuario': user_name,
                'nota': int(rating),
                'data': review_date,
                'texto': review_text
            })
            print("  --> Bloco adicionado aos dados.")
        else:
            print("  --> Bloco ignorado por falta de dados essenciais.")

    except Exception as e:
        print(f"FALHA INESPERADA ao processar o bloco {i+1}. Erro geral: {e}")
        continue

# --- Passo 7: Organizar em um DataFrame e Salvar ---
print(f"\n[PASSO 7] Finalizando e salvando os dados...")
print(f"Total de {len(reviews_data)} avaliações coletadas com sucesso.")
driver.quit()
print("SUCESSO: Navegador fechado.")

if reviews_data:
    df = pd.DataFrame(reviews_data)
    print("\nAmostra dos dados coletados:")
    print(df.head())
    
    nome_arquivo = f"avaliacoes_{TERMO_DE_PESQUISA.replace(' ', '_').lower()}.csv"
    df.to_csv(nome_arquivo, index=False, encoding='utf-8-sig')
    print(f"\nSUCESSO: Dados salvos no arquivo: {nome_arquivo}")
else:
    print("\nAVISO: Nenhuma avaliação foi coletada. O script terminou sem dados para salvar.")

print("\n--- SCRIPT FINALIZADO ---")