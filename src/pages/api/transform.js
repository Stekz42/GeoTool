import formidable from 'formidable';
import { connectToDatabase } from '../../config/db';

export const config = {
  api: {
    bodyParser: false // Deaktiviere Standard-Body-Parser für Datei-Uploads
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen erlaubt' });
  }

  const form = formidable({ multiples: true });
  let db;

  try {
    // 1. Parse die hochgeladenen Dateien
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // 2. Prüfe, ob beide Dateien vorhanden sind
    const restrictedFile = files['restricted-zones']?.[0];
    const pedestrianFile = files['pedestrian-zones']?.[0];
    if (!restrictedFile || !pedestrianFile) {
      return res.status(400).json({ error: 'Bitte beide Dateien hochladen' });
    }

    // 3. Lies und parse die GeoJSON-Dateien
    const restrictedRaw = JSON.parse(
      require('fs').readFileSync(restrictedFile.filepath, 'utf-8')
    );
    const pedestrianRaw = JSON.parse(
      require('fs').readFileSync(pedestrianFile.filepath, 'utf-8')
    );

    // 4. Transformiere restricted-zones
    const restrictedZones = restrictedRaw.features.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const type = feature.properties.amenity || feature.properties.leisure || 'unknown';
      const name = feature.properties.name || 'Unbekannt';
      return { lat, lng, radius: 100, type, name };
    });

    // 5. Transformiere pedestrian-zones
    const pedestrianZones = pedestrianRaw.features.map(feature => ({
      type: 'pedestrian',
      coordinates: feature.geometry.coordinates
    }));

    // 6. Speichere in MongoDB
    db = await connectToDatabase();
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

    // 7. Sende Erfolgsmeldung
    res.status(200).json({
      message: `Erfolgreich gespeichert: ${restrictedZones.length} restricted-zones, ${pedestrianZones.length} pedestrian-zones`,
      restrictedZones,
      pedestrianZones
    });

  } catch (error) {
    console.error('Fehler:', error.message);
    res.status(500).json({ error: 'Verarbeitung fehlgeschlagen: ' + error.message });
  }
}
