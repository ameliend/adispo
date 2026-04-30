#!/usr/bin/env python3
"""
compare_seeds.py — Compare seed-data.json avec un nouveau fichier JSON.

Génère deux fichiers SQL :
  - scripts/toadd.sql    : insère les nouveaux titres/statuts
  - scripts/todelete.sql : supprime les titres/statuts disparus

Usage :
    python scripts/compare_seeds.py <nouveau-fichier.json>

La clé de comparaison est (title, platform). Un titre peut apparaître
plusieurs fois s'il est présent sur plusieurs plateformes.
"""

import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent

PLATFORM_MAP = {
    # CANAL+
    'CANAL+': 'canal', 'Canal+': 'canal', 'canal+': 'canal', 'canal': 'canal',
    # Netflix
    'Netflix': 'netflix', 'NETFLIX': 'netflix', 'netflix': 'netflix',
    # Disney+
    'Disney+': 'disney', 'DISNEY+': 'disney', 'disney+': 'disney', 'disney': 'disney',
    # Prime Video
    'Prime Video': 'prime', 'PRIME VIDEO': 'prime', 'prime video': 'prime', 'prime': 'prime',
    # Apple TV+
    'Apple TV+': 'apple', 'APPLE TV+': 'apple', 'apple tv+': 'apple', 'apple': 'apple',
    # Arte
    'Arte': 'arte', 'ARTE': 'arte', 'arte': 'arte',
    # TF1+
    'TF1+': 'tf1plus', 'tf1+': 'tf1plus', 'TF1 +': 'tf1plus', 'tf1plus': 'tf1plus',
    # M6+
    'M6+': 'm6plus', 'm6+': 'm6plus', 'm6plus': 'm6plus',
    # HBO Max
    'HBO Max': 'hbomax', 'Max': 'hbomax', 'max': 'hbomax', 'hbomax': 'hbomax',
    # Paramount+
    'Paramount+': 'paramount', 'paramount+': 'paramount', 'paramount': 'paramount',
    # Divers
    'CINÉ+OCS': 'cineocs', 'cineocs': 'cineocs',
    'M6': 'm6', 'm6': 'm6',
}

TRUST_MAP = {
    'signalé': 'Signalé',
    'confirmé': 'Confirmé',
    'fiable': 'Fiable',
}

# Les IDs négatifs -1 à -1120 sont utilisés par import.sql
# Les IDs -2000 à -3000 sont utilisés par seed-part-*.sql
# On commence à -4000 pour les nouveaux titres
NEW_CONTENT_ID_START = -4000


def esc(s):
    return s.replace("'", "''") if s else ''


def normalize_platform(p):
    return PLATFORM_MAP.get(p, p)


def normalize_trust(t):
    return TRUST_MAP.get((t or 'Signalé').lower(), t or 'Signalé')


def entry_key(entry):
    return (entry['title'], normalize_platform(entry['platform']))


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def make_entry_map(entries):
    result = {}
    for e in entries:
        key = entry_key(e)
        if key in result:
            print(f"  ⚠ Doublon ignoré : {key}")
        else:
            result[key] = e
    return result


def generate_toadd(added_entries, old_titles):
    """
    Génère toadd.sql.
    - Pour les titres totalement nouveaux (pas dans old_titles) :
      INSERT INTO contents avec un tmdb_id temporaire négatif.
    - Pour tous les nouveaux statuts :
      INSERT INTO ad_status via SELECT sur le titre.
    """
    lines = [
        '-- toadd.sql — Nouveaux titres et statuts à ajouter dans Supabase\n',
        '-- Généré par scripts/compare_seeds.py\n\n',
    ]

    # Titres vraiment nouveaux (absents de seed-data.json)
    new_titles = {}
    for e in added_entries:
        title = e['title']
        if title not in old_titles and title not in new_titles:
            new_titles[title] = e

    if new_titles:
        lines.append('-- ── Nouveaux contenus ──────────────────────────────────────────\n')
        lines.append(
            '-- Ces titres sont absents de seed-data.json.\n'
            '-- Les tmdb_id négatifs sont temporaires ; mettez à jour avec\n'
            '-- les vrais tmdb_id si besoin.\n\n'
        )
        rows = []
        for i, (title, _e) in enumerate(new_titles.items()):
            fake_id = NEW_CONTENT_ID_START - i
            rows.append(f"  ({fake_id}, '{esc(title)}', NULL, NULL, NULL)")

        lines.append('INSERT INTO contents (tmdb_id, title, year, genre, type)\nVALUES\n')
        lines.append(',\n'.join(rows))
        lines.append('\nON CONFLICT (tmdb_id) DO NOTHING;\n\n')

    # Nouveaux statuts (ad_status)
    lines.append('-- ── Nouveaux statuts audiodescription ──────────────────────────\n\n')
    for e in added_entries:
        title = e['title']
        platform = normalize_platform(e['platform'])
        status = e.get('status', 'available')
        trust = normalize_trust(e.get('trust_level', 'Signalé'))
        count = e.get('validation_count', 1)
        lien = f"'{esc(e['link'])}'" if e.get('link') else 'NULL'

        lines.append(
            f"INSERT INTO ad_status (content_id, platform, status, trust_level, validation_count, lien)\n"
            f"SELECT id, '{esc(platform)}', '{esc(status)}', '{esc(trust)}', {count}, {lien}\n"
            f"  FROM contents WHERE title = '{esc(title)}'\n"
            f"ON CONFLICT (content_id, platform) DO NOTHING;\n\n"
        )

    return ''.join(lines)


