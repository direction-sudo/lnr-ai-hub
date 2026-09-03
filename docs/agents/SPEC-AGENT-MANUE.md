# SPEC-AGENT-MANUE.md
## Agent ⑨ MANUE — Finance & Supervision

**Rôle :** Supervise les télévendeurs, produit les rapports financiers, alerte les anomalies.  
**Inspiré de :** Limova Finance  
**Responsable :** Yassir + gestionnaire  
**Statut :** ✅ ROUTER CODÉ (Phase 2) — tests en cours  

---

## 1. MISSION

Manue est le **tableau de bord vivant** du plateau. Elle voit tout, elle dit tout.

- **Supervision temps réel** : Qui appelle, depuis quand, quel résultat
- **Coaching automatisé** : Recommandations personnalisées par télévendeur
- **Alertes performance** : Taux de conversion < 5 %, absence > 15 min, file d'attente > 5
- **Rapport 8h00** : Chiffres de la veille, objectifs du jour

---

## 2. RÈGLES D'OR

1. **Données en temps réel** — Pas de cache > 30 secondes.
2. **Alerte immédiate** — Seuil dépassé = WhatsApp en < 1 min.
3. **Bienveillance** — Le coaching dit 1 point fort avant 1 axe de progrès.
4. **Confidentialité** — Les KPIs individuels ne sont visibles que par la gestionnaire et Yassir.

---

## 3. ENDPOINTS (DÉJÀ IMPLÉMENTÉS)

- `manue.teamStatus` — État du plateau temps réel
- `manue.performance` — KPIs individuels
- `manue.alerte` — Création d'alerte
- `manue.coaching` — Recommandations auto

---

## 4. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | 7 télévendeurs connectés | Dashboard affiche 7 lignes, statuts à jour |
| T2 | Taux conversion chute à 3 % | Alerte "haute" + coaching "Revoir le script" |
| T3 | Télévendeur absent 20 min | Alerte "critique" + gestionnaire notifiée |
| T4 | Rapport 8h00 | Présence, appels, conversions, objectifs du jour |

---

*Spec validée le : _______________ (signature Yassir)*
