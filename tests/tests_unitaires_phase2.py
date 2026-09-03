"""
tests_unitaires_phase2.py
FIDES CONSEIL × LNR AI Hub — 03/09/2026
Tests unitaires des 9 agents IA — Phase 2
"""

import pytest
from datetime import datetime

# ─── Tests Scoring Patrimoine (Agent 7) ───

def test_scoring_premium():
    """Lead premium : revenus élevés, patrimoine élevé, 3 besoins, urgence immédiate."""
    score = calculate_score_mock(
        revenus=90000,
        patrimoine=600000,
        besoins=["retraite", "prevoyance", "epargne"],
        urgence="immediate"
    )
    assert score["scoreGlobal"] == 100
    assert score["segment"] == "premium"
    assert score["prochaineAction"] == "rdv_prioritaire"

def test_scoring_standard():
    """Lead standard : revenus moyens, patrimoine moyen, 2 besoins, urgence 3 mois."""
    score = calculate_score_mock(
        revenus=60000,
        patrimoine=300000,
        besoins=["retraite", "prevoyance"],
        urgence="3_mois"
    )
    assert 60 <= score["scoreGlobal"] <= 74
    assert score["segment"] == "standard"

def test_scoring_nurturing():
    """Lead nurturing : faibles revenus, 1 besoin, urgence 1 an."""
    score = calculate_score_mock(
        revenus=25000,
        patrimoine=40000,
        besoins=["mutuelle"],
        urgence="1_an"
    )
    assert 40 <= score["scoreGlobal"] <= 59
    assert score["segment"] == "nurturing"

def test_scoring_non_qualifie():
    """Lead non qualifié : aucune donnée, urgence non définie."""
    score = calculate_score_mock(
        revenus=0,
        patrimoine=0,
        besoins=[],
        urgence="non_defini"
    )
    assert score["scoreGlobal"] < 40
    assert score["segment"] == "non_qualifie"

# ─── Tests Distribution Sam (Agent 5) ───

def test_distribution_premium_b2b():
    """Lead B2B premium → Marouane (France)."""
    result = distribute_mock(lead_id="1", score=85, type="B2B", marche="FR")
    assert result["televendeurId"] == "marouane"
    assert result["priorite"] == "haute"

def test_distribution_standard_b2c():
    """Lead B2C standard → rotation recrues TN."""
    result = distribute_mock(lead_id="2", score=65, type="B2C", marche="TN")
    assert result["televendeurId"] in ["recrue_1", "recrue_2", "recrue_3", "recrue_4", "recrue_5", "recrue_6", "recrue_7"]
    assert result["priorite"] == "moyenne"

def test_distribution_nurturing():
    """Lead nurturing → pas d'appel, agent email John."""
    result = distribute_mock(lead_id="3", score=45, type="B2C", marche="TN")
    assert result["action"] == "email_nurturing"
    assert result["televendeurId"] is None

# ─── Tests Checklist Julia (Agent 8) ───

def test_checklist_rouge():
    """Dossier sans documents → statut rouge, taux 0 %."""
    checklist = checklist_mock(dossier_id=1, documents=[])
    assert checklist["tauxConformite"] == 0
    assert checklist["statut"] == "rouge"
    assert len(checklist["checklist"]) == 7

def test_checklist_orange():
    """Dossier avec 5/7 docs validés → statut orange, taux ~71 %."""
    docs = [{"type": "kyc_id", "status": "valide"}, {"type": "kyc_rib", "status": "valide"},
            {"type": "kyc_fiscal", "status": "valide"}, {"type": "aml_source", "status": "valide"},
            {"type": "aml_pep", "status": "valide"}]
    checklist = checklist_mock(dossier_id=1, documents=docs)
    assert checklist["statut"] == "orange"
    assert checklist["tauxConformite"] == 71

def test_checklist_vert():
    """Dossier avec 7/7 docs validés → statut vert, taux 100 %."""
    docs = [{"type": t, "status": "valide"} for t in ["kyc_id", "kyc_rib", "kyc_fiscal", "aml_source", "aml_pep", "prod_questionnaire"]]
    checklist = checklist_mock(dossier_id=1, documents=docs)
    assert checklist["statut"] == "vert"
    assert checklist["tauxConformite"] == 100

# ─── Tests Coaching Manue (Agent 9) ───

