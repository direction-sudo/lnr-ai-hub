# LNR AI Hub - Guide de Déploiement Backend

## Option 1 : Render.com (GRATUIT - Recommandé)

### Étape 1 : Créer un compte Render
1. Va sur https://render.com
2. Clique **"Get Started for Free"**
3. Inscris-toi avec GitHub, Google ou email

### Étape 2 : Pousser le code sur GitHub
1. Crée un nouveau repo GitHub (public ou privé)
2. Pousse ce projet :
```bash
git init
git add .
git commit -m "LNR AI Hub - Ready for deploy"
git remote add origin https://github.com/TON-USER/TON-REPO.git
git push -u origin main
```

### Étape 3 : Déployer sur Render
1. Dans Render, clique **"New +"** → **"Web Service"**
2. Connecte ton compte GitHub et sélectionne le repo
3. Remplis les champs :

| Champ | Valeur |
|-------|--------|
| **Name** | `lnr-ai-hub` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/boot.js` |
| **Plan** | `Free` |

4. Clique **"Advanced"** et ajoute les variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `sqlite:./data/lnr-ai-hub.db` |
| `APP_ID` | `Ton APP_ID Kimi` |
| `APP_SECRET` | `Ton APP_SECRET Kimi` |
| `KIMI_AUTH_URL` | `https://platform.kimi.ai` |
| `KIMI_OPEN_URL` | `https://api.moonshot.ai` |
| `OWNER_UNION_ID` | `Ton union_id Kimi (optionnel)` |

5. Clique **"Create Web Service"**

### Étape 4 : Attendre le déploiement
- Render va build et déployer automatiquement
- Attends 2-3 minutes
- L'URL sera : `https://lnr-ai-hub.onrender.com`

---

## Option 2 : Docker Local

### Prérequis
- Docker + Docker Compose installés

### Déploiement
```bash
# 1. Build et démarrer
docker-compose up -d

# 2. Le site sera accessible sur http://localhost:3000

# 3. Pour arrêter
docker-compose down
```

---

## Option 3 : VPS / Serveur Dédié

### Prérequis
- Node.js 20+
- npm ou pnpm

### Déploiement
```bash
# 1. Cloner le projet
git clone https://github.com/TON-USER/TON-REPO.git
cd TON-REPO

# 2. Installer les dépendances
npm install

# 3. Créer le dossier data
mkdir -p data

# 4. Build
npm run build

# 5. Sync la base de données
npm run db:push

# 6. Seed les agents par défaut
npx tsx db/seed.ts

# 7. Démarrer
npm start
```

Le site sera accessible sur `http://localhost:3000`

---

## Après le déploiement

### 1. Configurer les variables d'environnement
Assure-toi que toutes les vars sont bien définies :
- `APP_ID` et `APP_SECRET` (depuis le portal Kimi)
- `KIMI_AUTH_URL` = `https://platform.kimi.ai`
- `KIMI_OPEN_URL` = `https://api.moonshot.ai`

### 2. Sync la base de données
```bash
npm run db:push
```

### 3. Seed les agents par défaut
```bash
npx tsx db/seed.ts
```

### 4. Vérifier que tout fonctionne
- Le frontend : `https://ton-url.onrender.com`
- L'API : `https://ton-url.onrender.com/api/trpc`
- Auth : `https://ton-url.onrender.com/api/oauth/callback`

---

## Variables d'environnement requises

| Variable | Description | Où la trouver |
|----------|-------------|---------------|
| `DATABASE_URL` | URL SQLite | `sqlite:./data/lnr-ai-hub.db` |
| `APP_ID` | Client ID OAuth Kimi | Portal Kimi → App Settings |
| `APP_SECRET` | Client Secret OAuth Kimi | Portal Kimi → App Settings |
| `KIMI_AUTH_URL` | URL auth Kimi | `https://platform.kimi.ai` |
| `KIMI_OPEN_URL` | URL API Kimi | `https://api.moonshot.ai` |
| `OWNER_UNION_ID` | Ton union_id Kimi | Optionnel (pour admin) |
| `PORT` | Port du serveur | Auto (3000 par défaut) |
| `NODE_ENV` | Environnement | `production` |

---

## Commandes utiles

```bash
# Build
npm run build

# Type check
npm run check

# Sync DB
npm run db:push

# Seed agents
npx tsx db/seed.ts

# Démarrer
npm start

# Dev mode
npm run dev
```

---

## Support

En cas de problème :
1. Vérifier les logs Render (tab "Logs")
2. Vérifier que les variables d'environnement sont bien définies
3. Vérifier que `DATABASE_URL` pointe vers un dossier accessible en écriture
