FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ api/
COPY agent.json .
COPY agent_log.json .
COPY deployments/ deployments/

RUN mkdir -p api/data

ENV PORT=8000

EXPOSE $PORT

CMD sh -c "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"
