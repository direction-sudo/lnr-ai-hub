# SPEC-AGENT-SAM.md
## Agent ⑤ SAM — Distribution & Scoring des Leads

**Rôle :** Attribue chaque lead au bon télévendeur selon des règles explicites.  
**Inspiré de :** Distribution automatique (type Salesforce Lead Assignment)  
**Responsable :** Yassir + gestionnaire  

---

## 1. MISSION

Sam est le **routeur** des leads. Quand un lead entre (formulaire, appel, webhook), Sam décide en < 1 seconde qui le traite.

**Règles de distribution :**
1. **Score ≥ 75 (premium)** → Télévendeur senior (Marouane ou senior TN), sous 2h
2. **Score 60-74 (standard)** → Télévendeur disponible, sous 24h
3. **Score < 60 (nurturing)** → Agent email (John), pas d'appel
4. **B2B France** → Marouane uniquement
5. **B2C Tunisie** → Rotation équipe TN (7 recrues)

---

## 2. RÈGLES D'OR

1. **Jamais 2 télévendeurs sur le même lead** — Déduplication stricte.
2. **Respect du créneau horaire** — Pas d'appel avant 9h00 ou après 18h00 (France/Tunisie).
3. **File d'attente visible** — La gestionnaire voit qui attend depuis combien de temps.
4. **Reprise automatique** — Si un télévendeur ne prend pas le lead en < 4h, redistribution.

---

## 3. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `sam.distribuer` | mutation | `{ leadId, score, type, marche }` | `{ televendeurId, priorite }` | Attribution d'un lead |
| `sam.fileAttente` | query | — | `LeadEnAttente[]` | File d'attente temps réel |
| `sam.reprendre` | mutation | `{ leadId }` | `{ nouveauTelevendeurId }` | Redistribution manuelle |
| `sam.stats` | query | `{ periode }` | `StatsDistribution` | Taux d'attente, redistribution |

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Lead B2B premium (score 85) | Attribué à Marouane en < 1s |
| T2 | Lead B2C standard (score 65) | Attribué à la recrue la moins chargée |
| T3 | Lead non pris en 4h | Redistribué automatiquement |
| T4 | 2 leads simultanés | 2 télévendeurs différents assignés |

---

*Spec validée le : _______________ (signature Yassir)*
