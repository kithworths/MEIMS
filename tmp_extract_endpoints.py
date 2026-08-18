import re, pathlib, json
root=pathlib.Path(r'C:/Projects/MEIMS')
front=root/'frontend'/'src'
tokens=set()
for p in front.rglob('*.ts'):
    text=p.read_text(encoding='utf-8')
    for m in re.finditer(r"api\.(?:get|post|put|patch|delete)\(\s*([`\'\"])(.*?)\1", text):
        tokens.add(m.group(2))
    for m in re.finditer(r"api\(\s*([`\'\"])(.*?)\1", text):
        tokens.add(m.group(2))
print('FRONTEND TOKENS', len(tokens))
print(json.dumps(sorted(tokens), indent=2))
