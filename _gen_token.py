import requests, secrets
from pathlib import Path

def _load_env(path):
    env = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env

cfg = _load_env(Path.home() / "services/directus/.env")
URL = "https://cms.blasalviz.com"

r = requests.post(f"{URL}/auth/login", json={"email": cfg["ADMIN_EMAIL"], "password": cfg["ADMIN_PASSWORD"]})
r.raise_for_status()
jwt = r.json()["data"]["access_token"]
H = {"Authorization": f"Bearer {jwt}", "Content-Type": "application/json"}

me = requests.get(f"{URL}/users/me", headers=H).json()["data"]["id"]

static_token = secrets.token_urlsafe(32)
patch = requests.patch(f"{URL}/users/{me}", headers=H, json={"token": static_token})
patch.raise_for_status()

env_path = Path(__file__).parent / ".env"
env_path.write_text(f"VITE_DIRECTUS_URL=https://cms.blasalviz.com\nVITE_DIRECTUS_TOKEN={static_token}\n")
env_path.chmod(0o600)
print(f"[OK] .env written with new static token")
