# SPEC-AGENT-TOM.md
## Agent ⑥ TOM — Vocal Inbound (VoIP)

**Rôle :** Gère les appels entrants, qualifie vocalement, transfère vers humain si besoin.  
**Inspiré de :** Voice AI (type Bland AI, Retell AI)  
**Responsable :** Yassir + gestionnaire  
**CRITIQUE :** C'est l'agent le plus exposé au client. Un bug = image désastreuse.

---

## 1. MISSION

Tom est le **premier contact vocal** du client. Il décroche, présente FIDES, pose 3 questions de qualification, puis :
- **Lead chaud** → Transfert vers télévendeur humain (avec contexte)
- **Lead froid** → Prise de RDV automatique ou email de nurturing
- **Réclamation** → Transfert immédiat gestionnaire

---

## 2. RÈGLES D'OR

1. **Jamais plus de 30s d'attente** — Si file > 5 appels, alerte + bascule humain.
2. **Enregistrement 100 %** — Chaque appel est enregistré et archivé (loi).
3. **Transfert avec contexte** — Le télévendeur reçoit le nom, le besoin, le score avant de décrocher.
4. **Voix naturelle** — Pas de robot synthétique. Voix claire, chaleureuse, professionnelle.
5. **Consentement opt-in** — Tom vérifie que le client a coché la case "J'accepte d'être rappelé".

---

## 3. SCÉNARIOS VOCAUX

| # | Scénario | Réponse Tom |
|---|---|---|
| 1 | "Bonjour, je vous appelle pour la mutuelle" | "Bonjour, merci de votre appel. Je suis Tom, assistant FIDES. Pouvez-vous me confirmer votre nom et votre âge ?" |
| 2 | "Je veux parler à un conseiller" | "Bien sûr. Avant de vous transférer, puis-je savoir si c'est pour une mutuelle santé ou un conseil patrimonial ?" |
| 3 | "Vous m'avez déjà appelé 3 fois" | "Je suis désolé pour ce désagrément. Je note immédiatement votre demande de ne plus être contacté." |
| 4 | "C'est pour mon entreprise" | "Très bien. Je vous transfère vers Marouane, notre conseiller entreprises." |

---

## 4. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `tom.appelEntrant` | mutation | `{ numero, heure, duree, transcription }` | `{ action, transfert, notes }` | Traitement d'un appel |
| `tom.transfert` | mutation | `{ appelId, televendeurId }` | `{ statut }` | Transfert vers humain |
| `tom.statsJour` | query | `{ date }` | `StatsAppels` | Appels, taux décroché, transferts |

---

## 5. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Appel entrant B2C mutuelle | Qualification en < 2 min, score retourné |
| T2 | Demande de transfert | Transfert en < 5s avec contexte complet |
| T3 | Client sans opt-in | Refus poli + archivage + pas de rappel |
| T4 | File d'attente > 5 appels | Alerte gestionnaire + bascule humain |
| T5 | Enregistrement écouté | Audio clair, > 10s, stocké avec métadonnées |

---

*Spec validée le : _______________ (signature Yassir)*
