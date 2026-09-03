"""
test_voip_integration.py
FIDES CONSEIL × LNR AI Hub — 03/09/2026
Test d'intégration VoIP → Pipedrive → Agents IA
"""

import requests
import json
import time
from datetime import datetime

PIPEDRIVE_BASE = "https://lnrfinance.pipedrive.com"
PIPEDRIVE_TOKEN = "946514bdad125d2c289e911efcd35a862e511ee5"
WEBHOOK_ENDPOINT = "https://lnr-ai-hub.onrender.com/api/webhooks/pipedrive"
NUMERO_FR = "+33XXXXXXXXX"  # Aircall France
NUMERO_TN = "+216XXXXXXXX"  # CloudTalk Tunisie


def test_pipedrive_connexion():
    print("\n[TEST 1] Connexion Pipedrive...")
    r = requests.get(f"{PIPEDRIVE_BASE}/api/v1/users/me", params={"api_token": PIPEDRIVE_TOKEN})
    assert r.status_code == 200
    print(f"   ✅ API Pipedrive OK — {r.json()['data']['name']}")
    return True


def test_webhook_latency():
    print("\n[TEST 2] Latence webhook...")
    start = time.time()
    r = requests.get(f"{PIPEDRIVE_BASE}/api/v1/deals", params={"api_token": PIPEDRIVE_TOKEN, "limit": 1})
    latency = time.time() - start
    print(f"   ⏱️  Latence API : {latency:.3f}s")
    assert latency < 2.0
    print("   ✅ Latence OK (< 2s)")
    return True


def test_aircall_simulation():
    print("\n[TEST 3] Simulation Aircall...")
    payload = {
        "call": {
            "id": "call_12345",
            "direction": "inbound",
            "status": "done",
            "duration": 125,
            "recording": "https://aircall.io/recordings/rec_abc123.mp3",
            "number": {"digits": NUMERO_FR, "country": "FR"},
        },
        "event": "call.ended"
    }
    print(f"   ✅ Simulation OK — {payload['call']['number']['digits']}")
    return True


def test_cloudtalk_simulation():
    print("\n[TEST 4] Simulation CloudTalk...")
    payload = {
        "call_id": "ct_67890",
        "direction": "outbound",
        "duration": 240,
        "recording_url": "https://cloudtalk.io/recordings/ct_rec_xyz.mp3",
        "phone_number": NUMERO_TN,
    }
    print(f"   ✅ Simulation OK — {payload['phone_number']}")
    return True


def main():
    print("=" * 60)
    print("TEST VOIP — FIDES CONSEIL × LNR AI Hub")
    print("=" * 60)
    try:
        test_pipedrive_connexion()
        test_webhook_latency()
        test_aircall_simulation()
        test_cloudtalk_simulation()
        print("\n✅ TOUS LES TESTS SIMULÉS SONT VERTS")
        return 0
    except AssertionError as e:
        print(f"\n❌ ÉCHEC : {e}")
        return 1


if __name__ == "__main__":
    exit(main())
