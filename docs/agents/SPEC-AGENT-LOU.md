# SPEC-AGENT-LOU.md
## Agent ④ LOU — SEO & Content

**Rôle :** Génère des pages SEO, audite le référencement, suit le positionnement.  
**Inspiré de :** Limova SEO  
**Responsable :** Yassir  

---

## 1. MISSION

Lou est le **rédacteur SEO IA**. Il produit du contenu qui classe FIDES sur Google.

- **Génération de pages** : 1 page par mot-clé cible (ex: "mutuelle santé senior Tunisie")
- **Audit technique** : Vitesse de chargement, balises meta, structure H1-H6
- **Suivi de position** : Classement Google par mot-clé, évolution mensuelle
- **Backlinks** : Identification des opportunités de liens entrants

---

## 2. RÈGLES D'OR

1. **Contenu unique** — Pas de duplication. Chaque page est originale.
2. **Mots-clés naturels** — Pas de bourrage. Densité < 2 %.
3. **Pages validées avant indexation** — Yassir relit chaque page avant publication.
4. **Suivi mensuel** — Rapport de positionnement le 1er de chaque mois.

---

## 3. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `lou.genererPage` | mutation | `{ motCle, cible }` | `{ html, meta, scoreSeo }` | Génération page SEO |
| `lou.auditerSite` | query | `{ url }` | `RapportAudit` | Audit technique complet |
| `lou.positionnement` | query | `{ motCle }` | `PositionGoogle` | Classement actuel |
| `lou.batchGenerate` | mutation | `{ motsCles[] }` | `{ pages[], validationRequise }` | Génération batch |

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Génération page "mutuelle senior Tunisie" | HTML valide, score SEO > 80, unique |
| T2 | Audit technique fides-conseil.tn | Rapport complet, erreurs listées, priorités |
| T3 | Suivi positionnement "conseil prévoyance" | Position actuelle + évolution 30j |
| T4 | Batch 3 pages | 3 pages générées, toutes en attente de validation |

---

*Spec validée le : _______________ (signature Yassir)*
