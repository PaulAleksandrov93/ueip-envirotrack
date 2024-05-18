# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# RUN apk add --no-cache gettext postgresql-client build-base postgresql-dev \
#     && adduser --disabled-password service-user

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# COPY envirotrack /envirotrack

# USER service-user

# EXPOSE 8000

# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


# ==========================

# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# RUN apk add --no-cache gettext postgresql-client build-base postgresql-dev \
#     && adduser --disabled-password service-user

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# COPY envirotrack /envirotrack

# USER service-user

# # Устанавливаем переменные среды для конфигурации PostgreSQL
# ENV POSTGRES_DB=dbname
# ENV POSTGRES_USER=dbuser
# ENV POSTGRES_PASSWORD=pass


# RUN apk add --no-cache postgresql
# RUN echo "CREATE DATABASE $POSTGRES_DB;" | su-exec postgres psql
# RUN echo "CREATE USER $POSTGRES_USER WITH SUPERUSER PASSWORD '$POSTGRES_PASSWORD';" | su-exec postgres psql


# EXPOSE 8000

# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# =======================================================

# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# # Устанавливаем необходимые пакеты
# RUN apk add --no-cache gettext build-base mysql-dev

# # Копируем файлы зависимостей и устанавливаем их
# COPY requirements.txt .
# RUN pip install -r requirements.txt

# # Копируем проект в контейнер
# COPY envirotrack /envirotrack

# # Устанавливаем переменные среды для MySQL
# ENV DB_ENGINE=django.db.backends.mysql
# ENV DB_NAME=dbname
# ENV DB_USER=dbuser
# ENV DB_PASS=pass
# ENV DB_HOST=database
# ENV DB_PORT=3306

# # Выполняем миграции Django
# RUN python manage.py migrate

# # Запускаем Gunicorn
# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000"]

# ======================================================

# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# # Установка необходимых пакетов
# RUN apk add --no-cache gettext build-base mysql-dev

# # Установка Celery и других зависимостей
# RUN pip install --upgrade pip
# COPY requirements.txt .
# RUN pip install -r requirements.txt

# # Копирование проекта в контейнер
# COPY envirotrack /envirotrack

# # Создание суперпользователя Django
# RUN python manage.py createsuperuser --noinput \
#     --username admin --email admin@example.com

# # Выполнение миграций Django
# RUN python manage.py migrate

# # Создание дампа базы данных
# RUN mysqldump -u dbuser -p dbname > /envirotrack/db_dump.sql

# # Удаление временных файлов и кэша
# RUN rm -rf /var/cache/apk/* && rm -rf /root/.cache

# # Запуск Gunicorn
# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000"]


# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# # Установка необходимых пакетов
# RUN apk add --no-cache gettext build-base mysql-dev mysql-client

# # Установка Celery и других зависимостей
# RUN pip install --upgrade pip
# COPY requirements.txt .
# RUN pip install -r requirements.txt

# # Копирование проекта в контейнер
# COPY envirotrack /envirotrack

# # Установка и запуск MySQL-сервера
# RUN apk add --no-cache mysql mysql-client
# RUN mkdir -p /run/mysqld && \
#     chown mysql:mysql /run/mysqld
# RUN mysql_install_db --user=mysql --datadir=/var/lib/mysql && \
#     /usr/bin/mysqld --user=mysql --bootstrap --verbose=0 --skip-name-resolve --skip-networking=0 --skip-grant-tables=0 --skip-host-cache --skip-replication --skip-auto-rehash < /dev/null && \
#     mysqladmin shutdown && \
#     rm -rf /var/lib/mysql/*-log* && \
#     rm -rf /var/log/mysql/* && \
#     rm -rf /var/tmp/* && \
#     rm -rf /tmp/*

# # Создание миграций Django
# RUN python manage.py makemigrations

# # Применение миграций к базе данных
# RUN python manage.py migrate

# # Запуск Gunicorn при старте контейнера
# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "debug"]


# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# # Установка необходимых пакетов
# RUN apk add --no-cache gettext build-base postgresql-dev

