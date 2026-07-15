#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Start script for Render
# Push schema → Seed DB → Start server
# ═══════════════════════════════════════════════════════════════

set -e

echo "[LNR] Starting LNR AI Hub..."

# 1. Push database schema (create tables if not exists)
echo "[LNR] Pushing database schema..."
npx drizzle-kit push --force 2>/dev/null || true

# 2. Seed agents (Nora + Leo) if agents table is empty
echo "[LNR] Checking if seed is needed..."
node -e "
const Database = require('better-sqlite3');
const db = new Database('/app/data/lnr-ai-hub.db');

try {
  const result = db.prepare(\"SELECT COUNT(*) as count FROM agents\").get();
  if (result.count === 0) {
    console.log('[LNR] Seeding agents...');
    const insert = db.prepare(\
      \"INSERT INTO agents (slug, name, role, description, avatar, system_prompt, capabilities, tools, personality, ai_model, is_default, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\"\
    );
    
    insert.run('nora', 'Nora', 'Agent de Communication', 'Experte en communication digitale. Nora crée du contenu engageant, gère vos réseaux sociaux et analyse les performances de vos campagnes.', '/images/avatar-nora.jpg', 'Tu es Nora, une experte en communication digitale et marketing de contenu. Tu aides les entreprises à créer du contenu viral, gérer leurs réseaux sociaux et optimiser leur présence en ligne. Tu réponds en français de manière créative et professionnelle.', JSON.stringify(['publication', 'analytics', 'engagement', 'story', 'reel', 'carousel']), JSON.stringify(['content_generator', 'scheduler', 'analytics_dashboard', 'hashtag_optimizer']), 'creative, proactive, à la pointe des tendances', 'moonshot-v1-8k', 'true', 'active');
    
    insert.run('leo', 'Leo', 'Agent RH', 'Expert en ressources humaines. Leo gère le recrutement, l onboarding et l analyse des performances de vos équipes.', '/images/avatar-leo.jpg', 'Tu es Leo, un expert en ressources humaines et recrutement. Tu aides les entreprises à trouver les meilleurs talents, optimiser leurs processus d onboarding et améliorer la gestion de leurs équipes. Tu réponds en français de manière professionnelle et structurée.', JSON.stringify(['recrutement', 'onboarding', 'analytics', 'screening', 'entretien']), JSON.stringify(['cv_parser', 'interview_scheduler', 'skills_assessment', 'onboarding_automation']), 'professionnel, méthodique, orienté résultats', 'moonshot-v1-8k', 'true', 'active');
    
    console.log('[LNR] Agents seeded successfully!');
  } else {
    console.log('[LNR] Agents already exist, skipping seed.');
  }
} catch (err) {
  console.log('[LNR] Seed error (non-fatal):', err.message);
}

db.close();
" 2>/dev/null || true

# 3. Start server
echo "[LNR] Starting server..."
exec node dist/boot.js
