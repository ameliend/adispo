#!/usr/bin/env python3
"""
Extrait les titres d'un HTML JustWatch et génère un JSON pour generate-sql.js

Usage:
  python3 scripts/parse-justwatch.py --input page.html --platform canal
  python3 scripts/parse-justwatch.py --input page.html --platform netflix --output mes-titres.json

Plateformes valides : canal, netflix, disney, prime, apple
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

VALID_PLATFORMS = {"canal", "netflix", "disney", "prime", "apple"}

def extract_titles(html_content, platform):
    soup = BeautifulSoup(html_content, "html.parser")

    titles = []
    seen = set()

    # Les titres sont dans les img.picture-comp__img à l'intérieur des liens de titre
    for img in soup.find_all("img", class_="picture-comp__img"):
        alt = img.get("alt", "").strip()

        # Ignore les icônes de plateforme et les alts vides ou génériques
        if not alt or alt.lower() in {"justwatch", "logo", ""}:
            continue

        if alt in seen:
            continue

        seen.add(alt)
        titles.append({
            "title": alt,
            "platform": platform,
            "status": "available",
            "link": "",
            "trust_level": "fiable",
            "validation_count": 5
        })

    return titles


def main():
    parser = argparse.ArgumentParser(description="Parse JustWatch HTML → JSON")
    parser.add_argument("--input",    "-i", required=True,  help="Fichier HTML source")
    parser.add_argument("--platform", "-p", required=True,  help="Plateforme (canal, netflix, disney, prime, apple)")
    parser.add_argument("--output",   "-o", default=None,   help="Fichier JSON de sortie (défaut : scripts/seed-data.json)")
    parser.add_argument("--append",   "-a", action="store_true", help="Ajoute au fichier existant au lieu de l'écraser")
    args = parser.parse_args()

    platform = args.platform.lower()
    if platform not in VALID_PLATFORMS:
        print(f"❌  Plateforme invalide : '{platform}'")
        print(f"    Valides : {', '.join(sorted(VALID_PLATFORMS))}")
        exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌  Fichier introuvable : {input_path}")
        exit(1)

    output_path = Path(args.output) if args.output else Path(__file__).parent / "seed-data.json"

    html_content = input_path.read_text(encoding="utf-8")
    titles = extract_titles(html_content, platform)

    if not titles:
        print("⚠️  Aucun titre trouvé. Vérifie que le HTML contient bien des img.picture-comp__img")
        exit(1)

    # Mode append : fusionne avec le fichier existant sans doublons
    if args.append and output_path.exists():
        existing = json.loads(output_path.read_text(encoding="utf-8"))
        existing_keys = {(e["title"].lower(), e["platform"]) for e in existing}
        new_titles = [t for t in titles if (t["title"].lower(), t["platform"]) not in existing_keys]
        combined = existing + new_titles
        output_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅  {len(new_titles)} nouveaux titres ajoutés ({len(existing)} existants conservés)")
        print(f"    Total : {len(combined)} titres dans {output_path}")
    else:
        output_path.write_text(json.dumps(titles, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅  {len(titles)} titres extraits → {output_path}")

    print(f"\n    Prochaine étape : npm run generate-sql")


if __name__ == "__main__":
    main()
