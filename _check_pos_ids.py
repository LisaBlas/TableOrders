import requests, json
from pathlib import Path
from datetime import datetime, timezone

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

# --- 1. Menu items with empty parent pos_id ---
r = requests.get(
    URL + "/items/menu_items?fields=id,name,pos_id,subcategory,category.name,available"
    "&filter[pos_id][_empty]=true&limit=-1",
    headers=H
)
data = r.json().get("data", [])
print(f"Menu items with empty pos_id ({len(data)}) -- all should be variant-only items:")
for item in data:
    avail = "on" if item.get("available") else "OFF"
    cat = (item.get("category") or {}).get("name", "?")
    print(f"  [{avail}] {cat}/{item.get('subcategory','?')} | {item['name']}")

# --- 2. Variants with empty pos_id ---
r2 = requests.get(
    URL + "/items/menu_item_variants?fields=id,type,label,pos_id,menu_item_id.name"
    "&filter[pos_id][_empty]=true&limit=-1",
    headers=H
)
data2 = r2.json().get("data", [])
print(f"\nVariants with empty pos_id ({len(data2)}):")
for v in data2:
    parent = v.get("menu_item_id") or {}
    print(f"  variant {v['id']} | {parent.get('name','?')} | type={v.get('type')} label={v.get('label')}")

# --- 3. Recent bill_items with null pos_id ---
r3 = requests.get(
    URL + "/items/bill_items?fields=id,item_name,pos_id,qty,bill_id.timestamp,bill_id.table_id"
    "&filter[pos_id][_null]=true&sort=-bill_id.timestamp&limit=50",
    headers=H
)
data3 = r3.json().get("data", [])
print(f"\nRecent bill_items with null pos_id ({len(data3)}, showing up to 50):")
for item in data3:
    bill = item.get("bill_id") or {}
    ts = bill.get("timestamp", "?")
    table = bill.get("table_id", "?")
    print(f"  table={table} | {ts[:10]} | qty={item.get('qty')} | {item.get('item_name')}")
