# Profils pharmacologiques patients - PoC local

Proof of Concept local pour gérer quelques patients fictifs, construire un profil pharmacologique et lancer une analyse d'interactions via Rx Label Guard.

## Architecture

- `backend/` : API FastAPI, store en mémoire, extraction PDF native avec PyMuPDF, client Rx Label Guard.
- `frontend/` : React + Vite + TypeScript, interface REST simple.
- Aucune authentification et aucune base de données pour ce PoC.
- Les données sont perdues au redémarrage du backend.

## Démarrer le backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

API disponible par défaut sur `http://localhost:8000`.

## Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

Interface disponible par défaut sur `http://localhost:5173`.

En local, les appels `/api` sont automatiquement proxyfiés vers `http://127.0.0.1:8000`.
Pour changer l'URL de l'API côté frontend, définir `VITE_API_BASE_URL`.

## Variables d'environnement backend

Créer `backend/.env` à partir de `backend/.env.example`.

- `RX_LABEL_GUARD_API_KEY` : clé API Rx Label Guard, gardée côté backend seulement.
- `RX_LABEL_GUARD_MOCK=true` : active le mode mock et évite tout appel externe.
- `RX_LABEL_GUARD_MOCK=false` : appelle `https://api.rxlabelguard.com/v1/interactions/check`.
- `RX_LABEL_GUARD_TIMEOUT_SECONDS=10` : timeout de l'appel externe.
- `CORS_ORIGINS=http://localhost:5173` : origines frontend autorisées.

## Tests backend

```bash
cd backend
pytest
```

Les tests couvrent la création patient, la génération d'ID, l'ajout/refus de médicaments, le refus d'un second import PDF, le parsing de lignes simples et le mode mock Rx Label Guard.

## Limites connues

- Parsing PDF heuristique seulement, sans OCR.
- DIN/NDC non détectés automatiquement.
- Données en mémoire seulement.
- Pas de gestion concurrente avancée.
- Le résultat Rx Label Guard est affiché de façon robuste, mais la structure exacte de l'API réelle peut demander des ajustements UI.

## Avertissement clinique

PoC seulement - ne pas utiliser pour une décision clinique sans validation professionnelle.

## Déploiement Vercel

Le repo peut être déployé comme un seul projet Vercel :

- `frontend/` est buildé en site statique Vite
- `api/index.py` expose l'application FastAPI
- le frontend appelle l'API via des routes relatives `/api/...`

Variables d'environnement à configurer sur Vercel :

- `RX_LABEL_GUARD_API_KEY`
- `RX_LABEL_GUARD_MOCK`
- `RX_LABEL_GUARD_TIMEOUT_SECONDS`
- `CORS_ORIGINS`

Pour un déploiement démo, les données restent en mémoire côté backend et peuvent disparaître à tout moment.
