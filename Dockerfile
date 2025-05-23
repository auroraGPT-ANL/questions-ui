FROM node:22.11.0 AS frontend
COPY frontend/package.json frontend/package-lock.json /app/
WORKDIR /app
RUN npm install
COPY frontend/ /app
ARG VITE_USE_GLOBUS=true
RUN npm run builddev

FROM python:3.12 AS backend
COPY backend/requirements.txt /app/
WORKDIR /app
RUN pip install -r requirements.txt
COPY backend/ /app
RUN mkdir -p /app/files /app/db
COPY --from=frontend /app/dist/ /app/ui
EXPOSE 8000
CMD ["./start_container.sh"]

