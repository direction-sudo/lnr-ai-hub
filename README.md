# LNR AI Hub

Plateforme SaaS d'agents IA spécialisés pour LNR Finance.
Deux agents intelligents : **Nora** (Communication & Social Media) et **Leo** (Ressources Humaines).

---

## Architecture

| Couche | Technologie |
|--------|------------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| **Backend** | Hono + tRPC 11 + Drizzle ORM + SQLite |
| **AI** | Moonshot (Kimi) API — modele moonshot-v1-8k |
| **Auth** | Kimi OAuth 2.0 + JWT sessions |
| **Social** | IFTTT Webhooks — Facebook, LinkedIn, Instagram, Twitter |

---

## Agents

### Nora — Agent Communication
- Redaction de posts (LinkedIn, Facebook, Instagram, TikTok)
- Calendrier editorial
- Suggestions de hashtags
- Planification de publications
- Analytics & KPIs

### Leo — Agent RH
- Redaction de fiches de poste
- Grilles d'entretien
- Onboarding & integration
- Screening de CV
- Reporting RH

---

## Quick Start (Local)

```bash
# 1. Installer les dependences
npm install

# 2. Copier et configurer les variables d'environnement
cp .env.example .env
# Editer .env avec votre KIMI_API_KEY

# 3. Initialiser la base de donnees
npm run db:push

# 4. Seeder les agents (Nora + Leo)
npm run db:seed

# 5. Lancer le backend
npm run dev:server

# 6. Lancer le frontend (autre terminal)
npm run dev
```

---

## Deploiement

### Backend — Koyeb (Gratuit)

1. Creer un compte sur [koyeb.com](https://app.koyeb.com)
2. **Deploy** > **GitHub** > Selectionner ce repo
3. Choisir **Dockerfile** comme builder
4. Configurer les variables d'environnement (voir `.env.example`)
5. Deployer

Variables requises sur Koyeb :
```
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxx
KIMI_OPEN_URL=https://api.moonshot.ai
DATABASE_URL=sqlite:/app/data/lnr-ai-hub.db
NODE_ENV=production
PORT=3000
APP_ID=xxxx
APP_SECRET=xxxx
KIMI_AUTH_URL=xxxx
OWNER_UNION_ID=xxxx
IFTTT_WEBHOOK_KEY=xxxx
```

### Frontend — Kimi Page (Gratuit)

1. Modifier `src/providers/trpc.tsx` :
```typescript
const BACKEND_URL = "https://votre-backend.koyeb.app";
```

2. Builder : `npm run build`
3. Deployer le dossier `dist/public` sur Kimi Page

---

## API Endpoints (tRPC)

| Router | Procedure | Auth | Description |
|--------|-----------|------|-------------|
| `chat.listAgents` | query | public | Lister les agents |
| `chat.getAgent` | query | public | Details d'un agent |
| `chat.getHistory` | query | requis | Historique du chat |
| `chat.sendMessage` | mutation | requis | Envoyer un message IA |
| `ifttt.publish` | mutation | public | Publier sur reseaux sociaux |
| `ifttt.generateAndPublish` | mutation | public | Generer + publier auto |
| `ifttt.status` | query | public | Statut IFTTT |

---

## Configuration IFTTT

Creer 4 applets sur [ifttt.com](https://ifttt.com) :

| Event Name | Reseau Social | Action |
|------------|--------------|--------|
| `lnr_facebook_post` | Facebook Pages | Create a post |
| `lnr_linkedin_post` | LinkedIn | Share a link |
| `lnr_instagram_post` | Instagram | Create photo post |
| `lnr_twitter_post` | Twitter | Post a tweet |

Dans chaque action, utiliser `{{Value1}}` comme contenu.

---

## Scripts

```bash
npm run dev          # Frontend dev server
npm run dev:server   # Backend dev server
npm run build        # Build frontend + backend
npm run db:push      # Push schema SQLite
npm run db:seed      # Seeder agents Nora & Leo
npm run db:migrate   # Run migrations
npm run test         # Run tests
```

---

## Structure

```
.
├── api/               # Backend (Hono + tRPC)
│   ├── boot.ts        # Entry point
│   ├── router.ts      # tRPC router
│   ├── chat-router.ts # Chat endpoints
│   ├── ifttt-router.ts# IFTTT endpoints
│   └── ai-service.ts  # Kimi AI integration
├── db/                # Database (Drizzle + SQLite)
│   ├── schema.ts      # Table definitions
│   └── seed.ts        # Seed data
├── src/               # Frontend (React)
│   ├── App.tsx        # Main app
│   ├── providers/     # tRPC provider
│   └── pages/         # Route pages
├── public/images/     # Avatar images
├── Dockerfile         # Koyeb deployment
└── package.json
```

---

## License

Proprietaire — LNR Finance
