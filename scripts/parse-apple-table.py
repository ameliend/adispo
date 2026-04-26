#!/usr/bin/env python3
"""
Extrait les titres d'un HTML tableau Apple TV et génère un JSON pour generate-sql.js

Usage:
  python3 scripts/parse-apple-table.py --input apple.html
  python3 scripts/parse-apple-table.py --input apple.html --output mes-titres.json
  python3 scripts/parse-apple-table.py --input apple.html --append

Structure HTML attendue :
  <tr>
    <td headers="view-title-table-column">Titre</td>
    <td headers="view-nothing-table-column"><a href="https://tv.apple.com/...">Apple TV</a></td>
    ...
  </tr>

Chaque ligne génère deux entrées JSON : une pour "apple" (avec le lien) et une pour "canal".
"""

import json
import argparse
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("❌  BeautifulSoup manquant. Installe-le avec :")
    print("    pip3 install beautifulsoup4")
    exit(1)


def extract_titles(html_file):
    with open(html_file, "rb") as f:
        soup = BeautifulSoup(f, "html.parser")

    entries = []
    seen = set()

    for tr in soup.select("tr"):
        title_td = tr.find("td", headers="view-title-table-column")
        if not title_td:
            continue

        title = title_td.get_text(strip=True)
        if not title:
            continue

        # Dédoublonne par titre
        if title.lower() in seen:
            continue
        seen.add(title.lower())

        # Cherche le lien Apple TV dans la ligne
        apple_link = ""
        for a in tr.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(strip=True)
            if "tv.apple.com" in href or text == "Apple TV":
                apple_link = href
                break

        base = {
            "status": "available",
            "trust_level": "fiable",
            "validation_count": 5,
        }

        entries.append({**base, "title": title, "platform": "apple", "link": apple_link})
        entries.append({**base, "title": title, "platform": "canal", "link": ""})

    return entries


def main():
    parser = argparse.ArgumentParser(description="Parse tableau Apple TV HTML → JSON")
    parser.add_argument("--input",  "-i", required=True, help="Fichier HTML source")
    parser.add_argument("--output", "-o", default=None,  help="Fichier JSON de sortie (défaut : scripts/seed-data.json)")
    parser.add_argument("--append", "-a", action="store_true", help="Ajoute au fichier existant sans doublons")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌  Fichier introuvable : {input_path}")
        exit(1)

    output_path = Path(args.output) if args.output else Path(__file__).parent / "seed-data.json"

    entries = extract_titles(input_path)

    if not entries:
        print("⚠️  Aucun titre trouvé. Vérifie que le HTML contient bien des <td headers='view-title-table-column'>")
        exit(1)

    if args.append and output_path.exists():
        existing = json.loads(output_path.read_text(encoding="utf-8"))
        existing_keys = {(e["title"].lower(), e["platform"]) for e in existing}
        new_entries = [e for e in entries if (e["title"].lower(), e["platform"]) not in existing_keys]
        combined = existing + new_entries
        output_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅  {len(new_entries)} nouvelles entrées ajoutées ({len(existing)} existantes conservées)")
        print(f"    Total : {len(combined)} entrées dans {output_path}")
    else:
        output_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
        titles_count = len(entries) // 2
        print(f"✅  {titles_count} titres extraits → {len(entries)} entrées (apple + canal) → {output_path}")

    print(f"\n    Prochaine étape : npm run generate-sql")


if __name__ == "__main__":
    main()
