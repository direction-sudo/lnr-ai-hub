# ARCHITECTURE-VOIP-HYBRIDE.md
## Architecture VoIP FIDES CONSEIL — Double marché

**Date :** 03/09/2026
**Statut :** Architecture hybride validée — Aircall FR + CloudTalk TN

---

## Schéma global

```
┌─────────────────────────────────────────────────────────────┐
│                    FIDES CONSEIL                            │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐│
│  │   MARCHÉ B2B FR     │    │      MARCHÉ B2C TN          ││
│  │   Conseil FR        │    │      Mutuelle TN            ││
│  │   Devise : EUR      │    │      Devise : TND           ││
│  └──────────┬──────────┘    └─────────────┬───────────────┘│
│             │                              │                │
│             ▼                              ▼                │
│  ┌─────────────────────┐    ┌─────────────────────────────┐│
│  │   AIRCALL           │    │   CLOUDTALK                 ││
│  │   Numéro +33        │    │   Numéro +216               ││
│  │   4 postes          │    │   4 postes                  ││
│  │   ~160 €/mois       │    │   ~100 €/mois               ││
│  │   Intégration       │    │   Intégration via           ││
│  │   Pipedrive native  │    │   Zapier/API                ││
│  └──────────┬──────────┘    └─────────────┬───────────────┘│
│             │                              │                │
│             └──────────────┬───────────────┘                │
│                            ▼                               │
│                 ┌─────────────────────┐                    │
│                 │   PIPEDRIVE CRM     │                    │
│                 │   Webhook → Agents  │                    │
│                 └─────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Pourquoi CloudTalk pour la Tunisie ?

- Numéro +216 confirmé disponible (doc officielle)
- 160+ pays couverts
- Intégration Pipedrive native
- Enregistrement inclus
- Support 24/7 live chat

## Budget mensuel total (8 postes)

| Composant | Coût HT |
|---|---|
| Aircall Professional — 4 users FR | ~160 € |
| CloudTalk Essential — 4 users TN | ~100 € |
| Numéros supplémentaires | ~12 € |
| **TOTAL** | **~272 €/mois** |

## Plan B économique

Si budget 272 € refusé :
- France : Aircall Essentials (3 users) = 90 €
- Tunisie : Trunk SIP Ooredoo + 3CX Cloud = ~60 €
- **TOTAL = ~150 €/mois** (mais config technique + pas d'intégration Pipedrive native TN)

---

*FIDES CONSEIL × LNR AI Hub — 03/09/2026*
