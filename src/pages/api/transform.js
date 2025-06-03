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
    console.log('Sende Testantwort...');
    return res.status(200).json({
      message: 'Testantwort von der API',
      restrictedZones: [{ lat: 52.52, lng: 13.405, radius: 100, type: 'school', name: 'Beispiel-Schule' }],
      pedestrianZones: [{ type: 'pedestrian', coordinates: [[[13.4, 52.5], [13.41, 52.5], [13.41, 52.51], [13.4, 52.51]]] }]
    });
  } catch (error) {
    console.error('Unbehandelter Fehler in der API-Route:', error);
    return res.status(500).json({ error: 'Serverfehler: ' + error.message });
  }
}
