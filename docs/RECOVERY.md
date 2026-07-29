# MEIMS Recovery Guide

This guide describes disaster recovery processes for MEIMS.

## Recovery preparation

- Maintain current backups for PostgreSQL and media files.
- Store environment configuration separately from source control.
- Document the last known good deployment version.

## Database recovery

1. Stop application services.
2. Restore PostgreSQL from a verified backup:
   ```bash
   pg_restore -U <dbuser> -h <dbhost> -p <dbport> -d <dbname> meims-db-YYYY-MM-DD.dump
   ```
3. Run migrations if required:
   ```bash
   python backend/manage.py migrate --noinput
   ```

## Media recovery

Restore media files from backup:

```bash
tar xzf meims-media-YYYY-MM-DD.tar.gz -C /path/to/backend/media
```

## Rollback procedures

- If a new deployment is unstable, revert to the prior Docker image tag.
- Use the production compose file to recreate services from the previous image.
- Confirm the application is healthy after rollback.
