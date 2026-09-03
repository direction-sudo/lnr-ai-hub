# SPEC-AGENT-PATRIMOINE.md
## Agent ⑦ FIDES PATRIMOINE — Qualification & Scoring Patrimonial

**Rôle :** Qualifie les leads B2B/B2C premium, calcule un score patrimonial, planifie les RDV.  
**Statut :** ✅ CODÉ ET TESTÉ (Phase 2)  
**Responsable :** Yassir  

---

## 1. MISSION (DÉJÀ IMPLÉMENTÉE)

- Reçoit un lead du webhook Pipedrive
- Pose 4 questions (revenus, patrimoine, besoins, urgence)
- Calcule un score 0-100
- Segment : premium (≥75), standard (60-74), nurturing (40-59), non qualifié (<40)
- Crée le RDV dans le calendrier
- Crée le dossier client

---

## 2. SCORING (DÉJÀ IMPLÉMENTÉ)

| Critère | Poids | Règle |
|---|---|---|
| Revenus | 25 pts | >80k€=25, 50-80k=18, 30-50k=12, <30k=5 |
| Patrimoine | 25 pts | >500k€=25, 200-500k=18, 50-200k=10, <50k=5 |
| Besoins | 25 pts | 3+ besoins=25, 2=16, 1=8 |
| Urgence | 25 pts | Immédiate=25, 3mois=18, 6mois=10, 1an=5 |

---

## 3. ENDPOINTS (DÉJÀ IMPLÉMENTÉS)

- `patrimoine.qualifier` — Qualification + scoring
- `patrimoine.rdvCreate` — Création RDV
- `patrimoine.dossierCreate` — Création dossier
- `patrimoine.stats` — KPIs patrimoine

---

## 4. TESTS (DÉJÀ PASSÉS)

- ✅ Score 86 = premium (testé le 03/09/2026)
- ✅ RDV créé avec ID 1
- ✅ Dossier créé et récupérable

---

*Spec validée et codée le 03/09/2026*
