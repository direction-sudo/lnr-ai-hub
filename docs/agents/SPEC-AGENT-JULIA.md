# SPEC-AGENT-JULIA.md
## Agent ⑧ JULIA — Documents & Conformité

**Rôle :** Vérifie la conformité KYC/AML, contrôle les documents, alerte les manquants.  
**Inspiré de :** Limova Conformité  
**Responsable :** Yassir + gestionnaire  
**Statut :** ✅ ROUTER CODÉ (Phase 2) — tests en cours  

---

## 1. MISSION

Julia est le **contrôleur de conformité**. Elle ne vend pas, elle protège.

- **Checklist KYC** : Vérifie que chaque dossier client a les documents obligatoires
- **AML** : Détecte les anomalies (montants suspects, PEP, sanctions)
- **Mentions légales** : Vérifie que chaque email/appel contient les mentions obligatoires
- **Archivage** : Classe les documents par dossier, par date, par statut

---

## 2. CHECKLIST KYC (7 ITEMS)

| # | Document | Obligatoire | Validation |
|---|---|---|---|
| 1 | Pièce d'identité valide | ✅ Oui | Date expiration > 6 mois |
| 2 | RIB signataire | ✅ Oui | Correspondance nom/ID |
| 3 | Justificatif domicile < 3 mois | ✅ Oui | Date + adresse = ID |
| 4 | Source des fonds déclarée | ✅ Oui | Texte explicite |
| 5 | Vérification PEP / sanctions | ✅ Oui | Liste officielle |
| 6 | Mandat de gestion signé | ❌ Non | Si produit géré |
| 7 | Questionnaire patrimonial complet | ✅ Oui | Tous les champs remplis |

---

## 3. ENDPOINTS (DÉJÀ IMPLÉMENTÉS)

- `julia.checklist` — Checklist KYC d'un dossier
- `julia.addDocument` — Ajout d'un document
- `julia.validateDocument` — Validation/rejet d'un document
- `julia.alertes` — Dossiers incomplets

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Dossier sans pièce d'identité | Taux conformité = 0 %, statut "rouge", alerte |
| T2 | Document ajouté et validé | Taux conformité monte, statut passe "orange" |
| T3 | Tous les documents validés | Taux = 100 %, statut "vert", dossier débloqué |
| T4 | Email sans mention légale ORIAS | Alerte Julia + blocage envoi |

---

*Spec validée le : _______________ (signature Yassir)*
