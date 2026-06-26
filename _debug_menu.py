import requests, json
from pathlib import Path

def _load_env(path):
    env = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env

token = _load_env(Path(__file__).parent / ".env")["VITE_DIRECTUS_TOKEN"]
URL = "https://cms.blasalviz.com"
H = {"Authorization": f"Bearer {token}"}

# Fetch one wine item with variants
r = requests.get(f"{URL}/items/menu_items?fields=*,variants.*,category.name&filter[subcategory][_eq]=wine&limit=1", headers=H)
print("Status:", r.status_code)
data = r.json().get("data", [])
if data:
    print(json.dumps(data[0], indent=2))
else:
    print("No data returned")

# Also check what fields exist on menu_items
print("\n--- Checking menu_item_variants directly ---")
r2 = requests.get(f"{URL}/items/menu_item_variants?limit=2", headers=H)
print("Status:", r2.status_code)
print(json.dumps(r2.json().get("data", []), indent=2))
