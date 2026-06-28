export function MapView({ latitude, longitude, label, height = 300 }: { latitude: number; longitude: number; label?: string; height?: number }) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  const href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div>
      <iframe
        title={label || 'Map'}
        src={src}
        style={{ width: '100%', height, border: 0 }}
        allowFullScreen
        loading="lazy"
      />
      {label && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
          {label}
        </a>
      )}
    </div>
  );
}
