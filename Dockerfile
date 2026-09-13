FROM python:3.9-slim-bookworm

ARG INSTALL_PG_CLIENT=false

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
    && if [ "$INSTALL_PG_CLIENT" = "true" ]; then \
        apt-get install -y --no-install-recommends ca-certificates wget gnupg \
        && wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg \
        && echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
        && apt-get update \
        && apt-get install -y --no-install-recommends postgresql-client-16 \
        && apt-get purge -y wget gnupg \
        && apt-get autoremove -y; \
    fi \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /envirotrack

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY envirotrack /envirotrack
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && useradd -ms /bin/bash service-user \
    && chown -R service-user:service-user /envirotrack /entrypoint.sh

USER service-user

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn"]
