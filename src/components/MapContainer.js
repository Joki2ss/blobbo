import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { useTheme } from "../theme";
import { buildSetMarkersScript } from "./MarkersLayer";

function normalizeMarkers(markers) {
  const src = Array.isArray(markers) ? markers : [];
  return src
    .map((m) => {
      const lat = Number(m?.lat);
      const lng = Number(m?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: String(m?.id || ""),
        lat,
        lng,
        title: String(m?.title || ""),
        subtitle: String(m?.subtitle || ""),
      };
    })
    .filter(Boolean);
}

function computeCenter(markers) {
  if (!markers.length) return { lat: 0, lng: 0, zoom: 2 };
  const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
  const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
  return { lat, lng, zoom: markers.length === 1 ? 14 : 5 };
}

function leafletHtml({ initialCenter }) {
  const center = initialCenter || { lat: 0, lng: 0, zoom: 2 };
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #000; }
    #map { height: 100%; width: 100%; }
    .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function() {
      var map = L.map('map', { zoomControl: false, attributionControl: false });
      L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);
      var layer = L.layerGroup().addTo(map);
      var currentMarkers = [];

      function post(msg) {
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch (e) {}
      }

      window.setCenter = function(c) {
        if (!c) return;
        var z = typeof c.zoom === 'number' ? c.zoom : 12;
        map.setView([c.lat, c.lng], z);
      };

      window.setMarkers = function(markers) {
        layer.clearLayers();
        currentMarkers = Array.isArray(markers) ? markers : [];
        currentMarkers.forEach(function(m) {
          if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
          var marker = L.marker([m.lat, m.lng]).addTo(layer);
          marker.on('click', function() { post({ type: 'marker', id: m.id }); });
        });
      };

      window.setCenter(${JSON.stringify(center)});
    })();
  </script>
</body>
</html>`;
}

function googleHtml({ apiKey, initialCenter }) {
  const center = initialCenter || { lat: 0, lng: 0, zoom: 2 };
  const safeKey = String(apiKey || "").replace(/</g, "");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #000; }
    #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var map;
      var markerById = {};

      function post(msg) {
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch (e) {}
      }

      window.setCenter = function(c) {
        if (!map || !c) return;
        map.setCenter({ lat: c.lat, lng: c.lng });
        if (typeof c.zoom === 'number') map.setZoom(c.zoom);
      };

      window.setMarkers = function(markers) {
        Object.keys(markerById).forEach(function(k) {
          markerById[k].setMap(null);
          delete markerById[k];
        });

        (Array.isArray(markers) ? markers : []).forEach(function(m) {
          if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
          var marker = new google.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map: map });
          marker.addListener('click', function() { post({ type: 'marker', id: m.id }); });
          markerById[m.id] = marker;
        });
      };

      window.__initMap = function() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: ${center.lat}, lng: ${center.lng} },
          zoom: ${center.zoom},
          gestureHandling: 'greedy',
          disableDefaultUI: true,
        });
      };
    })();
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${safeKey}&callback=__initMap"></script>
</body>
</html>`;
}

export const MapContainer = React.memo(function MapContainer({ markers, useGoogleMaps, googleMapsApiKey, style, onMarkerPress }) {
  const theme = useTheme();
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);

  const normalized = useMemo(() => normalizeMarkers(markers), [markers]);
  const center = useMemo(() => computeCenter(normalized), [normalized]);

  const html = useMemo(() => {
    if (useGoogleMaps && googleMapsApiKey) {
      return googleHtml({ apiKey: googleMapsApiKey, initialCenter: center });
    }
    return leafletHtml({ initialCenter: center });
  }, [useGoogleMaps, googleMapsApiKey, center.lat, center.lng, center.zoom]);

  useEffect(() => {
    if (!ready) return;
    const js = buildSetMarkersScript(normalized);
    webRef.current?.injectJavaScript(js);
  }, [ready, normalized]);

  function handleMessage(ev) {
    try {
      const msg = JSON.parse(ev?.nativeEvent?.data || "{}");
      if (msg?.type === "marker") {
        const hit = normalized.find((m) => m.id === msg.id) || null;
        if (hit && onMarkerPress) onMarkerPress(hit);
      }
    } catch {
      // ignore
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.web}
        onLoadEnd={() => setReady(true)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scrollEnabled={false}
        mixedContentMode={Platform.OS === "android" ? "always" : "never"}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  web: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
