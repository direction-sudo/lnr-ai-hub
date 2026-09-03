# SPEC-AGENT-CHARLY.md
## Agent ① CHARLY — Orchestrateur de Direction

**Rôle :** Supervise la stratégie globale, coordonne les 8 autres agents, produit les rapports de direction.  
**Inspiré de :** Charly+ (orchestrateur)  
**Responsable :** Yassir (validation finale)  

---

## 1. MISSION

Charly est le **cerveau** du système. Il ne vend pas, ne téléphone pas, ne publie pas. Il **oriente**, **priorise** et **signale**.

- Chaque matin à 8h00 : produire le rapport quotidien (présences, leads, incidents, KPIs)
- En temps réel : alerter Yassir si un seuil critique est dépassé (taux de transfert > 15 %, file d'attente > 5 appels, agent down)
- Hebdomadaire : produire le tableau de bord 9/9 (statut de chaque agent)

---

## 2. RÈGLES D'OR

1. **Jamais de décision sans donnée** — Charly ne "pense" pas, il agrège.
2. **Alerte avant problème** — Si le taux de conversion d'un télévendeur chute < 5 %, alerte en < 5 min.
3. **Rapport à 8h00 pile** — Cron quotidien, fuseau Africa/Tunis.
4. **Langage métier** — Yassir ne lit pas de JSON. Charly produit du texte clair.

---

## 3. FLUX DE DONNÉES

```
Sources (toutes les 60s)
  ├── Pipedrive API (deals, activités)
  ├── Téléphonie API (appels, files, enregistrements)
  ├── Agents IA (logs, erreurs, latence)
  └── Google Sheets (pointage RH, plannings)
         │
         ▼
    Charly (agrégation + scoring)
         │
         ▼
    Sorties
      ├── Rapport 8h00 (WhatsApp + email)
      ├── Alertes temps réel (WhatsApp)
      └── Dashboard Cockpit Direction (/cockpit)
```

---

## 4. ENDPOINTS tRPC

| Endpoint | Type | Input | Output | Description |
|---|---|---|---|---|
| `charly.rapportQuotidien` | query | `{ date }` | `RapportDirection` | Rapport consolidé du jour |
| `charly.alertesActives` | query | — | `Alerte[]` | Liste des alertes non résolues |
| `charly.tableauAgents` | query | — | `AgentStatus[]` | Statut 9/9 agents |
| `charly.kpiTempsReel` | query | — | `KpiTempsReel` | Snapshot global < 30s |

---

## 5. TESTS D'ACCEPTATION

| Test | Scénario | Résultat attendu |
|---|---|---|
| T1 | 8h00 cron déclenché | Rapport reçu sur WhatsApp en < 2 min |
| T2 | Taux transfert Tom passe à 20 % | Alerte WhatsApp à Yassir en < 5 min |
| T3 | Agent Sam down (erreur 500) | Alerte critique + bascule vers Plan B |
| T4 | Rapport ouvert sur mobile | Lisible sans scroll horizontal |

---

*Spec validée le : _______________ (signature Yassir)*
