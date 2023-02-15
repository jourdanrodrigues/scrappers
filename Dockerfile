FROM python:3.9-slim-buster

WORKDIR /scrappers/

RUN pip install --upgrade pip
RUN pip install pipenv
COPY Pipfile Pipfile.lock ./

RUN pipenv install --system --deploy --ignore-pipfile

COPY . .
