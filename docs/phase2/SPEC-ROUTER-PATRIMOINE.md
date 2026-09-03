# SPEC-ROUTER-PATRIMOINE.md
## Spécification Technique — Agent 7 FIDES Patrimoine

**Date :** 03/09/2026
**Auteur :** Amine — LNR AI Hub
**Statut :** ✅ Validée — prête pour codage
**Branche :** feature/phase2-patrimoine

---

## 1. CONTEXTE MÉTIER

**FIDES Patrimoine** est l'agent IA dédié à la qualification des rendez-vous et au scoring patrimonial des prospects B2B (Conseil FR) et B2C premium (Mutuelle TN haut de gamme).

**Flux métier :**
```
Lead CRM (Pipedrive)
    │
    ▼
Qualification Patrimoine (critères : revenus, patrimoine, besoins, urgence)
    │
    ▼
Scoring (0-100) → Seuil ≥ 60 : RDV prioritaire | < 60 : nurturing email
    │
    ▼
Créneau calendrier → Confirmation RDV → Création Dossier
```

---

## 2. ENDPOINTS À DÉVELOPPER

| Endpoint | Méthode | Input | Output | Description |
|---|---|---|---|---|
| `patrimoine.qualifier` | mutation | `QualificationInput` | `QualificationResult` | Qualifie un lead et retourne un score |
| `patrimoine.scoring` | query | `{ leadId }` | `ScorePatrimonial` | Recalcule le score d'un lead |
| `patrimoine.calendrier.list` | query | `{ dateFrom, dateTo }` | `Creneau[]` | Créneaux disponibles |
| `patrimoine.rdv.create` | mutation | `RdvInput` | `Appointment` | Crée un RDV |
| `patrimoine.rdv.update` | mutation | `{ id, status }` | `Appointment` | Met à jour un RDV |
| `patrimoine.dossier.create` | mutation | `{ leadId, appointmentId }` | `Dossier` | Crée un dossier client |
| `patrimoine.dossier.get` | query | `{ id }` | `Dossier & Documents[]` | Récupère un dossier |
| `patrimoine.stats` | query | `{ periode }` | `KpiPatrimoine` | KPIs patrimoine |

---

## 3. LOGIQUE DE SCORING

| Critère | Poids | Règle |
|---|---|---|
| Revenus | 25 pts | > 80k€ = 25 | 50-80k = 18 | 30-50k = 12 | < 30k = 5 |
| Patrimoine | 25 pts | > 500k€ = 25 | 200-500k = 18 | 50-200k = 10 | < 50k = 5 |
| Adéquation besoins | 25 pts | 1 besoin = 8 | 2 = 16 | 3+ = 25 |
| Urgence | 25 pts | Immédiate = 25 | 3 mois = 18 | 6 mois = 10 | 1 an = 5 |

**Segmentation :**
- Premium (≥ 75) → RDV sous 48h avec senior
- Standard (60-74) → RDV sous 7 jours
- Nurturing (40-59) → Email sequence (agent Sam)
- Non qualifié (< 40) → Archive, reprise dans 6 mois

---

## 4. DÉPENDANCES

- Tables `appointments`, `dossiers`, `dossier_documents` (DB Phase 0)
- Router `leads-router.ts` (Phase 1) — consomme `leads.getById`
- Agent Sam (Phase 2.2) — le scoring alimente la distribution

---

*FIDES CONSEIL × LNR AI Hub — 03/09/2026*