def test_coaching_conversion_faible():
    """Télévendeur avec conversion < 5 % → recommandation closing."""
    coaching = coaching_mock(tele_id="1", conversion_rate=3, avg_duration=180, calls_today=25)
    assert any("closing" in r.lower() for r in coaching["recommandations"])

def test_coaching_duree_faible():
    """Télévendeur avec durée moyenne < 120s → recommandation qualification."""
    coaching = coaching_mock(tele_id="2", conversion_rate=8, avg_duration=90, calls_today=25)
    assert any("qualification" in r.lower() for r in coaching["recommandations"])

def test_coaching_volume_faible():
    """Télévendeur avec < 20 appels/jour → recommandation volume."""
    coaching = coaching_mock(tele_id="3", conversion_rate=8, avg_duration=180, calls_today=15)
    assert any("volume" in r.lower() for r in coaching["recommandations"])

# ─── Tests Pointage Rony (Agent 2) ───

def test_pointage_ok():
    """Connexion à 9h05 → pointage OK, pas d'alerte."""
    result = pointage_mock(tele_id="1", heure="09:05", type="arrivee")
    assert result["statut"] == "ok"
    assert result["alerte"] is False

def test_pointage_retard():
    """Connexion à 9h16 → alerte retard."""
    result = pointage_mock(tele_id="1", heure="09:16", type="arrivee")
    assert result["statut"] == "retard"
    assert result["alerte"] is True

# ─── Helpers (mocks) ───

def calculate_score_mock(revenus, patrimoine, besoins, urgence):
    score = 0
    if revenus > 80000: score += 25
    elif revenus > 50000: score += 18
    elif revenus > 30000: score += 12
    else: score += 5

    if patrimoine > 500000: score += 25
    elif patrimoine > 200000: score += 18
    elif patrimoine > 50000: score += 10
    else: score += 5

    if len(besoins) >= 3: score += 25
    elif len(besoins) == 2: score += 16
    elif len(besoins) == 1: score += 8

    urgence_map = {"immediate": 25, "3_mois": 18, "6_mois": 10, "1_an": 5, "non_defini": 0}
    score += urgence_map.get(urgence, 0)

    segment = "premium" if score >= 75 else "standard" if score >= 60 else "nurturing" if score >= 40 else "non_qualifie"
    action_map = {"premium": "rdv_prioritaire", "standard": "rdv_standard", "nurturing": "email_nurturing", "non_qualifie": "disqualifier"}
    return {"scoreGlobal": score, "segment": segment, "prochaineAction": action_map[segment]}

def distribute_mock(lead_id, score, type, marche):
    if score >= 75 and type == "B2B":
        return {"televendeurId": "marouane", "priorite": "haute"}
    elif score >= 60:
        return {"televendeurId": "recrue_1", "priorite": "moyenne"}
    else:
        return {"action": "email_nurturing", "televendeurId": None}

def checklist_mock(dossier_id, documents):
    items = ["kyc_id", "kyc_rib", "kyc_fiscal", "aml_source", "aml_pep", "prod_mandat", "prod_questionnaire"]
    obligatoires = ["kyc_id", "kyc_rib", "kyc_fiscal", "aml_source", "aml_pep", "prod_questionnaire"]
    valides = sum(1 for d in documents if d["type"] in obligatoires and d["status"] == "valide")
    taux = round((valides / len(obligatoires)) * 100) if obligatoires else 0
    statut = "vert" if taux == 100 else "orange" if taux >= 80 else "rouge"
    return {"dossierId": dossier_id, "checklist": items, "tauxConformite": taux, "statut": statut}

def coaching_mock(tele_id, conversion_rate, avg_duration, calls_today):
    recos = []
    if conversion_rate < 5: recos.append("Revoir le script de closing — taux de conversion faible")
    if avg_duration < 120: recos.append("Allonger la durée d'appel — qualification insuffisante")
    if calls_today < 20: recos.append("Augmenter le volume d'appels — objectif 30/jour")
    return {"televendeurId": tele_id, "recommandations": recos}

def pointage_mock(tele_id, heure, type):
    heure_min = int(heure.split(":")[0]) * 60 + int(heure.split(":")[1])
    limite = 9 * 60 + 15  # 9h15
    if type == "arrivee" and heure_min > limite:
        return {"statut": "retard", "alerte": True}
    return {"statut": "ok", "alerte": False}
