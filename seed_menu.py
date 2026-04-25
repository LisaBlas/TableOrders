"""
Seed Directus menu_items and menu_item_variants from constants.js data.
Reads credentials from project root .env
"""
import os, json, requests
from pathlib import Path
from dotenv import dotenv_values

DIRECTUS_URL = "https://cms.blasalviz.com"

cfg = dotenv_values(Path(__file__).parent / ".env")
ADMIN_EMAIL = cfg["ADMIN_EMAIL"]
ADMIN_PASSWORD = cfg["ADMIN_PASSWORD"]

# ── Auth ──────────────────────────────────────────────────────────────────────
r = requests.post(f"{DIRECTUS_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
r.raise_for_status()
token = r.json()["data"]["access_token"]
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("[OK] authenticated")

# ── Fetch categories ──────────────────────────────────────────────────────────
r = requests.get(f"{DIRECTUS_URL}/items/categories?limit=-1", headers=H)
r.raise_for_status()
categories = {c["name"]: c["id"] for c in r.json()["data"]}
print(f"[OK] categories: {list(categories.keys())}")

# ── Clear existing menu items ─────────────────────────────────────────────────
print("[INFO] Deleting existing menu items...")

# Get all variants and delete individually
r = requests.get(f"{DIRECTUS_URL}/items/menu_item_variants?limit=-1", headers=H)
if r.ok:
    variants = r.json()["data"]
    for v in variants:
        requests.delete(f"{DIRECTUS_URL}/items/menu_item_variants/{v['id']}", headers=H)
    print(f"[OK] Deleted {len(variants)} variants")
else:
    print(f"[WARN] Could not fetch variants: {r.status_code}")

# Get all menu items and delete individually
r = requests.get(f"{DIRECTUS_URL}/items/menu_items?limit=-1", headers=H)
if r.ok:
    items = r.json()["data"]
    for item in items:
        requests.delete(f"{DIRECTUS_URL}/items/menu_items/{item['id']}", headers=H)
    print(f"[OK] Deleted {len(items)} menu items")
else:
    print(f"[WARN] Could not fetch menu items: {r.status_code}")

MIN_QTY_2 = {"f2", "f11", "f12", "f28"}

MENU = {
    "Food": [
        {"id_local": "f1",  "name": "Small Cheese Plate",         "short_name": "CP KL",             "price": 10,   "subcategory": "cheese",  "pos_id": "11"},
        {"id_local": "f2",  "name": "Cheese Plate",               "short_name": "CP",                "price": 11,   "subcategory": "cheese",  "pos_id": "10"},
        {"id_local": "f4",  "name": "Charcuterie Klein",          "short_name": "CH KL",             "price": 11,   "subcategory": "cheese",  "pos_id": "16"},
        {"id_local": "f32", "name": "Charcuterie Gross",          "short_name": "CH GR",             "price": 22,   "subcategory": "cheese",  "pos_id": "17"},
        {"id_local": "f5",  "name": "Mixed Plate",                "short_name": "MIX",               "price": 25,   "subcategory": "cheese",  "pos_id": "12"},
        {"id_local": "f29", "name": "Charcuterie dazu",           "short_name": "CH Dazu",           "price": 6.5,  "subcategory": "cheese",  "pos_id": "18"},
        {"id_local": "f6",  "name": "Marcelin Chaud",             "short_name": "STM",               "price": 9,    "subcategory": "warm",    "pos_id": "418"},
        {"id_local": "f7",  "name": "Camembert Rôti",             "short_name": "CAM",               "price": 17,   "subcategory": "warm",    "pos_id": "401"},
        {"id_local": "f8",  "name": "Mont d'Or",                  "short_name": "Mont d'Or",         "price": 29,   "subcategory": "warm",    "pos_id": "421"},
        {"id_local": "f9",  "name": "Tartiflette",                "short_name": "Tartif",            "price": 15,   "subcategory": "warm",    "pos_id": "21"},
        {"id_local": "f10", "name": "Tartiflette + Speck",        "short_name": "Tartif + Speck",    "price": 17,   "subcategory": "warm",    "pos_id": "21-1"},
        {"id_local": "f11", "name": "Raclette",                   "short_name": "Raclette",          "price": 28,   "subcategory": "warm",    "pos_id": "24"},
        {"id_local": "f12", "name": "Fondue",                     "short_name": "Fondue",            "price": 28,   "subcategory": "warm",    "pos_id": "23"},
        {"id_local": "f28", "name": "Fondue Alkoholfrei",         "short_name": "Fondue Alkfrei",    "price": 28,   "subcategory": "warm",    "pos_id": "23"},
        {"id_local": "f30", "name": "Tartine",                    "short_name": "Tartine",           "price": 13.5, "subcategory": "warm",    "pos_id": "26"},
        {"id_local": "f31", "name": "Tartine + Schinken",         "short_name": "Tartine + Schinken","price": 15.5, "subcategory": "warm",    "pos_id": "26-1"},
        {"id_local": "f33", "name": "Chicorée Caramel",           "short_name": "CHIC",              "price": 15,   "subcategory": "warm",    "pos_id": "22"},
        {"id_local": "f17", "name": "Basic",                      "short_name": "BASIS",             "price": 7,    "subcategory": "salads",  "pos_id": "40"},
        {"id_local": "f13", "name": "Seguin",                     "short_name": "SEG",               "price": 12.5, "subcategory": "salads",  "pos_id": "41"},
        {"id_local": "f21", "name": "Seguin + Speck",             "short_name": "SEG + Speck",       "price": 14.5, "subcategory": "salads",  "pos_id": "41-1"},
        {"id_local": "f14", "name": "Papillon",                   "short_name": "PAP",               "price": 13.5, "subcategory": "salads",  "pos_id": "43"},
        {"id_local": "f22", "name": "Papillon + Serrano",         "short_name": "PAP + Serrano",     "price": 15.5, "subcategory": "salads",  "pos_id": "43-1"},
        {"id_local": "f15", "name": "Bauern",                     "short_name": "BAU",               "price": 12.5, "subcategory": "salads",  "pos_id": "44"},
        {"id_local": "f23", "name": "Bauern + Kartoffeln",        "short_name": "BAU + Kartoffeln",  "price": 15,   "subcategory": "salads",  "pos_id": "44"},
        {"id_local": "f16", "name": "Porthos",                    "short_name": "POT",               "price": 13,   "subcategory": "salads",  "pos_id": "42"},
        {"id_local": "f24", "name": "Porthos + Serrano",          "short_name": "POT + Serrano",     "price": 15,   "subcategory": "salads",  "pos_id": "42-1"},
        {"id_local": "f18", "name": "Tarte Tatin",                "short_name": "TT",                "price": 7,    "subcategory": "snacks",  "pos_id": "30"},
        {"id_local": "f27", "name": "Tarte Tatin + Calvados",     "short_name": "TT + Calva",        "price": 10,   "subcategory": "snacks",  "pos_id": "30-1"},
        {"id_local": "f19", "name": "Olives",                     "short_name": "OLV",               "price": 3,    "subcategory": "snacks",  "pos_id": "9"},
        {"id_local": "f20", "name": "Olives + Grissini",          "short_name": "OLV + Grissini",    "price": 5.5,  "subcategory": "snacks",  "pos_id": "9-1"},
        {"id_local": "f26", "name": "Cornichons",                 "short_name": "Cornichons",        "price": 2.5,  "subcategory": "extras",  "pos_id": "20"},
        {"id_local": "f34", "name": "Bratkartoffeln",             "short_name": "Bratkart",          "price": 4,    "subcategory": "extras",  "pos_id": "20"},
        {"id_local": "f35", "name": "Salzkartoffeln",             "short_name": "Salzkart",          "price": 3,    "subcategory": "extras",  "pos_id": "20"},
    ],
    "Wines": [
        {"id_local": "sancerre_bottle",       "name": "Sancerre Fl.",              "short_name": "Sanc",       "subcategory": "white",    "variants": [{"type":"here","price":38,  "label":"Here",      "pos_id":"255","pos_name":"Sanc Fl."},       {"type":"togo","price":27.5,"label":"Fl. To Go","pos_id":"255","pos_name":"Sanc Fl. To Go"}]},
        {"id_local": "chablis_bottle",        "name": "Chablis Fl.",               "short_name": "Chab",       "subcategory": "white",    "variants": [{"type":"here","price":38,  "label":"Here",      "pos_id":"259","pos_name":"Chab Fl."},       {"type":"togo","price":27.5,"label":"Fl. To Go","pos_id":"259","pos_name":"Chab Fl. To Go"}]},
        {"id_local": "riesling_bottle",       "name": "Riesling Fl.",              "short_name": "Riesl",      "subcategory": "white",    "variants": [{"type":"here","price":24.5,"label":"Here",      "pos_id":"257","pos_name":"Riesl Fl."},      {"type":"togo","price":13,  "label":"Fl. To Go","pos_id":"257","pos_name":"Riesl Fl. To Go"}]},
        {"id_local": "entre_deux_mers_bottle","name": "Entre-Deux-Mers Fl.",       "short_name": "EdM",        "subcategory": "white",    "variants": [{"type":"here","price":23,  "label":"Here",      "pos_id":"252","pos_name":"EdM Fl."},        {"type":"togo","price":12.5,"label":"Fl. To Go","pos_id":"252","pos_name":"EdM Fl. To Go"}]},
        {"id_local": "zotz_bottle",           "name": "Zotz Fl.",                  "short_name": "Zotz",       "subcategory": "white",    "variants": [{"type":"here","price":25.5,"label":"Here",      "pos_id":"260","pos_name":"Zotz Fl."},       {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"260","pos_name":"Zotz Fl. To Go"}]},
        {"id_local": "rocailles_bottle",      "name": "Rocailles Fl.",             "short_name": "Roca",       "subcategory": "white",    "variants": [{"type":"here","price":25.5,"label":"Here",      "pos_id":"261","pos_name":"Roca Fl."},       {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"261","pos_name":"Roca Fl. To Go"}]},
        {"id_local": "divin_sauv_bottle",     "name": "Divin Sauvignon Blanc Fl.", "short_name": "DivSauB",    "subcategory": "white",    "variants": [{"type":"here","price":25.5,"label":"Here",      "pos_id":"152","pos_name":"DivSauB Fl."},    {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"152","pos_name":"DivSauB Fl. To Go"}]},
        {"id_local": "aurore_boreale_bottle", "name": "Aurore Boréale Fl.",        "short_name": "AurBor",     "subcategory": "rosé",     "variants": [{"type":"here","price":28,  "label":"Here",      "pos_id":"282","pos_name":"AurBor Fl."},     {"type":"togo","price":17.5,"label":"Fl. To Go","pos_id":"282","pos_name":"AurBor Fl. To Go"}]},
        {"id_local": "petnat_rose_bottle",    "name": "Pét-Nat Rosé Fl.",          "short_name": "PetNatR",    "subcategory": "rosé",     "variants": [{"type":"here","price":33,  "label":"Here",      "pos_id":"199","pos_name":"PetNatR Fl."},    {"type":"togo","price":20,  "label":"Fl. To Go","pos_id":"199","pos_name":"PetNatR Fl. To Go"}]},
        {"id_local": "cremant_bottle",        "name": "Crémant Fl.",               "short_name": "Crem",       "subcategory": "sparkling", "variants": [{"type":"here","price":35,  "label":"Here",      "pos_id":"273","pos_name":"Crem Fl."},       {"type":"togo","price":26.5,"label":"Fl. To Go","pos_id":"273","pos_name":"Crem Fl. To Go"}]},
        {"id_local": "prosecco_bottle",       "name": "Prosecco Fl.",              "short_name": "Prosc",      "subcategory": "sparkling", "variants": [{"type":"here","price":23,  "label":"Here",      "pos_id":"272","pos_name":"Prosc Fl."},      {"type":"togo","price":12.5,"label":"Fl. To Go","pos_id":"272","pos_name":"Prosc Fl. To Go"}]},
        {"id_local": "graves_bottle",         "name": "Graves Fl.",                "short_name": "Grav",       "subcategory": "red",      "variants": [{"type":"here","price":32,  "label":"Here",      "pos_id":"211","pos_name":"Grav Fl."},       {"type":"togo","price":21.5,"label":"Fl. To Go","pos_id":"211","pos_name":"Grav Fl. To Go"}]},
        {"id_local": "malbec_bottle",         "name": "Malbec Fl.",                "short_name": "Malb",       "subcategory": "red",      "variants": [{"type":"here","price":29,  "label":"Here",      "pos_id":"206","pos_name":"Malb Fl."},       {"type":"togo","price":18.5,"label":"Fl. To Go","pos_id":"206","pos_name":"Malb Fl. To Go"}]},
        {"id_local": "crozes_hermitage_bottle","name": "Crozes-Hermitage Fl.",     "short_name": "CrozHer",    "subcategory": "red",      "variants": [{"type":"here","price":48,  "label":"Here",      "pos_id":"204","pos_name":"CrozHer Fl."},    {"type":"togo","price":24.5,"label":"Fl. To Go","pos_id":"204","pos_name":"CrozHer Fl. To Go"}]},
        {"id_local": "der_roth_bottle",       "name": "Der Roth Fl.",              "short_name": "DerRoth",    "subcategory": "red",      "variants": [{"type":"here","price":26,  "label":"Here",      "pos_id":"212","pos_name":"DerRoth Fl."},    {"type":"togo","price":15.5,"label":"Fl. To Go","pos_id":"212","pos_name":"DerRoth Fl. To Go"}]},
        {"id_local": "primitivo_bottle",      "name": "Primitivo Fl.",             "short_name": "Primit",     "subcategory": "red",      "variants": [{"type":"here","price":32,  "label":"Here",      "pos_id":"213","pos_name":"Primit Fl."},     {"type":"togo","price":21.5,"label":"Fl. To Go","pos_id":"213","pos_name":"Primit Fl. To Go"}]},
        {"id_local": "st_emilion_bottle",     "name": "St. Emilion Fl.",           "short_name": "StEmilion",  "subcategory": "red",      "variants": [{"type":"here","price":29,  "label":"Here",      "pos_id":"209","pos_name":"StEmi Fl."},      {"type":"togo","price":18.5,"label":"Fl. To Go","pos_id":"209","pos_name":"StEmi Fl. To Go"}]},
        {"id_local": "pinot_grisant_bottle",  "name": "Pinot Grisant Fl.",         "short_name": "PinGri",     "subcategory": "natural",  "variants": [{"type":"here","price":30,  "label":"Here",      "pos_id":"248","pos_name":"PinGri Fl."},     {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"248","pos_name":"PinGri Fl. To Go"}]},
        {"id_local": "ca_va_le_faire_bottle", "name": "Ça va le faire Fl.",        "short_name": "CavFaire",   "subcategory": "natural",  "variants": [{"type":"here","price":30,  "label":"Here",      "pos_id":"192","pos_name":"CavFaire Fl."},   {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"192","pos_name":"CavFaire Fl. To Go"}]},
        {"id_local": "bonne_mine_bottle",     "name": "Bonne Mine Fl.",            "short_name": "BonMin",     "subcategory": "natural",  "variants": [{"type":"here","price":32,  "label":"Here",      "pos_id":"242","pos_name":"BonMin Fl."},     {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"242","pos_name":"BonMin Fl. To Go"}]},
        {"id_local": "clairette_bottle",      "name": "Clairette Fl.",             "short_name": "Clair",      "subcategory": "natural",  "variants": [{"type":"here","price":30,  "label":"Here",      "pos_id":"229","pos_name":"Clair Fl."},      {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"229","pos_name":"Clair Fl. To Go"}]},
        {"id_local": "infrarouge_bottle",     "name": "Infrarouge Fl.",            "short_name": "Infra",      "subcategory": "natural",  "variants": [{"type":"here","price":29,  "label":"Here",      "pos_id":"227","pos_name":"Infra Fl."},      {"type":"togo","price":19,  "label":"Fl. To Go","pos_id":"227","pos_name":"Infra Fl. To Go"}]},
        {"id_local": "grenache_bottle",       "name": "Grenache Fl.",              "short_name": "Gren",       "subcategory": "natural",  "variants": [{"type":"here","price":30,  "label":"Here",      "pos_id":"241","pos_name":"Gren Fl."},       {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"241","pos_name":"Gren Fl. To Go"}]},
        {"id_local": "tete_claques_bottle",   "name": "Tête à Claques Fl.",        "short_name": "TeteCla",    "subcategory": "natural",  "variants": [{"type":"here","price":30,  "label":"Here",      "pos_id":"246","pos_name":"TeteCla Fl."},    {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"246","pos_name":"TeteCla Fl. To Go"}]},
        {"id_local": "deferlante_rouge_bottle","name": "Déferlante Rouge Fl.",      "short_name": "DefRouge",   "subcategory": "natural",  "variants": [{"type":"here","price":30,  "label":"Here",      "pos_id":"239","pos_name":"DefRouge Fl."},   {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"239","pos_name":"DefRouge Fl. To Go"}]},
        {"id_local": "ya_plus_qua_bottle",    "name": "Y'a plus qu'à Fl.",         "short_name": "YaPlusQ",    "subcategory": "natural",  "variants": [{"type":"here","price":29,  "label":"Here",      "pos_id":"226","pos_name":"YaPlusQ Fl."},    {"type":"togo","price":16,  "label":"Fl. To Go","pos_id":"226","pos_name":"YaPlusQ Fl. To Go"}]},
        {"id_local": "divin_rose_bottle",     "name": "Divin Rosé Fl.",            "short_name": "DivRose",    "subcategory": "natural",  "variants": [{"type":"here","price":25.5,"label":"Here",      "pos_id":"151","pos_name":"DivRose Fl."},    {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"151","pos_name":"DivRose Fl. To Go"}]},
        {"id_local": "cremant_alsace_bottle", "name": "Crémant d'Alsace Fl.",      "short_name": "CremAls",    "subcategory": "natural",  "variants": [{"type":"here","price":24,  "label":"Here",      "pos_id":"191","pos_name":"CremAls Fl."},    {"type":"togo","price":21,  "label":"Fl. To Go","pos_id":"191","pos_name":"CremAls Fl. To Go"}]},
        {"id_local": "vi_no_bottle",          "name": "Vi-No Fl.",                 "short_name": "ViNo",       "subcategory": "natural",  "variants": [{"type":"here","price":25.5,"label":"Here",      "pos_id":"153","pos_name":"ViNo Fl."},       {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"153","pos_name":"ViNo Fl. To Go"}]},
        {"id_local": "fritz_muller_bottle",   "name": "Fritz Müller Fl.",          "short_name": "FritzM",     "subcategory": "natural",  "variants": [{"type":"here","price":25.5,"label":"Here",      "pos_id":"150","pos_name":"FritzM Fl."},     {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"150","pos_name":"FritzM Fl. To Go"}]},
        {"id_local": "divin_pinot_noir_bottle","name": "Divin Pinot Noir Fl.",      "short_name": "DivPinNoir", "subcategory": "natural",  "variants": [{"type":"here","price":29,  "label":"Here",      "pos_id":"154","pos_name":"DivPinNoir Fl."},{"type":"togo","price":18.5,"label":"Fl. To Go","pos_id":"154","pos_name":"DivPinNoir Fl. To Go"}]},
    ],
    "Drinks": [
        {"id_local": "wg1",  "name": "Picpoul",              "short_name": "PP",         "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"251-1","pos_name":"Picpoul 0,1"},   {"type":"large","price":6.5, "label":"0,2","pos_id":"251-2","pos_name":"Picpoul 0,2"},   {"type":"here","price":22.5,"label":"Fl.","pos_id":"251","pos_name":"Picpoul Fl.","bottle_subcategory":"white"},      {"type":"togo","price":11.5,"label":"Fl. To Go","pos_id":"251","pos_name":"Picpoul Fl. To Go","bottle_subcategory":"white"}]},
        {"id_local": "wg2",  "name": "Sauvignon Blanc",      "short_name": "SB",         "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"256-1","pos_name":"SauB 0,1"},     {"type":"large","price":7,   "label":"0,2","pos_id":"256-2","pos_name":"SauB 0,2"},     {"type":"here","price":24,  "label":"Fl.","pos_id":"256","pos_name":"SauB Fl.","bottle_subcategory":"white"},        {"type":"togo","price":12.5,"label":"Fl. To Go","pos_id":"256","pos_name":"SauB Fl. To Go","bottle_subcategory":"white"}]},
        {"id_local": "wg3",  "name": "Grauburgunder",        "short_name": "GB",         "subcategory": "wine",   "variants": [{"type":"small","price":4,   "label":"0,1","pos_id":"254-1","pos_name":"Grau 0,1"},     {"type":"large","price":7.5, "label":"0,2","pos_id":"254-2","pos_name":"Grau 0,2"},     {"type":"here","price":25.5,"label":"Fl.","pos_id":"254","pos_name":"Grau Fl.","bottle_subcategory":"white"},        {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"254","pos_name":"Grau Fl. To Go","bottle_subcategory":"white"}]},
        {"id_local": "wg4",  "name": "Brise Marine",         "short_name": "BM",         "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"281-1","pos_name":"BrisMar 0,1"},  {"type":"large","price":7,   "label":"0,2","pos_id":"281-2","pos_name":"BrisMar 0,2"},  {"type":"here","price":24,  "label":"Fl.","pos_id":"281","pos_name":"BrisMar Fl.","bottle_subcategory":"rosé"},        {"type":"togo","price":12.5,"label":"Fl. To Go","pos_id":"281","pos_name":"BrisMar Fl. To Go","bottle_subcategory":"rosé"}]},
        {"id_local": "wg5",  "name": "Divin Sauvignon Blanc","short_name": "Divin SB",   "subcategory": "wine",   "variants": [{"type":"small","price":4,   "label":"0,1","pos_id":"152-1","pos_name":"DivSauB 0,1"},  {"type":"large","price":7.5, "label":"0,2","pos_id":"152-2","pos_name":"DivSauB 0,2"},  {"type":"here","price":25.5,"label":"Fl.","pos_id":"152","pos_name":"DivSauB Fl.","bottle_subcategory":"white"},     {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"152","pos_name":"DivSauB Fl. To Go","bottle_subcategory":"white"}]},
        {"id_local": "wg6",  "name": "Cidre",                "short_name": "Cidre",      "subcategory": "wine",   "variants": [{"type":"small","price":3,   "label":"0,1","pos_id":"299-1","pos_name":"Cidre 0,1"},    {"type":"large","price":6,   "label":"0,2","pos_id":"299-2","pos_name":"Cidre 0,2"},    {"type":"here","price":21,  "label":"Fl.","pos_id":"299","pos_name":"Cidre Fl.","bottle_subcategory":"sparkling"},   {"type":"togo","price":10.5,"label":"Fl. To Go","pos_id":"299","pos_name":"Cidre Fl. To Go","bottle_subcategory":"sparkling"}]},
        {"id_local": "wg7",  "name": "Sekt",                 "short_name": "Sekt",       "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"271-1","pos_name":"Sekt 0,1"},     {"type":"large","price":7,   "label":"0,2","pos_id":"271-2","pos_name":"Sekt 0,2"},     {"type":"here","price":28,  "label":"Fl.","pos_id":"271","pos_name":"Sekt Fl.","bottle_subcategory":"sparkling"},    {"type":"togo","price":17.5,"label":"Fl. To Go","pos_id":"271","pos_name":"Sekt Fl. To Go","bottle_subcategory":"sparkling"}]},
        {"id_local": "wg8",  "name": "Pét-Nat",              "short_name": "PetNat",     "subcategory": "wine",   "variants": [{"type":"small","price":4,   "label":"0,1","pos_id":"198-1","pos_name":"PetNat 0,1"},   {"type":"large","price":8,   "label":"0,2","pos_id":"198-2","pos_name":"PetNat 0,2"},   {"type":"here","price":36,  "label":"Fl.","pos_id":"198","pos_name":"PetNat Fl.","bottle_subcategory":"sparkling"},   {"type":"togo","price":20,  "label":"Fl. To Go","pos_id":"198","pos_name":"PetNat Fl. To Go","bottle_subcategory":"sparkling"}]},
        {"id_local": "wg9",  "name": "Montepulciano",        "short_name": "Monte",      "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"205-1","pos_name":"Montep 0,1"},   {"type":"large","price":6.5, "label":"0,2","pos_id":"205-2","pos_name":"Montep 0,2"},   {"type":"here","price":22.5,"label":"Fl.","pos_id":"205","pos_name":"Montep Fl.","bottle_subcategory":"red"},        {"type":"togo","price":11,  "label":"Fl. To Go","pos_id":"205","pos_name":"Montep Fl. To Go","bottle_subcategory":"red"}]},
        {"id_local": "wg10", "name": "Gamay",                "short_name": "Gamay",      "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"202-1","pos_name":"Gamay 0,1"},    {"type":"large","price":7.5, "label":"0,2","pos_id":"202-2","pos_name":"Gamay 0,2"},    {"type":"here","price":25.5,"label":"Fl.","pos_id":"202","pos_name":"Gamay Fl.","bottle_subcategory":"red"},         {"type":"togo","price":14,  "label":"Fl. To Go","pos_id":"202","pos_name":"Gamay Fl. To Go","bottle_subcategory":"red"}]},
        {"id_local": "wg11", "name": "Carignan",             "short_name": "Car",        "subcategory": "wine",   "variants": [{"type":"small","price":4,   "label":"0,1","pos_id":"208-1","pos_name":"Carig 0,1"},    {"type":"large","price":8,   "label":"0,2","pos_id":"208-2","pos_name":"Carig 0,2"},    {"type":"here","price":27,  "label":"Fl.","pos_id":"208","pos_name":"Carig Fl.","bottle_subcategory":"red"},         {"type":"togo","price":15.5,"label":"Fl. To Go","pos_id":"208","pos_name":"Carig Fl. To Go","bottle_subcategory":"red"}]},
        {"id_local": "wg12", "name": "Yellow Muskateller",   "short_name": "Y. Muskat",  "subcategory": "wine",   "variants": [{"type":"small","price":4.5, "label":"0,1","pos_id":"194-1","pos_name":"YellM 0,1"},    {"type":"large","price":9,   "label":"0,2","pos_id":"194-2","pos_name":"YellM 0,2"},    {"type":"here","price":30,  "label":"Fl.","pos_id":"194","pos_name":"YellM Fl.","bottle_subcategory":"natural"},    {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"194","pos_name":"YellM Fl. To Go","bottle_subcategory":"natural"}]},
        {"id_local": "wg13", "name": "Cuvée des Galets",     "short_name": "C. Galets",  "subcategory": "wine",   "variants": [{"type":"small","price":4.5, "label":"0,1","pos_id":"280-1","pos_name":"CuvGal 0,1"},   {"type":"large","price":9,   "label":"0,2","pos_id":"280-2","pos_name":"CuvGal 0,2"},   {"type":"here","price":27,  "label":"Fl.","pos_id":"280","pos_name":"CuvGal Fl.","bottle_subcategory":"natural"},    {"type":"togo","price":17,  "label":"Fl. To Go","pos_id":"280","pos_name":"CuvGal Fl. To Go","bottle_subcategory":"natural"}]},
        {"id_local": "wg15", "name": "Vino Verde",           "short_name": "VV",         "subcategory": "wine",   "variants": [{"type":"small","price":3.5, "label":"0,1","pos_id":"253-1","pos_name":"VV 0,1"},       {"type":"large","price":7,   "label":"0,2","pos_id":"253-2","pos_name":"VV 0,2"},       {"type":"here","price":24,  "label":"Fl.","pos_id":"253","pos_name":"VV Fl.","bottle_subcategory":"white"},         {"type":"togo","price":12.5,"label":"Fl. To Go","pos_id":"253","pos_name":"VV Fl. To Go","bottle_subcategory":"white"}]},
        {"id_local": "wg14", "name": "Weißweinschorle",      "short_name": "WWS",        "subcategory": "wine",   "variants": [{"type":"small","price":3,   "label":"0,1","pos_id":"69-1", "pos_name":"WeinSch 0,1"},  {"type":"large","price":6,   "label":"0,2","pos_id":"69-2", "pos_name":"WeinSch 0,2"}]},
        {"id_local": "dr1",  "name": "Aperol",               "short_name": "Aperol",     "price": 8,   "subcategory": "cocktail", "pos_id": "73"},
        {"id_local": "dr2",  "name": "Cynar",                "short_name": "Cynar",      "price": 8,   "subcategory": "cocktail", "pos_id": "76"},
        {"id_local": "dr3",  "name": "Campari",              "short_name": "Campari",    "price": 8,   "subcategory": "cocktail", "pos_id": "74"},
        {"id_local": "dr17", "name": "Kir",                  "short_name": "Kir",        "price": 5,   "subcategory": "cocktail", "pos_id": "71"},
        {"id_local": "dr18", "name": "Kir Royal",            "short_name": "Kir R.",     "price": 7.5, "subcategory": "cocktail", "pos_id": "72"},
        {"id_local": "dr19", "name": "Select",               "short_name": "Select",     "price": 8,   "subcategory": "cocktail", "pos_id": "75"},
        {"id_local": "dr20", "name": "Pastis",               "short_name": "Pastis",     "price": 6,   "subcategory": "cocktail", "pos_id": "67"},
        {"id_local": "dr5",  "name": "Pilsner Urquell",      "short_name": "PU",         "price": 3.8, "subcategory": "bier",     "pos_id": "64"},
        {"id_local": "dr6",  "name": "Störtebecker",         "short_name": "Störte",     "price": 3.8, "subcategory": "bier",     "pos_id": "66"},
        {"id_local": "dr4",  "name": "Picon Bière",          "short_name": "Picon",      "price": 4.8, "subcategory": "bier",     "pos_id": "65"},
        {"id_local": "dr7",  "name": "Fritz Cola",           "short_name": "Cola",       "price": 3.7, "subcategory": "soft",     "pos_id": "54"},
        {"id_local": "dr8",  "name": "Limo Granada",         "short_name": "Limo Granada","price": 3.8, "subcategory": "soft",    "pos_id": "55-1"},
        {"id_local": "dr9",  "name": "Limo Orange",          "short_name": "Limo Orange","price": 3.8, "subcategory": "soft",     "pos_id": "55-2"},
        {"id_local": "dr10", "name": "Limo Minze",           "short_name": "Limo Minze", "price": 3.8, "subcategory": "soft",     "pos_id": "55-3"},
        {"id_local": "dr11", "name": "Limo Pamplemousse",    "short_name": "Limo Grapefruit","price": 3.8,"subcategory": "soft",  "pos_id": "55-4"},
        {"id_local": "rahbarb_saft",       "name": "Rhabarber Saft",    "short_name": "R. Saft",    "subcategory": "soft",    "variants": [{"type":"small","price":3.5,"label":"0,2","pos_id":"56-1","pos_name":"RhabSaft klein"},{"type":"large","price":4.7,"label":"0,4","pos_id":"57-1","pos_name":"RhabSaft groß"}]},
        {"id_local": "rhabarb_schorle",    "name": "Rhabarber Schorle", "short_name": "R. Schorle", "subcategory": "soft",    "variants": [{"type":"small","price":3,  "label":"0,2","pos_id":"58-1","pos_name":"RhabSch klein"}, {"type":"large","price":4,  "label":"0,4","pos_id":"59-1","pos_name":"RhabSch groß"}]},
        {"id_local": "apfel_schorle",      "name": "Apfelschorle",      "short_name": "A. Schorle", "subcategory": "soft",    "variants": [{"type":"small","price":3,  "label":"0,2","pos_id":"58-2","pos_name":"ApfSch klein"},  {"type":"large","price":4,  "label":"0,4","pos_id":"59-2","pos_name":"ApfSch groß"}]},
        {"id_local": "apfel_saft",         "name": "Apfelsaft",         "short_name": "A. Saft",    "subcategory": "soft",    "variants": [{"type":"small","price":3.5,"label":"0,2","pos_id":"56-2","pos_name":"ApfSaft klein"},  {"type":"large","price":4.7,"label":"0,4","pos_id":"57-2","pos_name":"ApfSaft groß"}]},
        {"id_local": "wasser_sprudel_bottle","name": "Wasser Sprudel",  "short_name": "Sprud Wasser","subcategory": "soft",   "variants": [{"type":"small","price":1.5,"label":"0,2","pos_id":"50-1","pos_name":"Sprudel klein"},  {"type":"large","price":2.8,"label":"0,4","pos_id":"51-1","pos_name":"Sprudel groß"},  {"type":"bottle","price":5.5,"label":"Fl.","pos_id":"52","pos_name":"Sprudel Fl."}]},
        {"id_local": "wasser_bottle",      "name": "Mineralwasser",     "short_name": "M. Wasser",  "subcategory": "soft",    "variants": [{"type":"small","price":1.5,"label":"0,2","pos_id":"50-2","pos_name":"Wass klein"},    {"type":"large","price":2.8,"label":"0,4","pos_id":"51-2","pos_name":"Wass groß"},    {"type":"bottle","price":5.5,"label":"Fl.","pos_id":"52","pos_name":"Wasser Fl."}]},
        {"id_local": "leitungswasser",     "name": "Leitungswasser",    "short_name": "LW",         "price": 0,   "subcategory": "soft",    "pos_id": "0"},
        {"id_local": "cognac",             "name": "Cognac",            "short_name": "Cognac",     "subcategory": "schnaps", "variants": [{"type":"small","price":4.5,"label":"0,2","pos_id":"84","pos_name":"Cognac 0,2"},       {"type":"large","price":8.5,"label":"0,4","pos_id":"85","pos_name":"Cognac 0,4"}]},
        {"id_local": "calvados",           "name": "Calvados",          "short_name": "Calva",      "subcategory": "schnaps", "variants": [{"type":"small","price":3.5,"label":"0,2","pos_id":"86","pos_name":"Calvados 0,2"},     {"type":"large","price":6.5,"label":"0,4","pos_id":"87","pos_name":"Calvados 0,4"}]},
        {"id_local": "mirabelle",          "name": "Mirabelle",         "short_name": "Mirabelle",  "subcategory": "schnaps", "variants": [{"type":"small","price":3,  "label":"0,2","pos_id":"80","pos_name":"Mirabelle 0,2"},    {"type":"large","price":5.5,"label":"0,4","pos_id":"81","pos_name":"Mirabelle 0,4"}]},
        {"id_local": "jameson",            "name": "Jameson",           "short_name": "Jameson",    "subcategory": "schnaps", "variants": [{"type":"small","price":3,  "label":"0,2","pos_id":"82","pos_name":"Jameson 0,2"},      {"type":"large","price":5.5,"label":"0,4","pos_id":"83","pos_name":"Jameson 0,4"}]},
        {"id_local": "creme_calvados",     "name": "Crème de Calvados", "short_name": "Crème de Calva","subcategory": "schnaps","variants": [{"type":"small","price":4,  "label":"0,2","pos_id":"88","pos_name":"Creme Calvados 0,2"},{"type":"large","price":7.5,"label":"0,4","pos_id":"89","pos_name":"Creme Calvados 0,4"}]},
        {"id_local": "te1", "name": "Pfefferminze",  "short_name": "PfefMin",        "price": 3,   "subcategory": "warm",    "pos_id": "93-1"},
        {"id_local": "te2", "name": "Kamille",       "short_name": "Kamil",          "price": 3,   "subcategory": "warm",    "pos_id": "93-2"},
        {"id_local": "te3", "name": "Salbei",        "short_name": "Salb",           "price": 3,   "subcategory": "warm",    "pos_id": "93-3"},
        {"id_local": "te4", "name": "Kräuter",       "short_name": "Kraut",          "price": 3,   "subcategory": "warm",    "pos_id": "93-4"},
        {"id_local": "te5", "name": "Bergtee",       "short_name": "BergT",          "price": 3.7, "subcategory": "warm",    "pos_id": "94-1"},
        {"id_local": "te6", "name": "Thymian",       "short_name": "Thym",           "price": 3.7, "subcategory": "warm",    "pos_id": "94-2"},
        {"id_local": "te7", "name": "Heiße Zitrone", "short_name": "H. Zitrone",     "price": 3.7, "subcategory": "warm",    "pos_id": "94-3", "pos_name": "H. Zitrone"},
        {"id_local": "te8", "name": "Heiße Orange",  "short_name": "H. Orange",      "price": 5,   "subcategory": "warm",    "pos_id": "95",   "pos_name": "H. Orange"},
        {"id_local": "co1", "name": "Espresso",      "short_name": "Espresso",       "price": 1.9, "subcategory": "warm",    "pos_id": "91",   "pos_name": "Espr"},
        {"id_local": "co2", "name": "Café Crème",    "short_name": "Café Crema",     "price": 2.6, "subcategory": "warm",    "pos_id": "90",   "pos_name": "CafCr"},
    ],
    "Shop": [
        {"id_local": "sh1",  "name": "Rillettes Thunfisch",          "short_name": "Rill Thun",      "price": 5.8,  "subcategory": "fish",    "pos_id": "965", "pos_name": "Rillettes Lachs/Thunfisch"},
        {"id_local": "sh2",  "name": "Rillettes Lachs",              "short_name": "Rill Lachs",     "price": 5.8,  "subcategory": "fish",    "pos_id": "965", "pos_name": "Rillettes Lachs/Thunfisch"},
        {"id_local": "sh3",  "name": "Terrine 180g Schwein Speck",   "short_name": "Terr 180 Schw",  "price": 6.3,  "subcategory": "spreads", "pos_id": "960", "pos_name": "Terrine/Rillettes 180g"},
        {"id_local": "sh4",  "name": "Terrine 180g Fines",           "short_name": "Terr 180 Fines", "price": 6.3,  "subcategory": "spreads", "pos_id": "960", "pos_name": "Terrine/Rillettes 180g"},
        {"id_local": "sh5",  "name": "Terrine 180g Lapin",           "short_name": "Terr 180 Lapin", "price": 6.3,  "subcategory": "spreads", "pos_id": "960", "pos_name": "Terrine/Rillettes 180g"},
        {"id_local": "sh6",  "name": "Terrine 180g Canard",          "short_name": "Terr 180 Canard","price": 6.3,  "subcategory": "spreads", "pos_id": "960", "pos_name": "Terrine/Rillettes 180g"},
        {"id_local": "sh7",  "name": "Terrine 100g Canard",          "short_name": "Terr 100 Canard","price": 4.8,  "subcategory": "spreads", "pos_id": "961", "pos_name": "Terrine/Rillettes 100g"},
        {"id_local": "sh8",  "name": "Terrine 100g Oie",             "short_name": "Terr 100 Oie",   "price": 4.8,  "subcategory": "spreads", "pos_id": "961", "pos_name": "Terrine/Rillettes 100g"},
        {"id_local": "sh9",  "name": "Terrine 100g Riesling",        "short_name": "Terr 100 Riesl", "price": 4.8,  "subcategory": "spreads", "pos_id": "961", "pos_name": "Terrine/Rillettes 100g"},
        {"id_local": "sh10", "name": "Makrele Sancerre",             "short_name": "Makrele",        "price": 6.7,  "subcategory": "fish",    "pos_id": "968", "pos_name": "Makrele Sancerre"},
        {"id_local": "sh11", "name": "Sardinen Zitrone",             "short_name": "Sard Zitrone",   "price": 5.8,  "subcategory": "fish",    "pos_id": "967", "pos_name": "Sardinen"},
        {"id_local": "sh12", "name": "Sardinen Olivenöl",            "short_name": "Sard Olivenöl",  "price": 5.8,  "subcategory": "fish",    "pos_id": "967", "pos_name": "Sardinen"},
        {"id_local": "sh13", "name": "Sardinen Moutarde",            "short_name": "Sard Moutarde",  "price": 5.8,  "subcategory": "fish",    "pos_id": "967", "pos_name": "Sardinen"},
        {"id_local": "sh14", "name": "Sardinen Echalotes",           "short_name": "Sard Echalot",   "price": 5.8,  "subcategory": "fish",    "pos_id": "967", "pos_name": "Sardinen"},
        {"id_local": "sh15", "name": "Sardinen Olivenöl u. Zitrone", "short_name": "Sard Öl+Zitr",  "price": 5.8,  "subcategory": "fish",    "pos_id": "967", "pos_name": "Sardinen"},
        {"id_local": "sh16", "name": "Antipasti Zwei Tomaten",       "short_name": "Anti 2Tom",      "price": 4.9,  "subcategory": "spreads", "pos_id": "948", "pos_name": "Antipasti Creme"},
        {"id_local": "sh17", "name": "Antipasti Aubergine",          "short_name": "Anti Auberg",    "price": 4.9,  "subcategory": "spreads", "pos_id": "948", "pos_name": "Antipasti Creme"},
        {"id_local": "sh18", "name": "Antipasti Tomate Basilikum",   "short_name": "Anti Tom Bas",   "price": 4.9,  "subcategory": "spreads", "pos_id": "948", "pos_name": "Antipasti Creme"},
        {"id_local": "sh19", "name": "Kalamon Olivenpaste",          "short_name": "Oliv Paste",     "price": 6.75, "subcategory": "spreads", "pos_id": "903", "pos_name": "Kalamon Olivenpaste"},
        {"id_local": "sh20", "name": "Konfiture Lavendel",           "short_name": "Konf Lavend",    "price": 4,    "subcategory": "spreads", "pos_id": "941", "pos_name": "Konfiture Lavendel"},
        {"id_local": "sh21", "name": "Fleur Orange",                 "short_name": "Fleur Ora",      "price": 6.9,  "subcategory": "spreads", "pos_id": "942", "pos_name": "Fleur Orange"},
        {"id_local": "sh22", "name": "Confit Feige Walnuss",         "short_name": "Conf Feige",     "price": 4.9,  "subcategory": "spreads", "pos_id": "940", "pos_name": "Confit"},
        {"id_local": "sh23", "name": "Confit Apfel Calva",           "short_name": "Conf Apfel",     "price": 4.9,  "subcategory": "spreads", "pos_id": "940", "pos_name": "Confit"},
        {"id_local": "sh24", "name": "Confit Birne Wein",            "short_name": "Conf Birne",     "price": 4.9,  "subcategory": "spreads", "pos_id": "940", "pos_name": "Confit"},
        {"id_local": "sh25", "name": "Confit Aprikose Thym",         "short_name": "Conf Aprik",     "price": 4.9,  "subcategory": "spreads", "pos_id": "940", "pos_name": "Confit"},
        {"id_local": "sh26", "name": "Confit Mango Pfeffer",         "short_name": "Conf Mango",     "price": 4.9,  "subcategory": "spreads", "pos_id": "940", "pos_name": "Confit"},
        {"id_local": "sh27", "name": "Confit Zwiebel",               "short_name": "Conf Zwiebel",   "price": 4.9,  "subcategory": "spreads", "pos_id": "940", "pos_name": "Confit"},
        {"id_local": "sh28", "name": "Wildblumen Pinien Honig",      "short_name": "Honig Pinien",   "price": 6.5,  "subcategory": "spreads", "pos_id": "910", "pos_name": "Wildblumen Pinien Honig"},
        {"id_local": "sh29", "name": "Wildblumen Thymian Honig",     "short_name": "Honig Thym",     "price": 8,    "subcategory": "spreads", "pos_id": "911", "pos_name": "Wildblumen Thymian Honig"},
        {"id_local": "sh30", "name": "SandButterkekse",              "short_name": "SandButt",       "price": 3.5,  "subcategory": "snacks",  "pos_id": "988", "pos_name": "SandButterkekse"},
        {"id_local": "sh31", "name": "Waffelrölchen",                "short_name": "Waffel",         "price": 4.2,  "subcategory": "snacks",  "pos_id": "987", "pos_name": "Waffelrölchen"},
        {"id_local": "sh32", "name": "Zarbitterschokolade Kekse",    "short_name": "Zarbit Keks",    "price": 3.8,  "subcategory": "snacks",  "pos_id": "996", "pos_name": "Zarbitterschokolade Kekse"},
        {"id_local": "sh33", "name": "Vollmilch Schoko",             "short_name": "Vollm Schoko",   "price": 3.8,  "subcategory": "snacks",  "pos_id": "993", "pos_name": "Vollmilch Schoko"},
        {"id_local": "sh34", "name": "Schokostückchen",              "short_name": "Schoko Stück",   "price": 3.8,  "subcategory": "snacks",  "pos_id": "990", "pos_name": "Schokostückchen"},
        {"id_local": "sh35", "name": "Calisson",                     "short_name": "Calisson",       "price": 1,    "subcategory": "snacks",  "pos_id": "980", "pos_name": "Calisson"},
        {"id_local": "sh36", "name": "Schokotruffel Snack",          "short_name": "Schoko Truff",   "price": 2.5,  "subcategory": "snacks",  "pos_id": "981", "pos_name": "Schokotruffel Snack"},
        {"id_local": "sh37", "name": "Trüffel Pops 100g",            "short_name": "Trüff Pops",     "price": 5,    "subcategory": "snacks",  "pos_id": "985", "pos_name": "Trüffel Pops 100g"},
        {"id_local": "sh38", "name": "Natürtruffel",                 "short_name": "Natürtruff",     "price": 5.8,  "subcategory": "snacks",  "pos_id": "983", "pos_name": "Natürtruffel"},
        {"id_local": "sh39", "name": "Mandelgebäch mit Feige Toast", "short_name": "Mandel Feige",   "price": 4.9,  "subcategory": "snacks",  "pos_id": "971", "pos_name": "Mandelgebäch mit Feige Toast"},
        {"id_local": "sh40", "name": "Linguettes Olivenöl",          "short_name": "Ling Olivenöl",  "price": 6.8,  "subcategory": "snacks",  "pos_id": "976", "pos_name": "Linguettes"},
        {"id_local": "sh41", "name": "Linguettes Rosmarin",          "short_name": "Ling Rosmarin",  "price": 6.8,  "subcategory": "snacks",  "pos_id": "976", "pos_name": "Linguettes"},
        {"id_local": "sh42", "name": "Cracker",                      "short_name": "Cracker",        "price": 4.9,  "subcategory": "snacks",  "pos_id": "975", "pos_name": "Cracker"},
        {"id_local": "sh43", "name": "Biovette",                     "short_name": "Biovette",       "price": 4.8,  "subcategory": "snacks",  "pos_id": "973", "pos_name": "Biovette"},
        {"id_local": "sh44", "name": "Megakitiki Oliven",            "short_name": "Megakit Oliv",   "price": 6.5,  "subcategory": "snacks",  "pos_id": "901", "pos_name": "Megakitiki Oliven"},
        {"id_local": "sh55", "name": "Chips Bonilla",                "short_name": "Chips Bon.",     "price": 2.3,  "subcategory": "snacks",  "pos_id": "978", "pos_name": "Chips Bonilla"},
        {"id_local": "sh56", "name": "Feigenbrot Mandeln",           "short_name": "FeigenBrot Mand.","price": 6.5, "subcategory": "snacks",  "pos_id": "952", "pos_name": "Feigenbrot Mandeln"},
        {"id_local": "sh45", "name": "Olivenöl 0,25l",              "short_name": "Olivenöl 0.25",  "price": 9,    "subcategory": "bottles", "pos_id": "905", "pos_name": "Olivenöl 0,25l"},
        {"id_local": "sh46", "name": "Olivenöl 0,5l",               "short_name": "Olivenöl 0.5",   "price": 15,   "subcategory": "bottles", "pos_id": "906", "pos_name": "Olivenöl 0,5l"},
        {"id_local": "sh47", "name": "Olivenöl 1l",                 "short_name": "Olivenöl 1l",    "price": 26,   "subcategory": "bottles", "pos_id": "907", "pos_name": "Olivenöl 1l"},
        {"id_local": "sh48", "name": "100pct. Bergtee",             "short_name": "Bergtee",        "price": 5,    "subcategory": "bottles", "pos_id": "928", "pos_name": "100pct. Bergtee"},
        {"id_local": "sh49", "name": "Calvados Fl",                 "short_name": "Calva Fl",       "price": 22,   "subcategory": "bottles", "pos_id": "102", "pos_name": "Calvados Fl"},
        {"id_local": "sh50", "name": "Creme Calva Fl",              "short_name": "Creme Calva Fl", "price": 26,   "subcategory": "bottles", "pos_id": "103", "pos_name": "Creme Calva Fl"},
        {"id_local": "sh51", "name": "Mirabelle 0,375l",            "short_name": "Mirab 0.375",    "price": 13,   "subcategory": "bottles", "pos_id": "104", "pos_name": "Mirabelle 0,375l"},
        {"id_local": "sh52", "name": "Mirabelle 0,5l",              "short_name": "Mirab 0.5",      "price": 15,   "subcategory": "bottles", "pos_id": "105", "pos_name": "Mirabelle 0,5l"},
        {"id_local": "sh53", "name": "Picon Fl",                    "short_name": "Picon Fl",       "price": 28,   "subcategory": "bottles", "pos_id": "101", "pos_name": "Picon Fl"},
        {"id_local": "sh54", "name": "Winterlimo Fl 1l",            "short_name": "Winterlimo",     "price": 7.9,  "subcategory": "bottles", "pos_id": "60",  "pos_name": "Winterlimo Fl 1l"},
    ],
}

# ── Seed items ────────────────────────────────────────────────────────────────
created = 0
variants_created = 0
errors = 0

for category_name, items in MENU.items():
    cat_id = categories.get(category_name)
    if not cat_id:
        print(f"  ✗ category not found: {category_name} — skipping {len(items)} items")
        errors += len(items)
        continue

    for item in items:
        payload = {
            "name": item["name"],
            "short_name": item["short_name"],
            "subcategory": item.get("subcategory"),
            "pos_id": item.get("pos_id"),
            "pos_name": item.get("pos_name"),
            "category": cat_id,
            "available": True,
            "min_qty": 2 if item["id_local"] in MIN_QTY_2 else 1,
        }
        if "price" in item:
            payload["price"] = item["price"]
        elif "variants" in item:
            # Items with variants don't have a base price
            payload["price"] = 0

        r = requests.post(f"{DIRECTUS_URL}/items/menu_items", headers=H, json=payload)
        if not r.ok:
            print(f"  ✗ {item['name']}: {r.status_code} {r.text[:120]}")
            errors += 1
            continue

        menu_item_id = r.json()["data"]["id"]

        # Create variants if present
        if "variants" in item:
            for v in item["variants"]:
                vp = {
                    "menu_item_id": menu_item_id,
                    "type": v["type"],
                    "label": v["label"],
                    "price": v["price"],
                    "pos_id": v.get("pos_id"),
                    "pos_name": v.get("pos_name"),
                    "bottle_subcategory": v.get("bottle_subcategory"),
                }
                vr = requests.post(f"{DIRECTUS_URL}/items/menu_item_variants", headers=H, json=vp)
                if not vr.ok:
                    print(f"    ✗ variant {v['type']} for {item['name']}: {vr.status_code} {vr.text[:80]}")
                    errors += 1
                else:
                    variants_created += 1

        created += 1

print(f"\n{'='*40}")
print(f"[OK] {created} menu items created")
print(f"[OK] {variants_created} variants created")
if errors:
    print(f"[ERROR] {errors} errors — check output above")
else:
    print("[OK] no errors")
