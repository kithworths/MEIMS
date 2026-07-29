import multiprocessing
import os

bind = '0.0.0.0:8000'
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
threads = int(os.getenv('GUNICORN_THREADS', '2'))
timeout = int(os.getenv('GUNICORN_TIMEOUT', '120'))
keepalive = int(os.getenv('GUNICORN_KEEPALIVE', '5'))
preload_app = True
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', '1000'))
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', '100'))
graceful_timeout = int(os.getenv('GUNICORN_GRACEFUL_TIMEOUT', '30'))
loglevel = os.getenv('GUNICORN_LOG_LEVEL', 'info')
errorlog = os.getenv('GUNICORN_ERROR_LOG', '-')
accesslog = os.getenv('GUNICORN_ACCESS_LOG', '-')
capture_output = True
enable_stdio_inheritance = True
secure_scheme_headers = {'X-FORWARDED-PROTO': 'https'}

# Limit header fields for more secure production behavior.
limit_request_fields = 100
limit_request_field_size = 8190
