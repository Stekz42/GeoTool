const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'geojson';

let client = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Verbunden mit MongoDB');
  }
  return client.db(DB_NAME);
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    console.log('MongoDB-Verbindung geschlossen');
  }
}

module.exports = { connectToDatabase, closeDatabase };
