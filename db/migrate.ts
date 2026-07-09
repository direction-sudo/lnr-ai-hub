import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function migrate() {
  const db = getDb();

  // Create knowledge_docs table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_docs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      agentId BIGINT UNSIGNED NOT NULL,
      filename VARCHAR(255) NOT NULL,
      content TEXT,
      size INT,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create agent_analytics table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agent_analytics (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      agentId BIGINT UNSIGNED NOT NULL,
      date VARCHAR(10) NOT NULL,
      messagesSent INT DEFAULT 0,
      messagesReceived INT DEFAULT 0,
      tokensUsed INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create agent_calls table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agent_calls (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      agentId BIGINT UNSIGNED NOT NULL,
      type ENUM('audio', 'video') DEFAULT 'audio',
      duration INT DEFAULT 0,
      status ENUM('completed', 'missed', 'ongoing') DEFAULT 'completed',
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `);

  // Add aiModel column to agents if not exists
  try {
    await db.execute(sql`ALTER TABLE agents ADD COLUMN aiModel VARCHAR(50) DEFAULT 'kimi-latest'`);
  } catch {
    // Column might already exist
  }

  console.log("Migration completed!");
}

migrate().catch(console.error);
