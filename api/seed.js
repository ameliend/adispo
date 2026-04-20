// Route temporaire — À SUPPRIMER après usage
// Appeler une seule fois : GET https://votre-app.vercel.app/api/seed?secret=SEED_SECRET

import { createClient } from '@supabase/supabase-js'

const PLATFORM_MAP = {
  'CANAL+': 'canal', 'Canal+': 'canal', 'canal+': 'canal', 'canal': 'canal',
  'Netflix': 'netflix', 'NETFLIX': 'netflix', 'netflix': 'netflix',
  'Disney+': 'disney', 'DISNEY+': 'disney', 'disney': 'disney',
  'Prime Video': 'prime', 'prime video': 'prime', 'prime': 'prime',
  'Apple TV+': 'apple', 'apple tv+': 'apple', 'apple': 'apple',
}

async function searchTmdb(title, apiKey) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
  )
  if (!res.ok) return null
  const json = await res.json()
  const results = (json.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
  return results[0] || null
}

export default async function handler(req, res) {
  if (req.query.secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  const TMDB_KEY = process.env.VITE_TMDB_API_KEY

  // Collez ici votre tableau JSON complet
  const entries = [
    {
    "title": "Jurassic World : Renaissance",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/jurassic-world-renaissance/h/29507057_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Un prophète",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/un-prophete/h/30846580_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Bad Guys 2",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-bad-guys-2/h/29507065_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "100 Millions !",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/100-millions/h/28310349_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Regarde",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/regarde/h/30363298_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Chantage",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/chantage/h/44179191_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Une bataille après l'autre",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/une-bataille-apres-l-autre/h/30363143_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Imperfect Women",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/imperfect-women/h/43694270_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Monarch: Legacy of Monsters",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/monarch-legacy-of-monsters/h/40002718_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Dracula",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/dracula/h/29533005_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Vrais voisins",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/vrais-voisins-faux-amis/h/41118278_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Indomptables",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/indomptables/h/29254029_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Drop Game",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/drop-game/h/29042799_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Muganga - Celui qui soigne",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/muganga-celui-qui-soigne/h/30486971_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "For All Mankind",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/for-all-mankind/h/40000045_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Fils de",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/fils-de/h/30363208_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "La dernière chose qu’il m’a dite",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/la-derniere-chose-qu-il-m-a-dite/h/40000698_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Shrinking",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/shrinking/h/40000275_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Mikado",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/mikado/h/28448842_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Je sais pas",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/je-sais-pas/h/31079955_50026",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Connemara",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/connemara/h/30437252_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Maudites",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-maudites/h/29162994_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Meurtres à...",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/meurtres-a/h/14250435_50027",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "F1 : Le film",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/f-1-le-film/h/29412236_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "A priori",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/a-priori/h/27873436_50027",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Musiciens",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-musiciens/h/29411831_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Tropiques criminels",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/tropiques-criminels/h/12731377_50026",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Dangerous Animals",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/dangerous-animals/h/29864635_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Traqués",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/traques/h/43479241_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Margo a des problèmes d’argent",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/margo-a-des-problemes-d-argent/h/44286970_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Möbius",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/mobius/h/2029013_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "B.R.I",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/b-r-i/h/21274561_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Evanouis",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/evanouis/h/29699735_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Babysitting 2",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/babysitting-2/h/5960196_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Phoenix",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/phoenix/h/30859782_50026",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Le Flambeau",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/le-flambeau-les-aventuriers-de-chupacabra/h/18788497_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Des jours meilleurs",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/des-jours-meilleurs/h/29394483_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Falcon Express",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/falcon-express/h/29467391_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Cocorico",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/cocorico/h/24117823_50035",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "L'Accident de piano",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/l-accident-de-piano/h/29450832_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Superman",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/superman/h/29467408_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "L'épreuve du feu",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/l-epreuve-du-feu/h/30267477_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Hostiles",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/hostiles/h/9669856_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Schtroumpfs : Le film",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-schtroumpfs-le-film/h/29881307_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Soeurs et demie",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/telefilms/soeurs-et-demie/h/31172242_50026",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Doux Jésus",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/doux-jesus/h/28448840_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Mystery Lane",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/jeunesse/mystery-lane/h/22674686_50296",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Sinners",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/sinners/h/28618598_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Téhéran",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/teheran/h/40000314_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "La Flamme",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/la-flamme/h/14768790_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Différente",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/differente/h/29411630_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Nino",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/nino/h/30354273_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Le Comte de Monte-Cristo",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/le-comte-de-monte-cristo/h/25555449_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "M3GAN 2.0",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/m-3-gan-2-0/h/29507055_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Minecraft",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/minecraft-le-film/h/28379699_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Une place pour Pierrot",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/une-place-pour-pierrot/h/30807807_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Toutes pour une",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/toutes-pour-une/h/27683025_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Elles deux",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/telefilms/elles-deux/h/31246272_50026",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Une nuit au zoo",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/une-nuit-au-zoo/h/27753513_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Dragons",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/dragons/h/28235475_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Tuche",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-tuche/h/102345_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Gouttes de Dieu",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/les-gouttes-de-dieu/h/40000690_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Coka Chicas",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/coka-chicas/h/29297931_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Mission : Impossible - The Final Reckoning",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/mission-impossible-the-final-reckoning/h/29356120_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Nope",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/nope/h/20252014_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Loups garous",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/divertissement/loups-garous/h/26439553_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Matrix",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/matrix/h/114045_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Hijack",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/hijack/h/40002064_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Sonic 3",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/sonic-3-le-film/h/27411115_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Cleaner",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/cleaner/h/30706791_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Luck",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/luck/h/40000248_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Valeur sentimentale",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/valeur-sentimentale/h/30267478_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "La Cache",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/la-cache/h/28240371_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Empathie",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/empathie/h/29582015_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Juste la fin du monde",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/juste-la-fin-du-monde/h/7399673_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "L'amour",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/l-amour-c-est-surcote/h/29119197_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Miss Sloane",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/miss-sloane/h/8297214_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Ballerina : De l'univers de John Wick",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/ballerina-de-l-univers-de-john-wick/h/29703625_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les huit salopards",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-huit-salopards/h/6140081_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Avignon",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/avignon/h/29421691_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "God Save the Tuche",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/god-save-the-tuche/h/27823144_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Pluribus",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/pluribus/h/42063555_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Lock Out",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/lock-out/h/625827_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Matrix Reloaded",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/matrix-reloaded/h/113987_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Tuche 3",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-tuche-3/h/9509617_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Hurricane",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/hurricane/h/9620336_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "La doc et le véto",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/la-doc-et-le-veto/h/21531422_50027",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "L'enfer",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/l-enfer/h/114091_50074",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Validé",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/valide/h/13530538_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Les Tuche 2 : le rêve américain",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/les-tuche-2-le-reve-americain/h/6267345_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Moonfall",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/moonfall/h/18044145_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "L'Attachement",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/l-attachement/h/27961819_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "The Morning Show",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/the-morning-show/h/40000026_50696",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Le Vétéran",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/le-veteran/h/17746213_50002",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Grizzy et les lemmings",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/jeunesse/grizzy-et-les-lemmings/h/7908221_50296",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "La Venue de l'avenir",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/la-venue-de-l-avenir/h/29298213_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Culte",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/culte/h/31209899_50035",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Brûle le sang",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/brule-le-sang/h/28229869_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Destination finale : Bloodlines",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/cinema/destination-finale-bloodlines/h/29244721_50001",
    "trust_level": "fiable",
    "validation_count": 5
  },
  {
    "title": "Slow Horses",
    "platform": "CANAL+",
    "status": "available",
    "link": "https://www.canalplus.com/series/slow-horses/h/40000083_50696",
    "trust_level": "fiable",
    "validation_count": 5
  }
  ]

  const results = []

  for (const entry of entries) {
    const platform = PLATFORM_MAP[entry.platform]
    if (!platform) {
      results.push({ title: entry.title, status: 'plateforme inconnue' })
      continue
    }

    const tmdb = await searchTmdb(entry.title, TMDB_KEY)
    if (!tmdb) {
      results.push({ title: entry.title, status: 'introuvable sur TMDB' })
      continue
    }

    const isMovie = tmdb.media_type === 'movie'
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .upsert({
        tmdb_id: String(tmdb.id),
        title: tmdb.title || tmdb.name || entry.title,
        year: isMovie ? (tmdb.release_date || '').slice(0, 4) || null : (tmdb.first_air_date || '').slice(0, 4) || null,
        type: isMovie ? 'movie' : 'tv',
        synopsis: tmdb.overview || null,
        poster_path: tmdb.poster_path || null,
      }, { onConflict: 'tmdb_id' })
      .select()
      .single()

    if (contentError) {
      results.push({ title: entry.title, status: `erreur: ${contentError.message}` })
      continue
    }

    const { error: adError } = await supabase
      .from('ad_status')
      .upsert({
        content_id: content.id,
        platform,
        status: entry.status || 'available',
        trust_level: entry.trust_level || 'Signalé',
        validation_count: entry.validation_count || 1,
        lien: entry.link || null,
      }, { onConflict: 'content_id,platform' })

    results.push({ title: entry.title, status: adError ? `erreur: ${adError.message}` : '✓ inséré' })

    await new Promise(r => setTimeout(r, 300))
  }

  return res.status(200).json({ results })
}
