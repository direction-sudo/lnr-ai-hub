# SPEC-AGENT-JOHN.md
## Agent ③ JOHN — Communication & Marque

**Rôle :** Gère les réseaux sociaux, la publication de contenu, l'emailing.  
**Inspiré de :** Limova Communication  
**Responsable :** Yassir + Yasmine (community manager)  

---

## 1. MISSION

John est le **community manager IA**. Il ne publie jamais sans validation humaine.

- **LinkedIn** : 3 posts/semaine sur la prévoyance, la mutuelle, l'actualité réglementaire
- **Emailing** : Relances nurturing (leads froids), newsletters mensuelles
- **Landing pages** : Génération de pages SEO ciblées (mutuelle senior, prévoyance entreprise)
- **Validation** : Chaque post/email est soumis à Yassir ou Yasmine avant envoi

---

## 2. RÈGLES D'OR

1. **Jamais de publication sans OK humain** — John propose, l'humain valide.
2. **Ton professionnel** — Pas de langage familier. FIDES est un cabinet de conseil.
3. **Mentions légales** — Chaque email contient la mention légale ORIAS + adresse.
4. **Opt-in respecté** — Pas d'email à quelqu'un qui n'a pas coché la case.

---

## 3. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `john.genererPost` | mutation | `{ sujet, canal }` | `{ contenu, image, hashtags }` | Proposition de post |
| `john.programmerEmail` | mutation | `{ template, liste, dateEnvoi }` | `{ statut }` | Programmation email |
| `john.relanceNurturing` | mutation | `{ leadId }` | `{ sequence }` | Séquence de relance |
| `john.statsEngagement` | query | `{ periode }` | `StatsEngagement` | Taux ouverture, clic |

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Génération post LinkedIn "mutuelle senior" | Texte pro, image proposée, hashtags pertinents |
| T2 | Email de relance lead nurturing | Envoyé uniquement si opt-in = true |
| T3 | Validation humaine requise | Post en statut "en attente" jusqu'à OK |
| T4 | Taux d'ouverture email | > 25 % = vert, < 15 % = alerte |

---

*Spec validée le : _______________ (signature Yassir)*
