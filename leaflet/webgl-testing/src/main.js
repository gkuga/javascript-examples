import L from 'leaflet';
import { webglLayer } from './WebGLLayer.js';

var map = L.map('map', {
	crs: L.CRS.Simple,
	attributionControl: false,
	minZoom: -2,
	maxZoom: 2,
	zoomSnap: 0.5
});

const bounds = [[0, 0], [100, 100]];
L.imageOverlay('assets/bg.webp', bounds).addTo(map);
map.fitBounds(bounds);

// WebGLレイヤーを追加
const webglLayerInstance = webglLayer().addTo(map);

console.log(map.getSize());

map.on('click', function(e) {
	L.marker(e.latlng).addTo(map)
		.bindPopup(`座標: ${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`)
		.openPopup();
});

