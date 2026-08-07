from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import json
from datetime import datetime
from collections import deque
import os

app = Flask(__name__)
CORS(app)

# Stockage en memoire (max 100 derniers leads)
leads_storage = deque(maxlen=100)

# Configuration routage B2C/B2B
PIPELINE_ROUTING = {
    3: {
        "name": "Mutuelle TN",
        "type": "B2C",
        "currency": "TND",
        "market": "Tunisia",
        "agent": "Agent Qualification Mutuelle TN"
    },
    4: {
        "name": "Conseil FR",
        "type": "B2B",
        "currency": "EUR",
        "market": "France",
        "agent": "Agent Qualification Conseil FR"
    }
}

def parse_webhook_payload(payload):
    data = payload.get('data', {})
    meta = payload.get('meta', {})
    return {
        "deal_id": data.get('id'),
        "title": data.get('title'),
        "person_id": data.get('person_id'),
        "org_id": data.get('org_id'),
        "pipeline_id": data.get('pipeline_id'),
        "stage_id": data.get('stage_id'),
        "value": data.get('value'),
        "currency": data.get('currency'),
        "status": data.get('status'),
        "webhook_timestamp": meta.get('timestamp'),
        "event_action": meta.get('action'),
    }

def route_pipeline(pipeline_id):
    route = PIPELINE_ROUTING.get(pipeline_id)
    if not route:
        return {"status": "ERROR", "message": f"Pipeline ID {pipeline_id} inconnu"}
    return {
        "status": "OK",
        "pipeline_id": pipeline_id,
        "type": route["type"],
        "currency": route["currency"],
        "agent": route["agent"],
        "routing_message": f"LEAD {route['type']} detecte — Envoyer vers {route['agent']} ({route['currency']})"
    }

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        payload = request.get_json(force=True)
        parsed = parse_webhook_payload(payload)
        routing = route_pipeline(parsed.get('pipeline_id'))
        
        lead = {
            "id": parsed.get('deal_id'),
            "title": parsed.get('title'),
            "person_id": parsed.get('person_id'),
            "org_id": parsed.get('org_id'),
            "pipeline_id": parsed.get('pipeline_id'),
            "pipeline_name": routing.get('type') == 'B2C' and 'Mutuelle TN' or (routing.get('type') == 'B2B' and 'Conseil FR' or 'Unknown'),
            "stage_id": parsed.get('stage_id'),
            "value": parsed.get('value'),
            "currency": parsed.get('currency'),
            "status": parsed.get('status'),
            "type": routing.get('type', 'UNKNOWN'),
            "market": routing.get('type') == 'B2C' and 'Tunisia' or (routing.get('type') == 'B2B' and 'France' or 'Unknown'),
            "agent": routing.get('agent', 'Unknown'),
            "webhook_timestamp": parsed.get('webhook_timestamp'),
            "received_at": datetime.now().isoformat(),
            "raw_payload": json.dumps(payload)
        }
        
        leads_storage.appendleft(lead)
        
        return jsonify({"success": True, "lead": lead}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/leads', methods=['GET'])
def get_leads():
    return jsonify({
        "leads": list(leads_storage),
        "count": len(leads_storage)
    }), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "leads_count": len(leads_storage)}), 200

DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FIDES — Dashboard Leads</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7fafc; color: #2d3748; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 2rem; text-align: center; }
    .header h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .stats { display: flex; justify-content: center; gap: 2rem; padding: 1.5rem; flex-wrap: wrap; }
    .stat-card { background: white; padding: 1.2rem 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; min-width: 140px; }
    .stat-card .value { font-size: 1.8rem; font-weight: bold; color: #1a365d; }
    .stat-card .label { font-size: 0.85rem; color: #718096; margin-top: 0.3rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 2rem; }
    table { width: 100%; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; border-collapse: collapse; }
    th { background: #edf2f7; padding: 0.75rem 1rem; text-align: left; font-weight: 600; font-size: 0.85rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.9rem; }
    tr:hover { background: #f7fafc; }
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .empty { text-align: center; padding: 3rem; color: #a0aec0; }
    .footer { text-align: center; padding: 2rem; color: #a0aec0; font-size: 0.85rem; }
    .refresh { position: fixed; bottom: 2rem; right: 2rem; background: #1a365d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 50px; cursor: pointer; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .refresh:hover { background: #2c5282; }
    .endpoint { background: #edf2f7; padding: 0.5rem 1rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; margin: 1rem auto; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>&#128202; FIDES CONSEIL — Dashboard Leads</h1>
    <p>CRM Pipedrive x LNR AI Hub — En temps reel</p>
    <div class="endpoint">Webhook endpoint: {{ endpoint }}</div>
  </div>
  <div class="stats">
    <div class="stat-card"><div class="value">{{ total }}</div><div class="label">Total Leads</div></div>
    <div class="stat-card"><div class="value">{{ b2c }}</div><div class="label">B2C (Mutuelle TN)</div></div>
    <div class="stat-card"><div class="value">{{ b2b }}</div><div class="label">B2B (Conseil FR)</div></div>
  </div>
  <div class="container">
    {% if leads %}
    <table>
      <thead>
        <tr><th>ID</th><th>Titre</th><th>Type</th><th>Pipeline</th><th>Valeur</th><th>Marche</th><th>Agent</th><th>Recu</th></tr>
      </thead>
      <tbody>
        {% for lead in leads %}
        <tr>
          <td>{{ lead.id or 'N/A' }}</td>
          <td>{{ lead.title or 'N/A' }}</td>
          <td><span class="badge" style="background:{% if lead.type == 'B2C' %}#e6fffa;color:#234e52{% elif lead.type == 'B2B' %}#bee3f8;color:#2c5282{% else %}#fef3c7;color:#92400e{% endif %}">{{ lead.type or '?' }}</span></td>
          <td>{{ lead.pipeline_name or 'N/A' }}</td>
          <td>{{ lead.value or 0 }} {{ lead.currency or '' }}</td>
          <td>{{ lead.market or 'N/A' }}</td>
          <td>{{ lead.agent or 'N/A' }}</td>
          <td>{{ lead.received_at[:16] if lead.received_at else 'N/A' }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% else %}
    <div class="empty">Aucun lead recu pour le moment.<br>Creez un deal dans Pipedrive pour voir apparaitre le lead ici.</div>
    {% endif %}
  </div>
  <div class="footer">FIDES CONSEIL x LNR AI Hub — Mis a jour en temps reel via webhook Pipedrive</div>
  <button class="refresh" onclick="location.reload()">&#128260; Actualiser</button>
</body>
</html>
"""

@app.route('/')
def dashboard():
    leads = list(leads_storage)
    b2c = sum(1 for l in leads if l.get('type') == 'B2C')
    b2b = sum(1 for l in leads if l.get('type') == 'B2B')
    endpoint = request.host_url + 'webhook'
    return render_template_string(DASHBOARD_HTML, 
        leads=leads, total=len(leads), b2c=b2c, b2b=b2b, endpoint=endpoint)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