def generate_todelete(removed_entries, new_titles_set):
    """
    Génère todelete.sql.
    - Supprime chaque ad_status disparu.
    - Si le titre n'a plus aucune plateforme dans le nouveau fichier,
      supprime aussi la ligne contents.
    """
    lines = [
        '-- todelete.sql — Titres et statuts à supprimer de Supabase\n',
        '-- Généré par scripts/compare_seeds.py\n\n',
    ]

    # Titres entièrement supprimés (plus aucune plateforme dans le nouveau fichier)
    titles_fully_removed = set()
    for e in removed_entries:
        if e['title'] not in new_titles_set:
            titles_fully_removed.add(e['title'])

    lines.append('-- ── Suppression des statuts audiodescription ───────────────────\n\n')
    for e in removed_entries:
        title = e['title']
        platform = normalize_platform(e['platform'])
        lines.append(
            f"DELETE FROM ad_status\n"
            f"  WHERE content_id = (SELECT id FROM contents WHERE title = '{esc(title)}')\n"
            f"    AND platform = '{esc(platform)}';\n\n"
        )

    if titles_fully_removed:
        lines.append(
            '-- ── Contenus sans aucune plateforme restante ───────────────────\n'
            '-- Ces titres ont disparu de toutes les plateformes.\n\n'
        )
        for title in sorted(titles_fully_removed):
            lines.append(f"DELETE FROM contents WHERE title = '{esc(title)}';\n")

    return ''.join(lines)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    old_path = SCRIPT_DIR / 'seed-data.json'
    new_path = Path(sys.argv[1])

    if not old_path.exists():
        print(f"Erreur : {old_path} introuvable.")
        sys.exit(1)
    if not new_path.exists():
        print(f"Erreur : {new_path} introuvable.")
        sys.exit(1)

    print(f"Ancien : {old_path}")
    print(f"Nouveau : {new_path}\n")

    old_data = load_json(old_path)
    new_data = load_json(new_path)

    old_map = make_entry_map(old_data)
    new_map = make_entry_map(new_data)

    old_keys = set(old_map.keys())
    new_keys = set(new_map.keys())

    added_keys = new_keys - old_keys
    removed_keys = old_keys - new_keys

    old_titles = set(e['title'] for e in old_data)
    new_titles_set = set(e['title'] for e in new_data)

    print(f"Ancien fichier : {len(old_data)} entrées, {len(old_titles)} titres uniques")
    print(f"Nouveau fichier : {len(new_data)} entrées, {len(new_titles_set)} titres uniques")
    print(f"\n✅  À ajouter  : {len(added_keys)} entrée(s)")
    print(f"🗑️   À supprimer : {len(removed_keys)} entrée(s)")

    if not added_keys and not removed_keys:
        print("\nAucun changement détecté. Aucun fichier généré.")
        return

    # Toadd
    if added_keys:
        added_entries = [new_map[k] for k in sorted(added_keys)]
        sql = generate_toadd(added_entries, old_titles)
        out = SCRIPT_DIR / 'toadd.sql'
        out.write_text(sql, encoding='utf-8')
        print(f"\n✓ {out} ({len(added_keys)} entrée(s))")
        # Affiche un aperçu
        for k in sorted(added_keys)[:5]:
            print(f"   + {k[0]}  [{k[1]}]")
        if len(added_keys) > 5:
            print(f"   … et {len(added_keys) - 5} autre(s)")

    # Todelete
    if removed_keys:
        removed_entries = [old_map[k] for k in sorted(removed_keys)]
        sql = generate_todelete(removed_entries, new_titles_set)
        out = SCRIPT_DIR / 'todelete.sql'
        out.write_text(sql, encoding='utf-8')
        print(f"\n✓ {out} ({len(removed_keys)} entrée(s))")
        for k in sorted(removed_keys)[:5]:
            print(f"   - {k[0]}  [{k[1]}]")
        if len(removed_keys) > 5:
            print(f"   … et {len(removed_keys) - 5} autre(s)")

    print("\nExécutez ces fichiers dans Supabase → SQL Editor.")


if __name__ == '__main__':
    main()
