# ADispo — Audiodescription sur les plateformes de streaming

ADispo est une application web communautaire permettant aux utilisateurs aveugles et malvoyants de savoir si l'audiodescription est disponible pour un film ou une série sur les grandes plateformes de streaming.

**Accessibilité en priorité** : navigation au clavier, lecteurs d'écran, WCAG AA/AAA.

---

## Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)
- Une clé API [TMDB](https://www.themoviedb.org/settings/api) (gratuite)

---

## Installation

```bash
git clone https://github.com/ameliend/adispo.git
cd adispo
npm install
```

Copiez le fichier d'environnement et renseignez vos clés :

```bash
cp .env.example .env
```

Éditez `.env` :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
VITE_TMDB_API_KEY=votre-clé-tmdb
```

---

## Configuration Supabase

Dans le SQL Editor de votre projet Supabase, exécutez ce script :

```sql
-- Table des contenus (films et séries)
CREATE TABLE contents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id integer UNIQUE NOT NULL,
  title text NOT NULL,
  year text,
  genre text,
  type text CHECK (type IN ('movie', 'tv')),
  created_at timestamptz DEFAULT now()
);

-- Table des statuts d'audiodescription par plateforme
CREATE TABLE ad_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  status text DEFAULT 'unverified' CHECK (status IN ('available', 'unavailable', 'unverified')),
  trust_level text DEFAULT 'Signalé' CHECK (trust_level IN ('Signalé', 'Confirmé', 'Fiable')),
  validation_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Table des contributions communautaires
CREATE TABLE contributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  claimed_status text NOT NULL CHECK (claimed_status IN ('available', 'unavailable', 'unsure')),
  contributor_email text,
  submitted_at timestamptz DEFAULT now(),
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

-- Fonction RPC pour incrémenter les validations sans race condition
CREATE OR REPLACE FUNCTION increment_validation(row_id uuid)
RETURNS void AS $$
  UPDATE ad_status
  SET
    validation_count = validation_count + 1,
    trust_level = CASE
      WHEN validation_count + 1 >= 5 THEN 'Fiable'
      WHEN validation_count + 1 >= 2 THEN 'Confirmé'
      ELSE 'Signalé'
    END,
    updated_at = now()
  WHERE id = row_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Index pour les performances
CREATE INDEX idx_contents_title ON contents USING gin(to_tsvector('french', title));
CREATE INDEX idx_ad_status_content_id ON ad_status(content_id);
CREATE INDEX idx_contributions_submitted_at ON contributions(submitted_at DESC);
CREATE INDEX idx_contributions_moderation ON contributions(moderation_status);
```

### Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Lecture publique de contents et ad_status
CREATE POLICY "contents_select_public" ON contents FOR SELECT USING (true);
CREATE POLICY "ad_status_select_public" ON ad_status FOR SELECT USING (true);

-- Lecture des contributions approuvées uniquement
CREATE POLICY "contributions_select_approved" ON contributions
  FOR SELECT USING (moderation_status = 'approved');

-- Insertion publique des contributions (en attente de modération)
CREATE POLICY "contributions_insert_public" ON contributions
  FOR INSERT WITH CHECK (moderation_status = 'pending');

-- Insertion publique de nouveaux contenus
CREATE POLICY "contents_insert_public" ON contents FOR INSERT WITH CHECK (true);

-- Autoriser l'exécution de la fonction RPC par les utilisateurs anonymes
GRANT EXECUTE ON FUNCTION increment_validation(uuid) TO anon;
```

---

## Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:5173](http://localhost:5173).

---

## Build de production

```bash
npm run build
npm run preview
```

---

## Déploiement sur Vercel

1. Connectez votre dépôt GitHub à [Vercel](https://vercel.com)
2. Ajoutez les variables d'environnement dans les paramètres du projet Vercel :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
3. Le fichier `vercel.json` configure automatiquement les redirections SPA et les en-têtes de sécurité.

---

## Tests d'accessibilité

### Outils recommandés

- **axe DevTools** (extension navigateur) — détecte les violations WCAG automatiquement
- **NVDA + Firefox** (Windows) — lecteur d'écran principal pour les utilisateurs aveugles
- **VoiceOver + Safari** (macOS/iOS) — lecteur d'écran Apple
- **Orca + Firefox** (Linux) — lecteur d'écran Linux

### Points de vérification manuels

1. **Touche Tab** : parcourir toute la page sans la souris, vérifier l'ordre logique
2. **Lien d'évitement** : premier élément focusable, visible au focus
3. **Annonces aria-live** : résultats de recherche et transitions d'étapes annoncés
4. **Bagues de focus** : contour de 3px visible sur tous les éléments interactifs
5. **Mode mouvement réduit** : activer `prefers-reduced-motion` dans les préférences OS — aucune animation ne doit persister
6. **Mode sombre** : activer `prefers-color-scheme: dark` — contraste minimum 7:1 vérifié
7. **Zoom 200%** : la mise en page reste utilisable, pas de scroll horizontal

---

## Structure du projet

```
adispo/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── SearchPage.jsx
    │   ├── AddTitlePage.jsx
    │   ├── ResultCard.jsx
    │   ├── TrustBadge.jsx
    │   └── ContributionForm.jsx
    └── lib/
        ├── supabase.js
        └── tmdb.js
```

---

## Niveaux de confiance

| Validations | Niveau   | Signification                              |
|-------------|----------|--------------------------------------------|
| 1           | Signalé  | Un seul utilisateur a signalé l'information |
| 2–4         | Confirmé | Plusieurs utilisateurs ont confirmé         |
| 5+          | Fiable   | Information validée par la communauté       |

---

## Licence

MIT
