#!/usr/bin/env python3
"""
compare_canal.py — Compare les titres CANAL+ en base Supabase avec un nouveau fichier JSON.

Affiche les titres ajoutés et supprimés, et génère :
  - scripts/canal_toadd.sql    : INSERT pour les nouveaux titres
  - scripts/canal_todelete.sql : DELETE pour les titres disparus

Usage :
    python scripts/compare_canal.py <nouveau-fichier.json>

Le nouveau fichier JSON doit contenir des entrées au format :
    { "title": "...", "platform": "CANAL+", "status": "available",
      "link": "...", "trust_level": "fiable", "validation_count": 5 }

Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont lues
depuis le fichier .env à la racine du projet.
"""

import json
import sys
import urllib.request
import urllib.parse
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
PLATFORM_KEY = 'canal'
PLATFORM_LABEL = 'CANAL+'

TRUST_MAP = {
    'signalé': 'Signalé',
    'confirmé': 'Confirmé',
    'fiable': 'Fiable',
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def esc(s):
    return s.replace("'", "''") if s else ''


def normalize_trust(t):
    return TRUST_MAP.get((t or 'Signalé').lower(), t or 'Signalé')


def load_env():
    env = {}
    env_path = ROOT_DIR / '.env'
    if not env_path.exists():
        print(f"Erreur : fichier .env introuvable à {env_path}")
        sys.exit(1)
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, _, val = line.partition('=')
            env[key.strip()] = val.strip()
    return env


def fetch_canal_from_supabase(url, anon_key):
    """Récupère tous les titres CANAL+ depuis Supabase via REST API."""
    endpoint = (
        f"{url}/rest/v1/ad_status"
        f"?platform=eq.{PLATFORM_KEY}"
        f"&select=status,trust_level,validation_count,lien,contents(title)"
        f"&order=contents(title).asc"
        f"&limit=10000"
    )
    req = urllib.request.Request(
        endpoint,
        headers={
            'apikey': anon_key,
            'Authorization': f'Bearer {anon_key}',
            'Accept': 'application/json',
        }
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    results = []
    for row in data:
        content = row.get('contents')
        if not content:
            continue
        results.append({
            'title': content['title'],
            'platform': PLATFORM_LABEL,
            'status': row.get('status', 'available'),
            'link': row.get('lien') or '',
            'trust_level': row.get('trust_level', 'Signalé'),
            'validation_count': row.get('validation_count', 1),
        })
    return results


def load_new_file(path):
    """Charge le nouveau fichier JSON, filtre les entrées CANAL+."""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    canal_entries = [
        e for e in data
        if e.get('platform', '').upper().replace(' ', '') in ('CANAL+', 'CANAL')
    ]
    ignored = len(data) - len(canal_entries)
    if ignored:
        print(f"  ℹ️  {ignored} entrée(s) non-CANAL+ ignorée(s)")
    return canal_entries


# ── SQL generation ────────────────────────────────────────────────────────────

def generate_toadd(added_titles, existing_titles):
    lines = [
        '-- canal_toadd.sql — Nouveaux titres CANAL+ à ajouter dans Supabase\n',
        '-- Généré par scripts/compare_canal.py\n\n',
    ]

    # Titres totalement nouveaux (absents de Supabase)
    brand_new = [e for e in added_titles if e['title'] not in existing_titles]
    if brand_new:
        lines.append('-- ── Nouveaux contenus (absents de Supabase) ────────────────────\n\n')
        rows = []
        for i, e in enumerate(brand_new):
            fake_id = -5000 - i
            rows.append(f"  ({fake_id}, '{esc(e['title'])}', NULL, NULL, NULL)")
        lines.append('INSERT INTO contents (tmdb_id, title, year, genre, type)\nVALUES\n')
        lines.append(',\n'.join(rows))
        lines.append('\nON CONFLICT (tmdb_id) DO NOTHING;\n\n')

    # Nouveaux statuts CANAL+
    lines.append('-- ── Nouveaux statuts CANAL+ ────────────────────────────────────\n\n')
    for e in added_titles:
        trust = normalize_trust(e.get('trust_level', 'Signalé'))
        count = e.get('validation_count', 1)
        lien = f"'{esc(e['link'])}'" if e.get('link') else 'NULL'
        status = e.get('status', 'available')
        lines.append(
            f"INSERT INTO ad_status (content_id, platform, status, trust_level, validation_count, lien)\n"
            f"SELECT id, '{PLATFORM_KEY}', '{esc(status)}', '{esc(trust)}', {count}, {lien}\n"
            f"  FROM contents WHERE title = '{esc(e['title'])}'\n"
            f"ON CONFLICT (content_id, platform) DO NOTHING;\n\n"
        )
    return ''.join(lines)


def generate_todelete(removed_titles):
    lines = [
        '-- canal_todelete.sql — Titres CANAL+ à supprimer de Supabase\n',
        '-- Généré par scripts/compare_canal.py\n\n',
        '-- ── Suppression des statuts CANAL+ ─────────────────────────────\n\n',
    ]
    for e in removed_titles:
        lines.append(
            f"DELETE FROM ad_status\n"
            f"  WHERE content_id = (SELECT id FROM contents WHERE title = '{esc(e['title'])}')\n"
            f"    AND platform = '{PLATFORM_KEY}';\n\n"
        )
    return ''.join(lines)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    new_path = Path(sys.argv[1])
    if not new_path.exists():
        print(f"Erreur : fichier introuvable : {new_path}")
        sys.exit(1)

    # Charger les variables d'environnement
    env = load_env()
    supabase_url = env.get('VITE_SUPABASE_URL', '').rstrip('/')
    anon_key = env.get('VITE_SUPABASE_ANON_KEY', '')
    if not supabase_url or not anon_key:
        print("Erreur : VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env")
        sys.exit(1)

    print(f"Récupération des titres CANAL+ depuis Supabase…")
    current = fetch_canal_from_supabase(supabase_url, anon_key)
    print(f"  → {len(current)} titre(s) trouvé(s) en base\n")

    print(f"Chargement de {new_path}…")
    new_entries = load_new_file(new_path)
    print(f"  → {len(new_entries)} entrée(s) CANAL+ dans le fichier\n")

    # Comparaison par titre (CANAL+ = une seule plateforme donc titre suffit)
    current_titles = {e['title']: e for e in current}
    new_titles = {e['title']: e for e in new_entries}

    added = [e for title, e in new_titles.items() if title not in current_titles]
    removed = [e for title, e in current_titles.items() if title not in new_titles]
    unchanged = len(new_titles) - len(added)

    print(f"{'─'*50}")
    print(f"  ✅  Ajoutés   : {len(added)} titre(s)")
    print(f"  🗑️   Supprimés : {len(removed)} titre(s)")
    print(f"  ↔️   Inchangés : {unchanged} titre(s)")
    print(f"{'─'*50}\n")

    if added:
        print("Titres ajoutés :")
        for e in sorted(added, key=lambda x: x['title']):
            print(f"  + {e['title']}")
        print()

    if removed:
        print("Titres supprimés :")
        for e in sorted(removed, key=lambda x: x['title']):
            print(f"  - {e['title']}")
        print()

    if not added and not removed:
        print("Aucun changement détecté. Aucun fichier généré.")
        return

    existing_titles = set(current_titles.keys())

    if added:
        sql = generate_toadd(sorted(added, key=lambda x: x['title']), existing_titles)
        out = SCRIPT_DIR / 'canal_toadd.sql'
        out.write_text(sql, encoding='utf-8')
        print(f"✓ {out} généré")

    if removed:
        sql = generate_todelete(sorted(removed, key=lambda x: x['title']))
        out = SCRIPT_DIR / 'canal_todelete.sql'
        out.write_text(sql, encoding='utf-8')
        print(f"✓ {out} généré")

    print("\nExécutez ces fichiers dans Supabase → SQL Editor.")


if __name__ == '__main__':
    main()
