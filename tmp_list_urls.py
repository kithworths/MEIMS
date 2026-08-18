from django.urls import URLResolver, URLPattern, get_resolver

resolver = get_resolver()

patterns = []

def walk(patterns_list, prefix=''):
    for p in patterns_list:
        if isinstance(p, URLResolver):
            walk(p.url_patterns, prefix + str(p.pattern))
        elif isinstance(p, URLPattern):
            patterns.append(prefix + str(p.pattern))
        else:
            patterns.append(prefix + repr(p))

walk(resolver.url_patterns)
for p in sorted(patterns):
    print(p)
