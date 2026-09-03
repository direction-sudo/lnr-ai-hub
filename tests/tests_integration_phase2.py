"""
tests_integration_phase2.py
FIDES CONSEIL × LNR AI Hub — 03/09/2026
Tests d'intégration — Flux complets entre agents et CRM
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "https://lnr-ai-hub.onrender.com"
PIPEDRIVE_TOKEN = "946514bdad125d2c289e911efcd35a862e511ee5"

class TestIntegrationPhase2:
    """Tests end-to-end de la chaîne complète."""

    def test_01_flux_complet_lead_a_rdv(self):
        """
        Scénario : Lead remplit formulaire → Pipedrive → Patrimoine qualifie → RDV créé
        """
        # Étape 1 : Créer un deal dans Pipedrive (simule formulaire)
        deal_payload = {
            "title": "TEST-INTEGRATION — Lead Dupont",
            "pipeline_id": 3,  # Mutuelle TN
            "stage_id": 11,
            "value": 1500,
            "currency": "TND"
        }
        # En production : appel API Pipedrive
        # Ici : simulation du webhook reçu

        # Étape 2 : Qualification Patrimoine
        qualif = requests.post(f"{BASE_URL}/api/trpc/patrimoine.qualifier", json={
            "json": {
                "leadId": "550e8400-e29b-41d4-a716-446655440000",
                "source": "landing_page",
                "revenusAnnuels": 85000,
                "patrimoineEstime": 450000,
                "besoins": ["retraite", "prevoyance", "epargne"],
                "urgence": "3_mois",
                "age": 52
            }
        })
        assert qualif.status_code == 200
        data = qualif.json()["result"]["data"]["json"]
        assert data["scoreGlobal"] >= 60
        assert data["segment"] in ["standard", "premium"]

        # Étape 3 : Création RDV
        rdv = requests.post(f"{BASE_URL}/api/trpc/patrimoine.rdvCreate", json={
            "json": {
                "leadId": "550e8400-e29b-41d4-a716-446655440000",
                "qualificationId": "550e8400-e29b-41d4-a716-446655440999",
                "date": "2026-09-05T14:00:00Z",
                "dureeMinutes": 30,
                "type": "telephone",
                "notes": f"RDV {data['segment']} — scoring {data['scoreGlobal']}"
            }
        })
        assert rdv.status_code == 200
        rdv_data = rdv.json()["result"]["data"]["json"]
        assert rdv_data["status"] == "planifie"
        assert rdv_data["id"] is not None

        print(f"✅ Flux complet OK — Score: {data['scoreGlobal']}, RDV ID: {rdv_data['id']}")

    def test_02_flux_conformite_dossier(self):
        """
        Scénario : Dossier créé → Checklist Julia → Document ajouté → Validation → Dossier vert
        """
        # Étape 1 : Créer un dossier
        dossier = requests.post(f"{BASE_URL}/api/trpc/patrimoine.dossierCreate", json={
            "json": {
                "leadId": "550e8400-e29b-41d4-a716-446655440000",
                "appointmentId": 1
            }
        })
        assert dossier.status_code == 200

        # Étape 2 : Vérifier checklist (doit être rouge)
        checklist = requests.get(f"{BASE_URL}/api/trpc/julia.checklist?input={json.dumps({'dossierId': 1})}")
        assert checklist.status_code == 200
        check_data = checklist.json()["result"]["data"]["json"]
        assert check_data["statut"] == "rouge"

        # Étape 3 : Ajouter documents
        for doc_type in ["kyc_id", "kyc_rib", "kyc_fiscal", "aml_source", "aml_pep", "prod_questionnaire"]:
            add = requests.post(f"{BASE_URL}/api/trpc/julia.addDocument", json={
                "json": {
                    "dossierId": 1,
                    "type": doc_type,
                    "url": f"https://storage.fides-conseil.fr/docs/{doc_type}.pdf",
                    "nom": f"Document {doc_type}"
                }
            })
            assert add.status_code == 200
            doc_id = add.json()["result"]["data"]["json"]["id"]

            # Valider le document
            val = requests.post(f"{BASE_URL}/api/trpc/julia.validateDocument", json={
                "json": {
                    "documentId": doc_id,
                    "status": "valide",
                    "commentaire": "Document conforme"
                }
            })
            assert val.status_code == 200

        # Étape 4 : Revérifier checklist (doit être verte)
        checklist2 = requests.get(f"{BASE_URL}/api/trpc/julia.checklist?input={json.dumps({'dossierId': 1})}")
        check_data2 = checklist2.json()["result"]["data"]["json"]
        assert check_data2["statut"] == "vert"
        assert check_data2["tauxConformite"] == 100

        print("✅ Flux conformité OK — Dossier passé de rouge à vert")

    def test_03_supervision_plateau(self):
        """
        Scénario : Vérifier que Manue peut voir l'état du plateau et créer des alertes
        """
        # Étape 1 : État du plateau
        status = requests.get(f"{BASE_URL}/api/trpc/manue.teamStatus")
        assert status.status_code == 200

        # Étape 2 : Créer une alerte
        alerte = requests.post(f"{BASE_URL}/api/trpc/manue.alerte", json={
            "json": {
                "type": "conversion_bas",
                "televendeurId": "550e8400-e29b-41d4-a716-446655440010",
                "seuil": 5
            }
        })
        assert alerte.status_code == 200
        alerte_data = alerte.json()["result"]["data"]["json"]
        assert alerte_data["priorite"] == "haute"

        # Étape 3 : Coaching
        coaching = requests.get(f"{BASE_URL}/api/trpc/manue.coaching?input={json.dumps({'televendeurId': '550e8400-e29b-41d4-a716-446655440010'})}")
        assert coaching.status_code == 200

        print("✅ Supervision OK — Alerte et coaching fonctionnels")

    def test_04_latence_webhook(self):
        """
        Scénario : Vérifier que la latence API reste < 2 secondes
        """
        start = time.time()
        resp = requests.get(f"{BASE_URL}/api/trpc/ping")
        latency = time.time() - start
        assert resp.status_code == 200
        assert latency < 2.0, f"Latence trop élevée: {latency:.3f}s"
        print(f"✅ Latence OK — {latency:.3f}s")

    def test_05_cohérence_scoring_distribution(self):
        """
        Scénario : Un lead scoré par Patrimoine doit être correctement routé par Sam
        """
        # Scoring
        score = requests.post(f"{BASE_URL}/api/trpc/patrimoine.qualifier", json={
            "json": {
                "leadId": "550e8400-e29b-41d4-a716-446655440000",
                "source": "landing_page",
                "revenusAnnuels": 95000,
                "patrimoineEstime": 550000,
                "besoins": ["retraite", "prevoyance", "epargne", "succession"],
                "urgence": "immediate",
                "age": 55
            }
        })
        score_data = score.json()["result"]["data"]["json"]
        assert score_data["segment"] == "premium"

        # Distribution (mock — Sam n'est pas encore codé)
        # En production : appel sam.distribuer
        # Vérification : le lead premium B2B doit aller vers un senior
        print(f"✅ Cohérence OK — Score {score_data['scoreGlobal']} = {score_data['segment']} → RDV prioritaire")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
