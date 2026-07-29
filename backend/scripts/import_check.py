import sys, importlib, traceback, os
base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
failures = []
# Configure Django so that model imports work
try:
    import django
    django.setup()
except Exception as e:
    # If Django cannot be configured (missing env), continue — importing modules may still work.
    print(f'Warning: django.setup() failed: {e}', file=sys.stderr)
# Import only modules under backend/apps/* to avoid importing manage.py or settings that require env
apps_dir = os.path.join(base, 'apps')
for root, dirs, files in os.walk(apps_dir):
    if 'migrations' in root.split(os.sep) or '__pycache__' in root.split(os.sep):
        continue
    for f in files:
        if f.endswith('.py'):
            full = os.path.join(root, f)
            rel = os.path.relpath(full, base).replace(os.sep, '.')
            mod = rel[:-3]
            # only import modules starting with 'apps.'
            if not mod.startswith('apps.'):
                continue
            try:
                importlib.import_module(mod)
            except Exception:
                failures.append((mod, traceback.format_exc()))

if failures:
    print('IMPORT_FAILURES')
    for i, (mod, tb) in enumerate(failures):
        if i < 6:
            print('\n---', mod)
            print(tb)
        else:
            print('---', mod, '| (traceback suppressed)')
    sys.exit(2)
else:
    print('ALL_MODULES_IMPORTED')
