const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'geojson';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Verbunden mit MongoDB');
  return { db: client.db(DB_NAME), client };
}

module.exports = { connectToDatabase };
