import json
import os
from email.mime.text import MIMEText
from smtplib import SMTP
from typing import TypedDict

import requests
from pymongo import MongoClient
from pymongo.collection import Collection

from read_dot_env import read_dot_env

read_dot_env()

EMAIL_SERVER = os.getenv('EMAIL_SERVER')
EMAIL = os.getenv('EMAIL')
PASSWORD = os.getenv('PASSWORD')
ENDPOINT = os.getenv('CARTORIO_ENDPOINT')

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")


class Entry(TypedDict):
    DataSistema: str
    NomeFase: str

class Types:
    Register = 1
    Certification = 3
    DocumentCopy = 5

class SyncEntries:

    @classmethod
    def sync(cls):
        payload = {
            "NrSolicitacao": '01/147004',
            "TipoSolicitacao": Types.Register,
            "SenhaInternet": 'R1BBV2'
        }
        try:
            response = requests.post(ENDPOINT, payload)
        except (requests.ConnectTimeout, requests.HTTPError):
            pass
        else:
            fetched_entries: list[Entry] = json.loads(response.content)['movi']

            collection = cls.get_collection('entries')
            entries = list(collection.find())
            if len(fetched_entries) != len(entries):
                new_entries = fetched_entries[len(entries):]
                collection.insert_many(new_entries)
                cls.send_email(new_entries)

    @staticmethod
    def get_collection(name: str) -> Collection:
        return MongoClient(MONGODB_URI)[MONGODB_DATABASE][name]

    @staticmethod
    def send_email(new_entries: list[Entry]) -> None:
        titles = [entry['NomeFase'] for entry in new_entries]
        titles_str = "\n".join(titles)

        message = MIMEText(f'Novos status:\n\"{titles_str}.', 'plain')
        message['Subject'] = f'Novo status do cartório: {titles[-1]}'
        message['From'] = EMAIL
        message['To'] = EMAIL

        server = SMTP(EMAIL_SERVER)
        server.ehlo()
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.sendmail(EMAIL, [EMAIL], message.as_string())
        server.quit()


if __name__ == '__main__':
    SyncEntries.sync()
