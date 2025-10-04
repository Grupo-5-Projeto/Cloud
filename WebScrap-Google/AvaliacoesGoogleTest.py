from apify_client import ApifyClient
import csv

# Inicializa o ApifyClient com seu token de API
client = ApifyClient("A key está no trello")

# Prepara a entrada do Actor
run_input = {
    "language": "pt-BR",
    "maxReviews": 30, #Diminuir o número de avaliações para nao esgotar o plano gratuito
    "personalData": False,
    "startUrls": [
        {
            "url": "https://www.google.com/maps/place/UPA+21+de+Junho/@-23.4898876,-46.6913018,17z/data=!4m10!1m2!2m1!1sUPA+21+de+Junho!3m6!1s0x94cef9caba1fba9b:0xea027a3eee4989d2!8m2!3d-23.4900543!4d-46.6889032!15sCg9VUEEgMjEgZGUgSnVuaG-SARNnb3Zlcm5tZW50X2hvc3BpdGFsqgE5EAEyIBABIhwQD0iC_4IIzCJNh278Gzdhp0EfYSsmJc7vP3m1MhMQAiIPdXBhIDIxIGRlIGp1bmhv4AEA!16s%2Fg%2F11fpdb677m?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        }
        ,
        {
            "url": "https://www.google.com/maps/place/UPA+26+de+Agosto/@-23.5441558,-46.4662659,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce66c22648b9c3:0x5cb89cfda212e9ba!8m2!3d-23.5441558!4d-46.463691!16s%2Fg%2F11c3260_mr?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Campo+Limpo/@-23.6493028,-46.7519032,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce53df39fdff17:0xbdc63667439eb395!8m2!3d-23.6493028!4d-46.7493283!16s%2Fg%2F11bw1ylrdl?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+III+Carr%C3%A3o+-+Masataka+Ota/@-23.5386018,-46.5528391,13.75z/data=!4m6!3m5!1s0x94ce5f56df4b1389:0xca681a86b3b2d5a0!8m2!3d-23.5499646!4d-46.5338666!16s%2Fg%2F11txgmmx56?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Cidade+Tiradentes/@-23.571905,-46.4058849,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce65e515f1a0c1:0x8328d063fd6656cd!8m2!3d-23.571905!4d-46.40331!16s%2Fg%2F11pttmdmm4?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+City+Jaragu%C3%A1/@-23.4416033,-46.7362521,17z/data=!3m1!4b1!4m6!3m5!1s0x94cefb9e5408188b:0x6b93504a13a95344!8m2!3d-23.4416033!4d-46.7336772!16s%2Fg%2F11nnwbg_v4?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Dona+Maria+Antonieta+Ferreira+de+Barros/@-23.7488809,-46.6931524,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce4f37f7b72a4d:0x5b061193462af837!8m2!3d-23.7488809!4d-46.6905775!16s%2Fg%2F1tfc345d?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Dr.+Atualpa+Gir%C3%A3o+Rabelo/@-23.5083113,-46.3981259,17z/data=!4m16!1m9!3m8!1s0x94ce64812da5f95d:0xc8efdb964b8fffe2!2sUPA+Dr.+Atualpa+Gir%C3%A3o+Rabelo!8m2!3d-23.5083113!4d-46.395551!9m1!1b1!16s%2Fg%2F1tvgwgr8!3m5!1s0x94ce64812da5f95d:0xc8efdb964b8fffe2!8m2!3d-23.5083113!4d-46.395551!16s%2Fg%2F1tvgwgr8?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        }
        ,
        {
            "url": "https://www.google.com/maps/place/UPA+-+Ermelino+Matarazzo/@-23.5002398,-46.4790707,15.5z/data=!4m6!3m5!1s0x94ce614b91a6171d:0x778ca87d1ef42580!8m2!3d-23.4991375!4d-46.4736957!16s%2Fg%2F11j7hfx71m?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Ipiranga+-+Dr.+Augusto+Gomes+de+Mattos/@-23.6333951,-46.6102096,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5b69fa3c8a31:0x44fa5a5b66c89516!8m2!3d-23.6333951!4d-46.6076347!16s%2Fg%2F1tfd3jmf?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Jabaquara/@-23.6528576,-46.6488474,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5b15bbffbaa9:0x65446712600372f1!8m2!3d-23.6528576!4d-46.6462725!16s%2Fg%2F11nmq1zf_f?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+JA%C3%87AN%C3%83/@-23.4594141,-46.5827434,17z/data=!3m1!4b1!4m6!3m5!1s0x94cef513bcd2932d:0x527762147984471!8m2!3d-23.4594141!4d-46.5801685!16s%2Fg%2F11fsbdrvll?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Jardim+%C3%82ngela/@-23.6858196,-46.7711186,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5240b889c42f:0x26e6bd416c85966a!8m2!3d-23.6858196!4d-46.7685437!16s%2Fg%2F11ggz56cw7?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA%2FUBS+Jardim+Elisa+Maria+I/@-23.4559086,-46.6882593,17z/data=!3m1!4b1!4m6!3m5!1s0x94cef9f3f6b5b079:0x174e5b353484cc93!8m2!3d-23.4559086!4d-46.6856844!16s%2Fg%2F11bxc7jsnf?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Jardim+Helena+-+Santa+Marcelina/@-23.47926,-46.4222261,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce63c9863df8d9:0x529d41ff8fd27f21!8m2!3d-23.47926!4d-46.4196512!16s%2Fg%2F1td7d8mn?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/AMA+%2F+UBS+Integrada+Jardim+Icara%C3%AD+Quintana/@-23.7440665,-46.7078263,17z/data=!3m2!4b1!5s0x94ce4f1f5b8a7601:0x2fc0bae52b715cd3!4m6!3m5!1s0x94ce4f220a13431d:0xb7243db04a4f9ab7!8m2!3d-23.7440665!4d-46.7052514!16s%2Fg%2F1wnf24v8?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+III+-+Jardim+Peri/@-23.4672358,-46.6676241,17z/data=!3m1!4b1!4m6!3m5!1s0x94cef7004e357025:0x85b020f4121d7515!8m2!3d-23.4672358!4d-46.6676241!16s%2Fg%2F11w3vxx191?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+J%C3%BAlio+Tupy/@-23.5275273,-46.413881,17z/data=!3m2!4b1!5s0x94ce64681cfc8bcb:0x9fe52e46d3c3b1b!4m6!3m5!1s0x94ce651d81daad09:0x11dbf3e36efc5e2a!8m2!3d-23.5275322!4d-46.4113114!16s%2Fg%2F11h__k0bf6?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/Pronto+Socorro+Municipal+da+Lapa/@-23.5377042,-46.7251162,17z/data=!4m6!3m5!1s0x94cef89dcc7aa773:0xbe792ab88861467b!8m2!3d-23.5377091!4d-46.7225466!16s%2Fg%2F1tnqj3rh?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Mooca/@-23.5464104,-46.5948569,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce59d4a0d2fcd9:0xfdd76b46cb338932!8m2!3d-23.5464104!4d-46.5948569!16s%2Fg%2F11rf73dpq1?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Parelheiros+-+Emergency+Care+Unit/@-23.8156439,-46.7356715,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce495773b73773:0xb5ca1014bde70efc!8m2!3d-23.8156439!4d-46.7356715!16s%2Fg%2F11s4w9sfk9?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Parque+Doroteia/@-23.6972601,-46.6484032,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce450da009ac59:0x802e8c8ec669e64c!8m2!3d-23.6972601!4d-46.6484032!16s%2Fg%2F11bxdtyrvz?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+PEDREIRA+-+Dr.+C%C3%A9sar+Antunes+da+Rocha/@-23.695088,-46.6764286,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce4ff34191596d:0x9b3f36c2d3958512!8m2!3d-23.695088!4d-46.6764286!16s%2Fg%2F11cp76cdcd?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Perus/@-23.4005805,-46.7467595,17z/data=!3m1!4b1!4m6!3m5!1s0x94cefb3fa6fb9649:0x9ae425c1509c2144!8m2!3d-23.4005805!4d-46.7467595!16s%2Fg%2F11gsz_p53y?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+PIRITUBA/@-23.4846938,-46.7274711,17z/data=!3m1!4b1!4m6!3m5!1s0x94cef9f8af6aac83:0x534846c049674be1!8m2!3d-23.4846938!4d-46.7274711!16s%2Fg%2F11j07xnkgq?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Rio+Pequeno/@-23.5766693,-46.7649455,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce550077c8c3bf:0xe1e2df155a2c818c!8m2!3d-23.5766693!4d-46.7649455!16s%2Fg%2F11vx106csk?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Santo+Amaro/@-23.6516616,-46.7047562,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5050e63e5bc7:0x1e8f21909983e6db!8m2!3d-23.6516616!4d-46.7047562!16s%2Fg%2F11gglqcpps?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Tatuap%C3%A9/@-23.5334575,-46.5646403,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5fb72ad70b87:0xb5b4c0f525e334ca!8m2!3d-23.5334575!4d-46.5646403!16s%2Fg%2F11lk1flr3g?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Tito+Lopes/@-23.4990094,-46.4430547,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce6160e42469c9:0xd765f7ec7f4ab1ca!8m2!3d-23.4990094!4d-46.4430547!16s%2Fg%2F11c59_b2jb?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Vera+Cruz/@-23.7344636,-46.7816151,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce4da22b371d93:0xd61c8dd114e4953a!8m2!3d-23.7344636!4d-46.7816151!16s%2Fg%2F11hf1bdlhj?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Vergueiro/@-23.5675198,-46.6395946,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5938bd3da401:0x920391cb4013d989!8m2!3d-23.5675198!4d-46.6395946!16s%2Fg%2F11pv2ld672?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+Vila+Maria/@-23.5173259,-46.5772741,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5f3ceec42775:0x2bfbef69135420f0!8m2!3d-23.5173259!4d-46.5772741!16s%2Fg%2F11fpdb7clk?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Vila+Mariana/@-23.5960015,-46.6428603,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5bf25fc8b4e7:0x9fd8f8531df92a45!8m2!3d-23.5960015!4d-46.6428603!16s%2Fg%2F11k_q11b7z?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        },
        {
            "url": "https://www.google.com/maps/place/UPA+-+Vila+Santa+Catarina/@-23.6567661,-46.6536116,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5ab854ce609f:0xbb549d9a71f5dc6e!8m2!3d-23.6567661!4d-46.6536116!16s%2Fg%2F11b7grn375?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D",
            "method": "GET"
        }
    ]
}

# Roda o actor e espera ele terminar
run = client.actor("Xb8osYTtOjlsgI6k9").call(run_input=run_input)

# Busca e imprime os resultados do Actor a partir do dataset da execução (se houver)
items = client.dataset(run["defaultDatasetId"]).iterate_items()

# Converte os itens para uma lista para facilitar o acesso
items_list = list(items)

if items_list:
    # Define o nome do arquivo CSV
    output_file = "reviews.csv"
    
    # Define os campos desejados para o CSV
    headers = [
        "address", "city", "location", "neighborhood", "postalCode", 
        "publishedAtDate", "reviewOrigin", "reviewsCount", "scrapedAt", 
        "stars", "state", "street", "text", "title", "totalScore"
    ]
    
    # Processa os itens para remover quebras de linha no campo 'text'
    processed_items = []
    for item in items_list:
        new_item = item.copy()
        if new_item.get('text') and isinstance(new_item['text'], str):
            new_item['text'] = new_item['text'].replace('\n', ' ').replace('\r', ' ')
        processed_items.append(new_item)

    # Escreve no CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(processed_items)
        
    print(f"Os dados foram salvos em '{output_file}'")
else:
    print("Nenhum dado foi retornado.")

# https://apify.com/compass/google-maps-reviews-scraper