# # Установка Celery и других зависимостей
# RUN pip install --upgrade pip
# COPY requirements.txt .
# RUN pip install -r requirements.txt

# # Копирование проекта в контейнер
# COPY envirotrack /envirotrack

# # Создание миграций Django
# RUN python manage.py makemigrations

# # Применение миграций к базе данных
# RUN python manage.py migrate

# # Запуск Gunicorn при старте контейнера
# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "debug"]



# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# RUN apk add --no-cache gettext postgresql-client build-base postgresql-dev \
#     && adduser --disabled-password service-user

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# COPY envirotrack /envirotrack

# USER service-user

# # Устанавливаем переменные среды для конфигурации PostgreSQL
# ENV POSTGRES_DB=dbname
# ENV POSTGRES_USER=dbuser
# ENV POSTGRES_PASSWORD=pass

# # Создание миграций Django
# RUN python manage.py makemigrations

# # Применение миграций к базе данных
# RUN python manage.py migrate

# EXPOSE 8000

# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "debug"]

# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# RUN apk add --no-cache gettext postgresql-client build-base postgresql-dev \
#     && adduser --disabled-password service-user \
#     && addgroup service-user abuild

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# COPY envirotrack /envirotrack

# USER service-user

# # Устанавливаем переменные среды для конфигурации PostgreSQL
# ENV POSTGRES_DB=dbname
# ENV POSTGRES_USER=dbuser
# ENV POSTGRES_PASSWORD=pass

# # Ожидание доступности базы данных перед выполнением миграций
# # Это позволит избежать ошибки "could not translate host name"
# # Этот блок должен находиться перед созданием миграций
# RUN apk add --no-cache postgresql-client
# HEALTHCHECK --interval=5s CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1

# # Создание миграций Django
# # Используем опцию --noinput для автоматического применения миграций без запроса подтверждения
# RUN python manage.py makemigrations --noinput

# # Применение миграций к базе данных
# RUN python manage.py migrate --noinput

# EXPOSE 8000

# CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "debug"]

# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# RUN apk add --no-cache gettext build-base postgresql-dev \
#     && adduser --disabled-password service-user

# COPY requirements.txt .
# RUN pip install -r requirements.txt
# RUN pip install psycopg2-binary  # Устанавливаем PostgreSQL клиент

# COPY envirotrack /envirotrack

# USER service-user

# # Устанавливаем переменные среды для конфигурации PostgreSQL
# ENV POSTGRES_DB=dbname
# ENV POSTGRES_USER=dbuser
# ENV POSTGRES_PASSWORD=pass

# # Создание миграций Django
# # Используем опцию --noinput для автоматического применения миграций без запроса подтверждения
# RUN python manage.py makemigrations

# # Добавляем задержку перед выполнением миграции для дополнительной уверенности, что база данных полностью запущена
# CMD ["sh", "-c", "sleep 10 && python manage.py migrate && gunicorn envirotrack.wsgi:application --bind 0.0.0.0:8000 --access-logfile - --error-logfile - --log-level debug"]

# EXPOSE 8000

# === 

# FROM python:3.9-alpine3.16

# WORKDIR /envirotrack

# RUN apk add --no-cache gettext build-base postgresql-dev \
#     && adduser --disabled-password service-user

# COPY requirements.txt .
# RUN pip install -r requirements.txt
# RUN pip install psycopg2-binary  # Устанавливаем PostgreSQL клиент

# COPY envirotrack /envirotrack

# USER service-user

# # Устанавливаем переменные среды для конфигурации PostgreSQL
# ENV POSTGRES_DB=dbname
# ENV POSTGRES_USER=dbuser
# ENV POSTGRES_PASSWORD=pass

# # Создание миграций Django
# # Используем опцию --noinput для автоматического применения миграций без запроса подтверждения
# RUN python manage.py makemigrations

# EXPOSE 8000

# ===

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

# Создание миграций Django
# Используем опцию --noinput для автоматического применения миграций без запроса подтверждения
# RUN python manage.py makemigrations

# # Создание суперпользователя Django
# RUN python manage.py createsuperuser --noinput --username admin --email admin@example.com

EXPOSE 8000