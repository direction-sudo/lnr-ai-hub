# SPEC-AGENT-RONY.md
## Agent ② RONY — Ressources Humaines

**Rôle :** Gère le recrutement, l'onboarding, les pointages et les alertes RH.  
**Inspiré de :** Limova RH  
**Responsable :** Yassir + gestionnaire  

---

## 1. MISSION

Rony est le **DRH numérique**. Il ne remplace pas Yassir mais lui donne du temps.

- **Recrutement** : Publie les offres, trie les CV, planifie les entretiens
- **Onboarding** : Checklist jour 1 (compte, badge, matériel, formation)
- **Pointage** : Enregistre heures d'arrivée/départ, alerte retard > 15 min
- **Plannings** : Synchronise les congés, les absences, les remplacements

---

## 2. RÈGLES D'OR

1. **Jamais de décision de recrutement sans Yassir** — Rony trie, Yassir décide.
2. **Pointage irréfutable** — Connexion/déconnexion via téléphonie (pas de bouton "je suis là").
3. **Alerte retard immédiate** — > 15 min = WhatsApp à la gestionnaire.
4. **Données personnelles protégées** — RGPD strict, accès minimum.

---

## 3. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `rony.pointage` | mutation | `{ televendeurId, type }` | `{ statut }` | Pointage arrivée/départ |
| `rony.alertesRetard` | query | — | `AlerteRH[]` | Retards et absences du jour |
| `rony.planning` | query | `{ semaine }` | `Planning` | Planning équipe |
| `rony.statsPresence` | query | `{ mois }` | `StatsPresence` | Taux présence, heures sup |

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Télévendeur connecte son poste à 9h05 | Pointage OK, pas d'alerte |
| T2 | Télévendeur pas connecté à 9h16 | Alerte WhatsApp gestionnaire |
| T3 | Demande de congé dans le chat | Enregistrement + alerte Yassir |
| T4 | Rapport mensuel de présence | Exact à 15 min près, exportable Excel |

---

*Spec validée le : _______________ (signature Yassir)*
