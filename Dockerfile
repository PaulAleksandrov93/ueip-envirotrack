FROM python:3.9-alpine3.16

# Установка Node.js
RUN apk add --no-cache nodejs npm

# Установка зависимостей для Python и PostgreSQL
RUN apk add --no-cache gettext build-base postgresql-dev

WORKDIR /envirotrack

# Копирование и установка зависимостей Python
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install psycopg2-binary  # Устанавливаем PostgreSQL клиент

# Копирование исходного кода
COPY envirotrack /envirotrack

# Создание пользователя для запуска сервиса
RUN adduser --disabled-password service-user

# Устанавливаем пользователя
USER service-user

# Устанавливаем переменные среды для конфигурации PostgreSQL
ENV POSTGRES_DB=dbname
ENV POSTGRES_USER=dbuser
ENV POSTGRES_PASSWORD=pass

EXPOSE 8000

CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000"]