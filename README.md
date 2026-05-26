# DARWIN — Générateur de DAT

> **D**ossier d'**A**rchitecture Technique **R**apide et **W**eb — **IN**téractif

Application web permettant de générer des Dossiers d'Architecture Technique (DAT) au format Word, PDF ou OpenDocument, via un formulaire guidé en 9 étapes.

---

## Sommaire

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Lancement rapide (Docker)](#lancement-rapide-docker)
- [Lancement en développement (sans Docker)](#lancement-en-développement-sans-docker)
- [Déploiement sur une autre machine](#déploiement-sur-une-autre-machine)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Roadmap](#roadmap)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Port 80                    │
│              nginx (Frontend)                │
│         React + Vite (build statique)        │
│                                              │
│  /           → SPA React                    │
│  /api/v1/*   → proxy → backend:8000         │
└──────────────────────┬──────────────────────┘
                       │ réseau Docker interne
┌──────────────────────▼──────────────────────┐
│              Port 8000 (interne)             │
│              FastAPI (Backend)               │
│         Python 3.12 + LibreOffice            │
│                                              │
│  POST /api/v1/generate?format=docx|pdf|odt  │
└─────────────────────────────────────────────┘
```

| Service    | Image de base        | Port exposé |
|------------|----------------------|-------------|
| `frontend` | nginx:alpine         | **80**      |
| `backend`  | python:3.12-slim + LibreOffice | interne 8000 |

---

## Prérequis

### Sur **Windows 11 / WSL2** (machine de développement)

1. Installer **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** pour Windows
2. Dans Docker Desktop → Settings → Resources → WSL Integration → activer votre distro Debian
3. Vérifier dans WSL :
   ```bash
   docker --version
   docker compose version
   ```

### Sur **Linux** (serveur de production)

```bash
./install-docker.sh
# Puis déconnectez-vous et reconnectez-vous (pour le groupe docker)
```

---

## Lancement rapide (Docker)

```bash
# 1. Cloner le projet
git clone https://github.com/rba95/DARWIN-1.git
cd DARWIN-1

# 2. Déployer (build + start)
./deploy.sh
```

L'application est accessible sur **http://localhost**

### Commandes utiles

```bash
# Voir les logs en direct
docker compose logs -f

# Voir les logs d'un seul service
docker compose logs -f backend
docker compose logs -f frontend

# Arrêter
docker compose down

# Redémarrer sans rebuild
docker compose up -d

# Rebuild après modification du code
docker compose build --no-cache
docker compose up -d

# Statut des conteneurs
docker compose ps
```

---

## Lancement en développement (sans Docker)

### Backend

```bash
cd backend

# Créer un environnement virtuel Python
python3 -m venv .venv
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur avec rechargement automatique
export PYTHONPATH=$(pwd)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> API disponible sur http://localhost:8000  
> Documentation interactive : http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Installer les dépendances Node
npm install

# Lancer le serveur de développement
npm run dev
```

> Interface disponible sur http://localhost:5173  
> Le proxy Vite redirige automatiquement `/api/v1` → `http://localhost:8000`

---

## Déploiement sur une autre machine

### Étapes complètes

```bash
# 1. Installer Docker (si pas déjà fait)
./install-docker.sh

# 2. Se reconnecter pour activer le groupe docker
exit
# (reconnexion SSH ou terminal)

# 3. Cloner et déployer
git clone https://github.com/rba95/DARWIN-1.git
cd DARWIN-1
./deploy.sh
```

### Exposer sur internet (optionnel)

Si vous voulez exposer l'application à l'extérieur, modifiez `docker-compose.yml` :

```yaml
# Changer le port exposé si 80 est déjà utilisé
ports:
  - "8080:80"   # accessible sur http://votre-ip:8080
```

Pour HTTPS avec un nom de domaine, ajoutez un reverse proxy (Traefik, Caddy, ou nginx externe) devant le conteneur frontend.

---

## Variables d'environnement

### Frontend

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `VITE_API_URL` | `/api/v1` | URL de base de l'API |

> En production Docker, le proxy nginx gère le routage — pas besoin de modifier cette variable.  
> En développement local, le proxy Vite dans `vite.config.ts` redirige automatiquement.

---

## Structure du projet

```
DARWIN-1/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   └── generation.py      # POST /generate — génère le document
│   │   ├── schemas/
│   │   │   └── dat.py             # Modèle Pydantic complet du DAT
│   │   ├── services/
│   │   │   └── doc_generator.py   # Rendu Jinja2 → DOCX → PDF/ODT
│   │   ├── templates/
│   │   │   └── dat_template.docx  # Template Word avec variables Jinja2
│   │   └── main.py                # FastAPI app + CORS
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Client axios
│   │   ├── components/
│   │   │   ├── DatStepper.tsx     # Formulaire principal 9 étapes
│   │   │   └── features/          # Tableaux, éditeur riche, etc.
│   │   ├── types/dat.ts           # Types TypeScript du formulaire
│   │   └── styles/dsfr.ts         # Tokens DSFR (Design Système État)
│   ├── nginx.conf                 # Config nginx prod
│   └── Dockerfile
│
├── docker-compose.yml             # Orchestration des services
├── deploy.sh                      # Script de déploiement one-shot
└── install-docker.sh              # Installation Docker sur Debian/Ubuntu
```

---

## Fonctionnement de la génération

```
Formulaire React (9 étapes)
        │
        │ POST /api/v1/generate?format=docx
        ▼
FastAPI valide avec Pydantic (DatRequest)
        │
        ▼
doc_generator.py nettoie le HTML (strip_html)
        │
        ▼
docxtpl injecte les variables Jinja2 dans dat_template.docx
        │
        ├── format=docx → retourne le fichier directement
        │
        └── format=pdf|odt → LibreOffice headless convertit
                              → retourne le fichier converti
```

---

## Roadmap

- [ ] Intégration SSO / LDAP (authentification centralisée)
- [ ] Sauvegarde des brouillons (localStorage ou base de données)
- [ ] Export multi-format simultané
- [ ] Historique des DAT générés
- [ ] Templates multiples (DAT, DAE, DSI...)

---

## Design

Interface basée sur le **[Système de Design de l'État Français (DSFR)](https://www.systeme-de-design.gouv.fr/)**.

Couleurs principales :
- Bleu France : `#000091`
- Vert succès : `#18753C`
- Rouge erreur : `#CE0500`
