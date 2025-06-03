const fs = require('fs').promises;
const path = require('path');
const { connectToDatabase } = require('../config/db');

const RESTRICTED_ZONES_PATH = path.join(__dirname, '../raw/restricted-zones-raw.geojson');
const PEDESTRIAN_ZONES_PATH = path.join(__dirname, '../raw/pedestrian-zones-raw.geojson');

async function transformGeoJSON() {
  let client;

  try {
    console.log('Lese Eingabedateien...');
    const restrictedRaw = JSON.parse(await fs.readFile(RESTRICTED_ZONES_PATH, 'utf-8'));
    const pedestrianRaw = JSON.parse(await fs.readFile(PEDESTRIAN_ZONES_PATH, 'utf-8'));

    console.log('Transformiere restricted-zones...');
    const restrictedZones = restrictedRaw.features.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const type = feature.properties.amenity || feature.properties.leisure || 'unknown';
      const name = feature.properties.name || 'Unbekannt';
      return { lat, lng, radius: 100, type, name };
    });

    console.log('Transformiere pedestrian-zones...');
    const pedestrianZones = pedestrianRaw.features.map(feature => ({
      type: 'pedestrian',
      coordinates: feature.geometry.coordinates
    }));

    console.log('Verbinde mit MongoDB...');
    const { db, client: dbClient } = await connectToDatabase();
    client = dbClient;

    const restrictedCollection = db.collection('restricted-zones');
    const pedestrianCollection = db.collection('pedestrian-zones');

    console.log('Lösche alte Daten...');
    await restrictedCollection.deleteMany({});
    await pedestrianCollection.deleteMany({});

    console.log('Speichere neue Daten...');
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
