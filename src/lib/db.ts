import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'localstack-messages.db');

const db = new Database(dbPath);

// Dropar a tabela se existir
db.exec(`DROP TABLE IF EXISTS sqs_messages`);

// Criar tabela de mensagens com a nova estrutura
db.exec(`
  CREATE TABLE sqs_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_url TEXT NOT NULL,
    message_id TEXT NOT NULL,
    body TEXT NOT NULL,
    attributes TEXT,
    message_attributes TEXT,
    md5_of_body TEXT,
    md5_of_message_attributes TEXT,
    sent_timestamp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export { db };
