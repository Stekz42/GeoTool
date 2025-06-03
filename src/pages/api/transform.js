import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  try {
    console.log('API-Anfrage empfangen:', req.method);

    if (req.method !== 'POST') {
      console.log('Ungültige Methode:', req.method);
      return res.status(405).json({ error: 'Nur POST-Anfragen erlaubt' });
    }

    console.log('Initialisiere formidable...');
    const form = formidable({ multiples: true });

    console.log('Parse Dateien...');
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Fehler beim Parsen der Dateien:', err);
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    console.log('Prüfe Dateien...');
    const restrictedFile = files['restricted-zones']?.[0];
    const pedestrianFile = files['pedestrian-zones']?.[0];
    if (!restrictedFile || !pedestrianFile) {
      console.log('Fehlende Dateien:', { restrictedFile: !!restrictedFile, pedestrianFile: !!pedestrianFile });
      return res.status(400).json({ error: 'Bitte beide Dateien hochladen' });
    }

    console.log('Lese GeoJSON-Dateien...');
    let restrictedRaw, pedestrianRaw;
    try {
      restrictedRaw = JSON.parse(fs.readFileSync(restrictedFile.filepath, 'utf-8'));
    } catch (error) {
      console.error('Fehler beim Parsen von restricted-zones:', error);
      return res.status(400).json({ error: 'restricted-zones-raw.geojson ist kein gültiges JSON: ' + error.message });
    }
    try {
      pedestrianRaw = JSON.parse(fs.readFileSync(pedestrianFile.filepath, 'utf-8'));
    } catch (error) {
      console.error('Fehler beim Parsen von pedestrian-zones:', error);
      return res.status(400).json({ error: 'pedestrian-zones-raw.geojson ist kein gültiges JSON: ' + error.message });
    }

    console.log('Transformiere Daten...');
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

    console.log('Sende Erfolgsantwort...');
    res.status(200).json({
      message: `Erfolgreich verarbeitet: ${restrictedZones.length} restricted-zones, ${pedestrianZones.length} pedestrian-zones`,
      restrictedZones,
      pedestrianZones
    });
  } catch (error) {
    console.error('Unbehandelter Fehler:', error);
    return res.status(500).json({ error: 'Serverfehler: ' + error.message });
  }
}
