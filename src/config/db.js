const { MongoClient } = require('mongodb');

// Umgebungsvariablen aus Vercel beziehen
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_CLUSTER = process.env.MONGO_CLUSTER;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_OPTIONS = process.env.MONGO_OPTIONS;

// Konstruiere die MongoDB-URI
const MONGODB_URI = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_CLUSTER}/${MONGO_DB_NAME}?${MONGO_OPTIONS}`;

// Debugging: Überprüfe, ob alle Umgebungsvariablen vorhanden sind
if (!MONGO_USER || !MONGO_PASSWORD || !MONGO_CLUSTER || !MONGO_DB_NAME || !MONGO_OPTIONS) {
  console.error('Fehlende MongoDB-Umgebungsvariablen:', {
    MONGO_USER: !!MONGO_USER,
    MONGO_PASSWORD: !!MONGO_PASSWORD,
    MONGO_CLUSTER: !!MONGO_CLUSTER,
    MONGO_DB_NAME: !!MONGO_DB_NAME,
    MONGO_OPTIONS: !!MONGO_OPTIONS
  });
  throw new Error('Fehlende MongoDB-Umgebungsvariablen');
}

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Verbunden mit MongoDB');
  return { db: client.db(MONGO_DB_NAME), client };
}

module.exports = { connectToDatabase };
