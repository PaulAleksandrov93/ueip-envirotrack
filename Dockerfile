# FROM python:3.9-alpine3.16

# # Установка Node.js
# RUN apk add --no-cache nodejs npm

# # Установка зависимостей для Python и PostgreSQL
# RUN apk add --no-cache gettext build-base postgresql15-dev postgresql15-client

# WORKDIR /envirotrack

# # Копирование и установка зависимостей Python
# COPY requirements.txt .
# RUN pip install -r requirements.txt
# RUN pip install psycopg2-binary

# # Копирование исходного кода
# COPY envirotrack /envirotrack

# # Создание пользователя для запуска сервиса
# RUN adduser --disabled-password service-user

# # Устанавливаем пользователя
# USER service-user

# # Устанавливаем переменные среды для конфигурации PostgreSQL
# ENV POSTGRES_DB=dbname
# ENV POSTGRES_USER=dbuser
# ENV POSTGRES_PASSWORD=pass

# EXPOSE 8000

# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000"]

FROM python:3.9-slim-bullseye

# Установка Node.js
RUN apt-get update && apt-get install -y nodejs npm

# Установка зависимостей для Python и PostgreSQL
RUN apt-get install -y build-essential libpq-dev wget gnupg2

# Добавление репозитория PostgreSQL и установка клиента
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-16 postgresql-client-16

WORKDIR /envirotrack

# Копирование и установка зависимостей Python
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install psycopg2-binary

# Копирование исходного кода
COPY envirotrack /envirotrack

# Создание пользователя для запуска сервиса
RUN useradd -ms /bin/bash service-user

# Устанавливаем пользователя
USER service-user

# Устанавливаем переменные среды для конфигурации PostgreSQL
ENV POSTGRES_DB=dbname
ENV POSTGRES_USER=dbuser
ENV POSTGRES_PASSWORD=pass

EXPOSE 8000

CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000"]