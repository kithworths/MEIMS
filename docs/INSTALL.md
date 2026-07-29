# MEIMS Installation Guide

This guide explains how to install and run the MEIMS backend on Ubuntu Server for development and production environments.

## Prerequisites

- Ubuntu 22.04 or newer
- Python 3.13
- PostgreSQL 15 or later
- Redis 7 or later
- Docker and Docker Compose (for containerized deployments)
- Certbot for HTTPS certificate management

## Local development

1. Copy `backend/.env.example` to `backend/.env` and adjust the values.
2. Install Python dependencies:
   ```bash
   cd backend
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. Run database migrations:
   ```bash
   python manage.py migrate
   ```
4. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Containerized development

1. Ensure Docker is installed on the host.
2. Copy `backend/.env.example` to `backend/.env` and set `DEBUG=True`.
3. Start the stack:
   ```bash
   cd backend
   docker compose up --build
   ```
4. The backend will be available at `http://localhost:8000`.

## Notes

- Use `backend/docker-compose.yml` for development and `backend/docker-compose.prod.yml` for production-like deployments.
- Do not commit production secrets.
