# FIDES CONSEIL x LNR AI Hub — Intégration CRM Pipedrive

> **Projet** : Intégration webhook Pipedrive pour le routage automatique des leads B2C/B2B
> **Dates** : 05/08/2026 (Jour 1) — 06/08/2026 (Jour 2)
> **Déployé sur** : https://lnr-ai-hub.onrender.com

---

## 📋 Sommaire des tâches réalisées

### Jour 1 — 05/08/2026 : Setup Pipedrive CRM

| # | Tâche | Statut |
|---|-------|--------|
| 1 | Faire valider la spec par Yassir | ✅ Terminée |
| 2 | Créer le compte Pipedrive (direction@lnr-finance.com) | ✅ Terminée |
| 3 | Créer les DEUX pipelines étanches (Mutuelle TN + Conseil FR) | ✅ Terminée |
| 4 | Créer les champs personnalisés | ✅ Terminée |
| 5 | Activer la clé API Pipedrive | ✅ Terminée |
| 6 | Pousser le test et la spec sur GitHub | ✅ Terminée |

### Jour 2 — 06/08/2026 : Webhook + Intégration Render

| # | Tâche | Statut |
|---|-------|--------|
| 7 | Créer le webhook `deal.added` | ✅ Terminée |
| 8 | Ajouter un endpoint de test public | ✅ Terminée |
| 9 | Parser le payload JSON | ✅ Terminée |
| 10 | Mapper le pipeline_id (B2C/B2B) | ✅ Terminée |
| 11 | Documenter le format du payload | ✅ Terminée |
| **INT** | **Intégration au projet LNR AI Hub sur Render** | ✅ Terminée |

---

## 🌐 Endpoints disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/webhooks/pipedrive` | POST | Réception des webhooks Pipedrive (deal.create) |
| `/api/fides/leads` | GET | Liste JSON de tous les leads reçus |
| `/fides-dashboard` | GET | Dashboard HTML avec stats B2C/B2B |
| `/api/health` | GET | Health check + nombre de leads stockés |

---

## 🔧 Configuration Pipedrive

### Webhooks actifs

```
Event  : deal.create
URL    : https://lnr-ai-hub.onrender.com/api/webhooks/pipedrive
Version: 2.0
```

### Pipelines

| Pipeline ID | Nom | Type | Devise | Marché | Agent |
|------------|-----|------|--------|--------|-------|
| 3 | Mutuelle TN | B2C | TND | Tunisia | Agent Qualification Mutuelle TN |
| 4 | Conseil FR | B2B | EUR | France | Agent Qualification Conseil FR |

### Stages (Pipeline 3 — Mutuelle TN)

| Stage ID | Nom |
|----------|-----|
| 11 | Lead In |
| 12 | Contacted |
| 13 | Proposal |
| 14 | Won |

### Stages (Pipeline 4 — Conseil FR)

| Stage ID | Nom |
|----------|-----|
| 17 | Lead In |
| 18 | Qualification |
| 19 | Proposal |
| 20 | Contract |

---

## 📊 Architecture du routage

```
┌─────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│  Pipedrive CRM  │────▶│  POST /api/webhooks/    │────▶│  Stockage mémoire│
│  (deal.create)  │     │  pipedrive              │     │  (max 100 leads) │
└─────────────────┘     └─────────────────────────┘     └──────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  pipeline_id === 3 ? │
                    └──────────────────────┘
                          │           │
                         OUI         NON
                          │           │
                          ▼           ▼
                   ┌──────────┐  ┌──────────┐
                   │   B2C    │  │   B2B    │
                   │ Mutuelle │  │ Conseil  │
                   │    TN    │  │    FR    │
                   └──────────┘  └──────────┘
```

---

## 🧪 Tests réalisés

### Test B2C — Mutuelle TN

```json
{
  "title": "Test Amine B2C - Mutuelle",
  "pipeline_id": 3,
  "stage_id": 11,
  "value": 120,
  "currency": "TND"
}
```

**Résultat** : ✅ Lead routé vers `Agent Qualification Mutuelle TN` (Tunisia)

### Test B2B — Conseil FR

```json
{
  "title": "Test Entreprise B2B - Conseil",
  "pipeline_id": 4,
  "stage_id": 17,
  "value": 5000,
  "currency": "EUR"
}
```

**Résultat** : ✅ Lead routé vers `Agent Qualification Conseil FR` (France)

---

## 📝 Format du payload Pipedrive v2.0

```json
{
  "meta": {
    "action": "create",
    "change_source": "app",
    "company_id": 12345678,
    "host": "lnrfinance.pipedrive.com",
    "id": 123,
    "is_bulk_update": false,
    "matches_filters": {
      "current": [],
      "previous": []
    },
    "object": "deal",
    "permitted_user_ids": [12345678],
    "pipedrive_service_name": false,
    "timestamp": 1659477129,
    "timestamp_iso": "2022-08-02T15:12:09Z",
    "trans_pending": false,
    "user_id": 12345678,
    "v": 1,
    "webhook_id": 123456
  },
  "data": {
    "id": 123,
    "title": "Nom du deal",
    "value": 1000,
    "currency": "EUR",
    "user_id": 12345678,
    "person_id": 123,
    "org_id": 456,
    "pipeline_id": 4,
    "stage_id": 17,
    "status": "open",
    "add_time": "2022-08-02 15:12:09"
  }
}
```

---

## 🔌 Intégration dans le backend

Le code FIDES est intégré directement dans `api/boot.ts` du projet LNR AI Hub :

- **Stockage** : Tableau en mémoire (`leadsStorage[]`) avec limite de 100 leads
- **Parsing** : Fonction `parsePipedrivePayload()` extrait les données du webhook
- **Routage** : Fonction `routePipeline()` route selon le `pipeline_id`
- **Dashboard** : Route `/fides-dashboard` génère un HTML avec stats en temps réel

---

## 🚀 Déploiement

Le projet est déployé sur Render via Docker :

```yaml
# render.yaml
services:
  - type: web
    name: lnr-ai-hub-backend
    runtime: docker
    plan: free
    dockerfilePath: ./Dockerfile
    port: 3000
```

Le webhook partage le même service que le backend principal (Nora, Leo, etc.).

---

## 📁 Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `api/boot.ts` | Ajout des routes FIDES (webhook, leads, dashboard) |
| `render.yaml` | Configuration du service Render (1 seul service) |

---

## 🔐 Identifiants (interne)

- **Pipedrive** : https://lnrfinance.pipedrive.com
- **Clé API** : `e83944f5426af79b84f01415c87aa5961a600682`
- **Render** : https://dashboard.render.com

---

*FIDES CONSEIL x LNR AI Hub — Mis à jour le 07/08/2026*
