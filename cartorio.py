import os
from email.mime.text import MIMEText
from time import sleep

import json
import requests
import smtplib

from read_dot_env import read_dot_env

read_dot_env()

EMAIL_SERVER = os.getenv('EMAIL_SERVER')
EMAIL = os.getenv('EMAIL')
PASSWORD = os.getenv('PASSWORD')
ENDPOINT = os.getenv('CARTORIO_ENDPOINT')


def send_email(new_status: str) -> None:
    server = smtplib.SMTP(EMAIL_SERVER)
    server.ehlo()
    server.starttls()
    server.login(EMAIL, PASSWORD)

    message = MIMEText(f'Cartório atualizou o status para "{new_status}".', 'plain')
    message['Subject'] = 'Novo status do cartório!'
    message['From'] = EMAIL
    message['To'] = EMAIL
    print('Enviando email...')
    server.sendmail(EMAIL, [EMAIL], message.as_string())
    server.quit()


class Types:
    Register = 1
    Certification = 3
    DocumentCopy = 5


if __name__ == '__main__':
    while True:
        print("Fazendo a requisição...")
        payload = {
            "NrSolicitacao": '01/147004',
            "TipoSolicitacao": Types.Register,
            "SenhaInternet": 'R1BBV2'
        }
        try:
            response = requests.post(ENDPOINT, payload)
        except requests.HTTPError as e:
            print("Erro: " + str(e))
            print("-----------------------X-----------------------")
            continue
        except requests.ConnectTimeout:
            print("Requisição demorou demais pra responder.")
            print("-----------------------X-----------------------")
            continue

        fetched = json.loads(response.content)['movi']

        with open('data.json', 'r') as readable_file:
            existing = json.loads(readable_file.read() or '[]')
            print(f"Vieram {len(fetched)} entradas e tinham {len(existing)}.")
            if len(fetched) != len(existing):
                with open('data.json', 'w') as writable_file:
                    print("Salvando os dados novos no arquivo.")
                    json.dump(fetched, writable_file, indent=4)
                    send_email(fetched[-1]['NomeFase'])
        print("-----------------------X-----------------------")
        print("Esperando 2 minutos pra fazer a próxima requisição")
        sleep(120)
