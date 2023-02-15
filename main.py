import json
import os
from datetime import datetime
from email.mime.text import MIMEText
from smtplib import SMTP
from time import sleep
from typing import TypedDict

import requests
from pymongo import MongoClient
from pymongo.collection import Collection

from read_dot_env import read_dot_env
import sentry_sdk

read_dot_env()

SENTRY_DSN = os.getenv('SENTRY_DSN')
EMAIL_SERVER = os.getenv('EMAIL_SERVER')
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
REGISTRY_ENDPOINT = os.getenv('REGISTRY_ENDPOINT')

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")

sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=1.0)


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
            response = requests.post(REGISTRY_ENDPOINT, payload)
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
        message['From'] = EMAIL_ADDRESS
        message['To'] = EMAIL_ADDRESS

        server = SMTP(EMAIL_SERVER)
        server.ehlo()
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, [EMAIL_ADDRESS], message.as_string())
        server.quit()


if __name__ == '__main__':
    while True:
        print(f'Syncing...           - {datetime.utcnow().isoformat()}')
        SyncEntries.sync()
        print(f'Waiting next sync... - {datetime.utcnow().isoformat()}')
        sleep(180)
