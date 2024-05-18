# Envirotrack

Envirotrack - это программа для ведения записей о параметрах окружающей среды в Отделе метрологии предприятия. Программа предоставляет возможности для логирования пользователей, администрирования, ведения журнала измерений и хранения данных.

## Основные возможности

- Логирование пользователей
- Администрирование системы
- Ведение журнала измерений
- Хранение данных в базе данных PostgreSQL
- Веб-интерфейс для управления данными

## Структура проекта

Проект состоит из нескольких компонентов:

- **Backend**: Реализован на Django с использованием Django Rest Framework (DRF) для создания RESTful API.
- **Frontend**: Реализован на ReactJS.
- **Database**: Используется PostgreSQL.
- **Redis**: Используется для кэширования и фоновых задач.
- **Nginx**: Используется в качестве обратного прокси-сервера.

## Требования

- Docker
- Docker Compose

## Установка и запуск

1. Клонируйте репозиторий:

    ```bash
    git clone https://github.com/username/ueip-envirotrack.git
    cd ueip-envirotrack
    ```

2. Создайте файл `.env` в корневом каталоге проекта и добавьте следующие переменные окружения:

    ```plaintext
    POSTGRES_DB=dbname
    POSTGRES_USER=dbuser
    POSTGRES_PASSWORD=pass
    DB_ENGINE=django.db.backends.postgresql
    DB_NAME=dbname
    DB_USER=dbuser
    DB_PASS=pass
    DB_HOST=database
    DB_PORT=5432
    ```

3. Запустите Docker Compose:

    ```bash
    docker-compose up --build
    ```

4. После успешного запуска сервисов, приложение будет доступно по адресу `http://localhost`.
