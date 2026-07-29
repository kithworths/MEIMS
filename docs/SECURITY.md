# MEIMS Security Guide

This guide summarizes security best practices for MEIMS.

## HTTP security headers

The backend and Nginx configuration enforce:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-Frame-Options`
- `Permissions-Policy`
- `Content-Security-Policy`

## Cookie security

Production defaults support:

- `SESSION_COOKIE_SECURE`
- `CSRF_COOKIE_SECURE`
- `SESSION_COOKIE_HTTPONLY`
- `CSRF_COOKIE_HTTPONLY`
- `SameSite=Lax` by default

## Environment validation

The application verifies the following at startup and warns on missing production configuration:

- `SECRET_KEY`
- `ALLOWED_HOSTS`
- PostgreSQL database configuration
- Redis configuration
- Storage backend configuration

## SSL and certificates

Use Certbot to provision certificates and enable HTTPS. The Nginx configuration includes HSTS and secure TLS settings.
