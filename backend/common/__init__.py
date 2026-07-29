# Shared utility package for enterprise Django backends.
# Import signal handlers so they register when Django starts
try:
    from .signals import auth_logging  # noqa: F401
except Exception:
    # Import errors during management commands (migrations/readthedocs) should not
    # crash the process; they will be visible in logs.
    pass
