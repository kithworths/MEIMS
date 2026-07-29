# MEIMS Backup Guide

This guide explains backups for MEIMS production data.

## Backup scope

Back up the following resources:

- PostgreSQL database
- Uploaded media files and documents
- Application configuration and environment files

## PostgreSQL backup

Use `pg_dump` or continuous WAL backup for PostgreSQL:

```bash
pg_dump -U <dbuser> -h <dbhost> -p <dbport> -Fc <dbname> > meims-db-$(date +%F).dump
```

Restore with:

```bash
pg_restore -U <dbuser> -h <dbhost> -p <dbport> -d <dbname> meims-db-YYYY-MM-DD.dump
```

## Media backup

Snapshot the media directory regularly:

```bash
tar czf meims-media-$(date +%F).tar.gz /path/to/backend/media
```

## Retention and verification

- Keep at least 30 days of backups for database and media.
- Store compressed backups in a secure location.
- Verify backups by restoring into a staging environment periodically.
