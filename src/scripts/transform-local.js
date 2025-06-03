const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Pfade zu den Eingabedateien
const RESTRICTED_ZONES_PATH = path.join(__dirname, '../raw/restricted-zones-raw.geojson');
const PEDESTRIAN_ZONES_PATH = path.join(__dirname, '../raw/pedestrian-zones-raw.geojson');

// MongoDB-Verbindung
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'geojson';
const RESTRICTED_COLLECTION = 'restricted-zones';
const PEDESTRIAN_COLLECTION = 'pedestrian-zones';

async function transformGeoJSON() {
  let client;

  try {
    // 1. Verbinde mit MongoDB
    console.log('Verbinde mit MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const restrictedCollection = db.collection(RESTRICTED_COLLECTION);
    const pedestrianCollection = db.collection(PEDESTRIAN_COLLECTION);

    // 2. Lies Eingabedateien
    console.log('Lese Eingabedateien...');
    const restrictedRaw = JSON.parse(await fs.readFile(RESTRICTED_ZONES_PATH, 'utf-8'));
    const pedestrianRaw = JSON.parse(await fs.readFile(PEDESTRIAN_ZONES_PATH, 'utf-8'));

    // 3. Transformiere restricted-zones
    console.log('Transformiere restricted-zones...');
    const restrictedZones = restrictedRaw.features.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const type = feature.properties.amenity || feature.properties.leisure || 'unknown';
      const name = feature.properties.name || 'Unbekannt';
      return { lat, lng, radius: 100, type, name };
    });

    // 4. Transformiere pedestrian-zones
    console.log('Transformiere pedestrian-zones...');
    const pedestrianZones = pedestrianRaw.features.map(feature => ({
      type: 'pedestrian',
      coordinates: feature.geometry.coordinates
    }));

    // 5. Speichere in MongoDB
    console.log('Speichere in MongoDB...');
    await restrictedCollection.deleteMany({});
    await pedestrianCollection.deleteMany({});

    if (restrictedZones.length > 0) {
      await restrictedCollection.insertMany(restrictedZones);
      console.log(`Erfolgreich ${restrictedZones.length} restricted-zones gespeichert.`);
    }
    if (pedestrianZones.length > 0) {
      await pedestrianCollection.insertMany(pedestrianZones);
      console.log(`Erfolgreich ${pedestrianZones.length} pedestrian-zones gespeichert.`);
    }

  } catch (error) {
    console.error('Fehler:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB-Verbindung geschlossen.');
    }
  }
}

transformGeoJSON();
