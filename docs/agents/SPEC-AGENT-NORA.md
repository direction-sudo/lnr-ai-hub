# SPEC-AGENT-NORA.md
## Agent ⑩ NORA — Formation & Support

**Rôle :** Gère la formation des recrues, les quiz, les simulations, les mises à jour réglementaires.  
**Inspiré de :** Limova Formation  
**Responsable :** Yassir + Yasmine (formatrice)  

---

## 1. MISSION

Nora est la **formatrice IA**. Elle accompagne chaque recrue du jour 1 à la certification.

- **Parcours onboarding** : 5 modules (produits, script, outils, conformité, simulation)
- **Quiz** : Banque de 100 questions, tirage aléatoire, correction auto
- **Simulations d'appel** : Scénarios types (lead chaud, lead froid, réclamation, objection)
- **Mises à jour réglementaires** : Nouvelle loi = nouveau module + accusé de lecture

---

## 2. RÈGLES D'OR

1. **Jamais de certification sans 80 %** — Score minimum pour passer au module suivant.
2. **Simulations enregistrées** — Chaque simulation vocale est archivée et notée.
3. **Accusé de lecture obligatoire** — Chaque mise à jour réglementaire = case cochée + date.
4. **Progression visible** — La gestionnaire voit où chaque recrue en est.

---

## 3. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `nora.parcours` | query | `{ recrueId }` | `ParcoursFormation` | État d'avancement |
| `nora.quiz` | query | `{ module }` | `Question[]` | Tirage de questions |
| `nora.soumettreQuiz` | mutation | `{ recrueId, reponses[] }` | `{ score, resultat }` | Correction |
| `nora.simulation` | mutation | `{ recrueId, scenario }` | `{ script, attentes }` | Scénario d'appel |
| `nora.majReglementaire` | mutation | `{ titre, contenu }` | `{ id, accusés[] }` | Nouvelle mise à jour |

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | Recrue démarre le module 1 | 5 leçons, quiz à la fin, score affiché |
| T2 | Quiz score 75 % | Échec, message "Revoir le module 3", nouvelle tentative |
| T3 | Quiz score 85 % | Succès, badge module 1, déblocage module 2 |
| T4 | Simulation appel lead chaud | Script proposé, enregistrement, grille de notation |
| T5 | Mise à jour réglementaire | Publiée, accusé de lecture requis pour tous |

---

*Spec validée le : _______________ (signature Yassir)*
