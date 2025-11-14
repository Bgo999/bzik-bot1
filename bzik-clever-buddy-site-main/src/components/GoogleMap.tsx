import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const GoogleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgaN2-2pLcI&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMap = () => {
        if (mapRef.current && window.google) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 40.1776, lng: 44.5126 }, // Yerevan, Armenia coordinates
            zoom: 12,
            styles: [
              {
                featureType: 'all',
                elementType: 'geometry',
                stylers: [{ color: '#1a1a2e' }]
              },
              {
                featureType: 'all',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#0e1626' }]
              },
              {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#e0e7ff' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0e1626' }]
              },
              {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{ color: '#2a2a4e' }]
              }
            ]
          });

          // Add marker for Yerevan
          const marker = new window.google.maps.Marker({
            position: { lat: 40.1776, lng: 44.5126 },
            map: map,
            title: 'Bzik AI - Yerevan, Armenia',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#0e1626" stroke="#0ea5e9" stroke-width="2"/>
                  <circle cx="20" cy="20" r="8" fill="#0ea5e9"/>
                  <circle cx="20" cy="20" r="3" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(40, 40)
            }
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="color: #1a1a2e; font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #0ea5e9;">Bzik AI Labs</h3>
                <p style="margin: 0; font-size: 14px;">BOT AI Armenia Smart Bot Headquarters</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Yerevan, Armenia</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      };
    } else {
      window.initMap();
    }
  }, []);

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-primary/20">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};
