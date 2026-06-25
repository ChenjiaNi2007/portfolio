import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapLocation } from '../data/locations';
import styles from './DetailPanel.module.css';

// Fix leaflet default icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type TileMode = 'street' | 'satellite';

function MapView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 17);
  }, [map, lat, lng]);
  return null;
}

interface DetailPanelProps {
  location: MapLocation | null;
  onClose: () => void;
}

export default function DetailPanel({ location, onClose }: DetailPanelProps) {
  const [tileMode, setTileMode] = useState<TileMode>('satellite');
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location) {
      setOpen(true);
      setGalleryIdx(0);
    } else {
      setOpen(false);
    }
  }, [location]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!location) return null;

  const { lat, lng } = location.coordinates;
  const images = location.type === 'project' ? location.images : location.photos.map((p) => p.src);
  const isProject = location.type === 'project';

  const streetUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satUrl =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  return (
    <div className={`${styles.panel} ${open ? styles.open : ''}`}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Return to orbit">
        ✕
      </button>

      <div className={styles.scrollArea}>
        {/* Header */}
        <div className={`${styles.typeTag} ${isProject ? styles.projectTag : styles.photoTag}`}>
          {isProject ? '⬡ Project' : '📷 Photo'}
        </div>
        <h2 className={styles.title}>{location.title}</h2>
        <div className={styles.city}>{location.city}</div>

        {/* Gallery */}
        {images.length > 0 && (
          <div className={styles.gallery}>
            <img
              src={images[galleryIdx]}
              alt={`${location.title} ${galleryIdx + 1}`}
              className={styles.galleryImg}
            />
            {images.length > 1 && (
              <div className={styles.galleryNav}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.galleryDot} ${i === galleryIdx ? styles.activeDot : ''}`}
                    onClick={() => setGalleryIdx(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video */}
        {location.type === 'project' && location.video && (
          <video className={styles.video} src={location.video} controls playsInline preload="metadata" />
        )}

        {/* Content */}
        {isProject && location.type === 'project' && (
          <>
            <p className={styles.description}>{location.description}</p>
            <div className={styles.techList}>
              {location.tech.map((t) => (
                <span key={t} className={styles.techTag}>{t}</span>
              ))}
            </div>
            <div className={styles.links}>
              {location.links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className={styles.externalLink}>
                  {l.label} ↗
                </a>
              ))}
              {location.pdf && (
                <a href={location.pdf} target="_blank" rel="noreferrer" className={styles.externalLink}>
                  Open PDF ↗
                </a>
              )}
            </div>
            {location.pdf && (
              <div className={styles.pdfWrap}>
                <iframe className={styles.pdfFrame} src={`${location.pdf}#view=FitH`} title={`${location.title} document`} />
              </div>
            )}
          </>
        )}

        {!isProject && location.type === 'photo' && (
          <>
            {location.date && <div className={styles.date}>{location.date}</div>}
            <p className={styles.description}>{location.caption}</p>
          </>
        )}

        {/* Leaflet map */}
        <div className={styles.mapSection}>
          <div className={styles.mapHeader}>
            <span className={styles.mapLabel}>📍 Location</span>
            <div className={styles.tileToggle}>
              <button
                className={`${styles.tileBtn} ${tileMode === 'street' ? styles.activeTile : ''}`}
                onClick={() => setTileMode('street')}
              >
                Street
              </button>
              <button
                className={`${styles.tileBtn} ${tileMode === 'satellite' ? styles.activeTile : ''}`}
                onClick={() => setTileMode('satellite')}
              >
                Satellite
              </button>
            </div>
          </div>
          <div className={styles.mapWrap}>
            <MapContainer
              center={[lat, lng]}
              zoom={17}
              className={styles.leafletMap}
              zoomControl={false}
            >
              <TileLayer
                key={tileMode}
                url={tileMode === 'street' ? streetUrl : satUrl}
                attribution={
                  tileMode === 'street'
                    ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    : '© Esri'
                }
                maxZoom={19}
              />
              <Marker position={[lat, lng]} />
              <MapView lat={lat} lng={lng} />
            </MapContainer>
          </div>
        </div>

        {/* Return to orbit button */}
        <button className={styles.takeoffBtn} onClick={onClose}>
          🛰 Return to orbit
        </button>
      </div>
    </div>
  );
}
