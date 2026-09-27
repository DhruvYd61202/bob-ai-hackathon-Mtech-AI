import httpx
import re

try:
    r = httpx.get('https://bob.ibm.com', timeout=10.0)
    matches = set(re.findall(r'https?://[^\s"\'<>]+', r.text))
    print(f"Total unique URLs: {len(matches)}")
    for m in sorted(matches):
        if any(k in m.lower() for k in ['api', 'v1', 'v2', 'endpoint', 'agent', 'auth', 'cloud']):
            print(" ", m)
except Exception as e:
    print("Error:", e)
