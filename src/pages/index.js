import { useState } from 'react';

export default function Home() {
  const [restrictedFile, setRestrictedFile] = useState(null);
  const [pedestrianFile, setPedestrianFile] = useState(null);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restrictedFile || !pedestrianFile) {
      setMessage('Bitte beide Dateien auswählen');
      return;
    }

    // Prüfe Dateigröße (Vercel-Limit: 4.5 MB)
    const maxSize = 4.5 * 1024 * 1024; // 4.5 MB in Bytes
    if (restrictedFile.size > maxSize || pedestrianFile.size > maxSize) {
      setMessage('Fehler: Eine der Dateien ist zu groß (max. 4.5 MB). Bitte lokal mit `npm run transform` verarbeiten.');
      return;
    }

    const formData = new FormData();
    formData.append('restricted-zones', restrictedFile);
    formData.append('pedestrian-zones', pedestrianFile);

    setMessage('Verarbeite...');
    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        body: formData
      });

      if (response.status === 413) {
        setMessage('Fehler: Dateien sind zu groß für Vercel (max. 4.5 MB). Bitte lokal mit `npm run transform` verarbeiten.');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setResult(data);
      } else {
        setMessage(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      setMessage('Fehler: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>GeoJSON Transformer</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Restricted Zones (GeoJSON):
            <input
              type="file"
              accept=".geojson,.json"
              onChange={(e) => setRestrictedFile(e.target.files[0])}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Pedestrian Zones (GeoJSON):
            <input
              type="file"
              accept=".geojson,.json"
              onChange={(e) => setPedestrianFile(e.target.files[0])}
            />
          </label>
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Verarbeiten
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '20px', color: message.includes('Fehler') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Ergebnis:</h2>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflowX: 'auto' }}>
            {JSON.stringify(
              {
                restrictedZones: result.restrictedZones,
                pedestrianZones: result.pedestrianZones
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
