import formidable from 'formidable';
import { connectToDatabase } from '../../config/db';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen erlaubt' });
  }

  const form = formidable({ multiples: true });
  let client;

  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const restrictedFile = files['restricted-zones']?.[0];
    const pedestrianFile = files['pedestrian-zones']?.[0];
    if (!restrictedFile || !pedestrianFile) {
      return res.status(400).json({ error: 'Bitte beide Dateien hochladen' });
    }

    let restrictedRaw, pedestrianRaw;
    try {
      restrictedRaw = JSON.parse(fs.readFileSync(restrictedFile.filepath, 'utf-8'));
    } catch (error) {
      return res.status(400).json({ error: 'restricted-zones-raw.geojson ist kein gültiges JSON: ' + error.message });
    }
    try {
      pedestrianRaw = JSON.parse(fs.readFileSync(pedestrianFile.filepath, 'utf-8'));
    } catch (error<|control421|>

      return res.status(400).json({ error: 'pedestrian-zones-raw.geojson ist kein gültiges JSON: ' + error.message });
    }

    const restrictedZones = restrictedRaw.features.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const type = feature.properties.amenity || feature.properties.leisure || 'unknown';
      const name = feature.properties.name || 'Unbekannt';
      return { lat, lng, radius: 100, type, name };
    });

    const pedestrianZones = pedestrianRaw.features.map(feature => ({
      type: 'pedestrian',
      coordinates: feature.geometry.coordinates
    }));

    try {
      const { db, client: dbClient } = await connectToDatabase();
      client = dbClient; // Speichere den Client, um ihn später zu schließen

      const restrictedCollection = db.collection('restricted-zones');
      const pedestrianCollection = db.collection('pedestrian-zones');

      await restrictedCollection.deleteMany({});
      await pedestrianCollection.deleteMany({});

      if (restrictedZones.length > 0) {
        await restrictedCollection.insertMany(restrictedZones);
      }
      if (pedestrianZones.length > 0) {
        await pedestrianCollection.insertMany(pedestrianZones);
      }

      res.status(200).json({
        message: `Erfolgreich gespeichert: ${restrictedZones.length} restricted-zones, ${pedestrianZones.length} pedestrian-zones`,
        restrictedZones,
        pedestrianZones
      });
    } catch (error) {
      console.error('Datenbankfehler:', error);
      res.status(500).json({ error: 'Verarbeitung fehlgeschlagen: ' + error.message });
    } finally {
      if (client) {
        await client.close();
        console.log('MongoDB-Verbindung geschlossen');
      }
    }
  } catch (error) {
    console.error('Fehler:', error.message);
    res.status(500).json({ error: 'Verarbeitung fehlgeschlagen: ' + error.message });
  }
}
