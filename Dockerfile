FROM python:3.9-slim-bullseye

ARG INSTALL_PG_CLIENT=false

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    wget \
    curl \
    gnupg2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN if [ "$INSTALL_PG_CLIENT" = "true" ]; then \
    echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/*; \
    fi

WORKDIR /envirotrack

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY envirotrack /envirotrack

RUN useradd -ms /bin/bash service-user
USER service-user

EXPOSE 8000

CMD ["gunicorn", "envirotrack.wsgi:application", "--bind", "0.0.0.0:8000"]
