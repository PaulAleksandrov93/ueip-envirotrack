FROM python:3.9-alpine3.16

# Установка Node.js и Nginx
RUN apk add --no-cache nodejs npm nginx

WORKDIR /envirotrack

RUN apk add --no-cache gettext build-base postgresql-dev \
    && adduser --disabled-password service-user

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install psycopg2-binary  # Устанавливаем PostgreSQL клиент

# Копирование конфигурационного файла Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открытие порта 80 для Nginx
EXPOSE 80

COPY envirotrack /envirotrack

USER service-user

# Устанавливаем переменные среды для конфигурации PostgreSQL
ENV POSTGRES_DB=dbname
ENV POSTGRES_USER=dbuser
ENV POSTGRES_PASSWORD=pass

EXPOSE 8000