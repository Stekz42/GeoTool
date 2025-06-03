import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  console.log('API-Anfrage empfangen:', req.method);

  if (req.method !== 'POST') {
    console.log('Ungültige Methode:', req.method);
    return res.status(405).json({ error: 'Nur POST-Anfragen erlaubt' });
  }

  try {
    console.log('Initialisiere formidable...');
    const form = formidable({ multiples: true });

    console.log('Parse Dateien...');
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Fehler beim Parsen der Dateien:', err);
          reject(err);
        } else {
          console.log('Dateien erfolgreich geparst:', Object.keys(files));
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

    console.log('Dateipfade:', { restricted: restrictedFile.filepath, pedestrian: pedestrianFile.filepath });

    console.log('Lese GeoJSON-Dateien...');
    let restrictedRaw, pedestrianRaw;
    try {
      const restrictedContent = fs.readFileSync(restrictedFile.filepath, 'utf-8');
      console.log('Restricted-Datei gelesen, Größe:', restrictedContent.length);
      restrictedRaw = JSON.parse(restrictedContent);
    } catch (error) {
      console.error('Fehler beim Parsen von restricted-zones:', error);
      return res.status(400).json({ error: 'restricted-zones-raw.geojson ist kein gültiges JSON: ' +
