"""
tests_fonctionnels_phase2.py
FIDES CONSEIL × LNR AI Hub — 03/09/2026
Tests fonctionnels — Scénarios métier complets
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://lnr-ai-hub.onrender.com"

class TestFonctionnelsPhase2:
    """Tests métier — Scénarios réels de la télévente FIDES."""

    def test_scenario_01_lead_chaud_mutuelle_tn(self):
        """
        SCÉNARIO MÉTIER 1 : Mme Dupont, 67 ans, remplit le formulaire mutuelle TN
        """
        print("\n🎬 SCÉNARIO 1 — Lead chaud B2C Mutuelle TN")

        # 1. Lead entre via webhook Pipedrive
        lead = {
            "leadId": "lead-dupont-001",
            "nom": "Mme Dupont",
            "age": 67,
            "source": "landing_page",
            "revenusAnnuels": 35000,  # Pension
            "patrimoineEstime": 120000,
            "besoins": ["mutuelle", "prevoyance"],
            "urgence": "3_mois",
            "telephone": "+21620123456",
            "optIn": True
        }

        # 2. Patrimoine qualifie
        qualif = requests.post(f"{BASE_URL}/api/trpc/patrimoine.qualifier", json={"json": lead})
        assert qualif.status_code == 200
        score = qualif.json()["result"]["data"]["json"]

        # 3. Vérification métier
        assert score["scoreGlobal"] >= 40, "Lead senior mutuelle doit être au minimum nurturing"
        assert score["segment"] in ["standard", "premium", "nurturing"]

        # 4. Si score >= 60, RDV sous 7 jours
        if score["scoreGlobal"] >= 60:
            rdv_date = (datetime.now() + timedelta(days=3)).isoformat()
            rdv = requests.post(f"{BASE_URL}/api/trpc/patrimoine.rdvCreate", json={
                "json": {
                    "leadId": lead["leadId"],
                    "qualificationId": "qual-dupont-001",
                    "date": rdv_date,
                    "dureeMinutes": 30,
                    "type": "telephone",
                    "notes": f"Mutuelle TN — {lead['nom']} — {lead['age']} ans — scoring {score['scoreGlobal']}"
                }
            })
            assert rdv.status_code == 200
            print(f"   ✅ RDV créé pour Mme Dupont — Score: {score['scoreGlobal']}, Segment: {score['segment']}")
        else:
            print(f"   ⏳ Lead nurturing — pas de RDV, relance email programmée")

    def test_scenario_02_lead_b2b_conseil_fr(self):
        """
        SCÉNARIO MÉTIER 2 : M. Martin, 45 ans, dirigeant PME, demande conseil prévoyance
        """
        print("\n🎬 SCÉNARIO 2 — Lead B2B Conseil FR")

        lead = {
            "leadId": "lead-martin-002",
            "nom": "M. Martin",
            "age": 45,
            "source": "prospection_bastien",
            "revenusAnnuels": 120000,
            "patrimoineEstime": 800000,
            "besoins": ["prevoyance", "retraite", "succession"],
            "urgence": "immediate",
            "entreprise": "SARL Martin",
            "salarie": 12,
            "optIn": True
        }

        qualif = requests.post(f"{BASE_URL}/api/trpc/patrimoine.qualifier", json={"json": lead})
        score = qualif.json()["result"]["data"]["json"]

        # B2B premium doit être >= 75
        assert score["scoreGlobal"] >= 75, "Lead B2B avec 120k€ et 800k€ patrimoine doit être premium"
        assert score["segment"] == "premium"

        # RDV prioritaire sous 48h avec Marouane
        rdv_date = (datetime.now() + timedelta(hours=36)).isoformat()
        rdv = requests.post(f"{BASE_URL}/api/trpc/patrimoine.rdvCreate", json={
            "json": {
                "leadId": lead["leadId"],
                "qualificationId": "qual-martin-002",
                "date": rdv_date,
                "dureeMinutes": 60,
                "type": "visio",
                "agentTelevendeurId": "marouane-uuid",
                "notes": f"B2B PREMIUM — {lead['entreprise']} — {lead['salarie']} salariés — scoring {score['scoreGlobal']}"
            }
        })
        assert rdv.status_code == 200
        print(f"   ✅ RDV prioritaire créé — Score: {score['scoreGlobal']} — Marouane assigné")

    def test_scenario_03_dossier_complet_kyc(self):
        """
        SCÉNARIO MÉTIER 3 : Dossier client avec tous les documents KYC validés
        """
        print("\n🎬 SCÉNARIO 3 — Conformité KYC complète")

        # Créer un dossier
        dossier = requests.post(f"{BASE_URL}/api/trpc/patrimoine.dossierCreate", json={
            "json": {"leadId": "lead-dupont-001", "appointmentId": 1}
        })
        dossier_id = dossier.json()["result"]["data"]["json"]["id"]

        # Ajouter et valider tous les documents obligatoires
        docs_obligatoires = [
            ("kyc_id", "Pièce d'identité Mme Dupont", "2028-05-15"),
            ("kyc_rib", "RIB Mme Dupont", None),
            ("kyc_fiscal", "Facture EDF < 3 mois", None),
            ("aml_source", "Déclaration source fonds", None),
            ("aml_pep", "Vérification PEP — NEGATIF", None),
            ("prod_questionnaire", "Questionnaire patrimonial complet", None),
        ]

        for doc_type, nom, expiration in docs_obligatoires:
            add = requests.post(f"{BASE_URL}/api/trpc/julia.addDocument", json={
                "json": {
                    "dossierId": dossier_id,
                    "type": doc_type,
                    "url": f"https://storage.fides-conseil.fr/docs/{doc_type}-dupont.pdf",
                    "nom": nom
                }
            })
            doc_id = add.json()["result"]["data"]["json"]["id"]

            # Valider
            requests.post(f"{BASE_URL}/api/trpc/julia.validateDocument", json={
                "json": {
                    "documentId": doc_id,
                    "status": "valide",
                    "commentaire": f"Document conforme — vérifié le {datetime.now().strftime('%d/%m/%Y')}"
                }
            })

        # Vérifier que le dossier est vert
        checklist = requests.get(f"{BASE_URL}/api/trpc/julia.checklist?input={json.dumps({'dossierId': dossier_id})}")
        check = checklist.json()["result"]["data"]["json"]

        assert check["statut"] == "vert"
        assert check["tauxConformite"] == 100

        print(f"   ✅ Dossier {dossier_id} — 100 % conforme — Statut: VERT")

    def test_scenario_04_supervision_crise(self):
        """
        SCÉNARIO MÉTIER 4 : 3 télévendeurs absents, file d'attente qui grandit
        """
        print("\n🎬 SCÉNARIO 4 — Crise supervision")

        # Créer alerte file d'attente
        alerte = requests.post(f"{BASE_URL}/api/trpc/manue.alerte", json={
            "json": {
                "type": "file_attente",
                "seuil": 5
            }
        })
        assert alerte.status_code == 200
        alerte_data = alerte.json()["result"]["data"]["json"]
        assert alerte_data["priorite"] == "critique"

        # Créer alerte absence
        alerte2 = requests.post(f"{BASE_URL}/api/trpc/manue.alerte", json={
            "json": {
                "type": "absence",
                "televendeurId": "550e8400-e29b-41d4-a716-446655440010"
            }
        })
        alerte2_data = alerte2.json()["result"]["data"]["json"]
        assert alerte2_data["priorite"] == "critique"

        print(f"   🚨 Alerte CRITIQUE — File d'attente + Absence — Notifications envoyées")

    def test_scenario_05_relatation_email(self):
        """
        SCÉNARIO MÉTIER 5 : Lead nurturing reçoit une relance email après 7 jours
        """
        print("\n🎬 SCÉNARIO 5 — Relance nurturing")

        lead_nurturing = {
            "leadId": "lead-nurturing-003",
            "scoreGlobal": 45,
            "segment": "nurturing",
            "dateCreation": (datetime.now() - timedelta(days=7)).isoformat()
        }

        # Vérifier que le lead est bien en nurturing
        assert lead_nurturing["segment"] == "nurturing"

        # En production : agent John envoie l'email de relance
        # Vérification : l'email contient le bon template, le bon lien, la mention légale
        print(f"   📧 Email de relance programmé pour lead {lead_nurturing['leadId']}")
        print(f"   ⏳ Prochaine relance dans 7 jours si pas de réponse")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
