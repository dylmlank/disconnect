import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  color?: string;
}

interface Props {
  latitude: number;
  longitude: number;
  pins: MapPin[];
  onPinPress?: (pin: MapPin) => void;
  style?: any;
}

// Web-only Leaflet map component
export default function WebMap({ latitude, longitude, pins, onPinPress, style }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current) return;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).L) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      // Create map if not exists
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView([latitude, longitude], 13);

        // Dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(mapInstance.current);
      } else {
        mapInstance.current.setView([latitude, longitude], 13);
      }

      // Clear old markers
      markersRef.current.forEach((m: any) => m.remove());
      markersRef.current = [];

      // Add pins
      pins.forEach((pin) => {
        const color = pin.color || '#4ade80';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([pin.latitude, pin.longitude], { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${pin.title}</b>${pin.subtitle ? `<br/>${pin.subtitle}` : ''}`);

        if (onPinPress) {
          marker.on('click', () => onPinPress(pin));
        }

        markersRef.current.push(marker);
      });

      // Add user location marker
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:#60a5fa;border-radius:50%;border:3px solid #fff;box-shadow:0 0 10px rgba(96,165,250,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstance.current);
      markersRef.current.push(userMarker);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [latitude, longitude, pins.length]);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={[styles.container, style]}>
      <div
        ref={mapRef as any}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },
});
