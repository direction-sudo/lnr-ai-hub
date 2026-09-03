# PROCEDURE-AIRCALL-FRANCE.md
## Procédure d'installation — Numéro France B2B (Conseil FR)

**Date :** 03/09/2026
**Opérateur retenu :** Aircall (plan Professional)
**Marché :** France (B2B — Conseil FR)
**Budget :** ~40 €/user/mois × 4 users France = 160 €/mois HT

---

## Étape 1 — Création du compte (5 min)

1. Aller sur https://aircall.io
2. Cliquer "Start Free Trial" (essai 7 jours, aucune CB requise)
3. Renseigner :
   - Email : yassir@fides-conseil.fr
   - Nom entreprise : FIDES CONSEIL
   - Taille équipe : 4 (Marouane + 3 conseillers France)
   - Usage : Sales / Call center

## Étape 2 — Achat numéro France (2 min)

1. Dashboard Aircall → Numbers → "Add a number"
2. Sélectionner :
   - Country : France 🇫🇷
   - Type : Geographic (Local) ou National (09 XX XX XX XX)
3. Aucun document requis pour la France (self-service)
4. Le numéro est actif immédiatement

## Étape 3 — Configuration enregistrement (obligatoire légalement)

1. Settings → Call Settings → Recording
2. Activer "Automatic recording" sur INBOUND + OUTBOUND
3. Sélectionner "Store indefinitely" (ou 3 ans minimum)
4. Activer "Play recording disclaimer"

## Étape 4 — Intégration Pipedrive (1 clic)

1. Marketplace Aircall → Pipedrive
2. Autoriser la connexion OAuth
3. Mapping : Appel entrant → Activité "Call" + lien audio

## Étape 5 — Test d'acceptation (15 min)

| Test | Action | Résultat attendu |
|---|---|---|
| T1 | Appeler le numéro France | Décroché, file d'attente ou agent |
| T2 | Appel sortant (click-to-dial) | Numéro composé, enregistrement actif |
| T3 | Vérifier enregistrement Aircall | Audio lisible, > 10 secondes |
| T4 | Vérifier activité Pipedrive | Fiche créée avec lien audio |
| T5 | Webhook temps réel | Payload JSON reçu en < 2s |

**Livrable validé quand :** Les 5 tests sont VERTS.
