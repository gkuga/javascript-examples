import L from 'leaflet';
import 'leaflet.webgl-temperature-map';

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
console.log(map.getSize());

const tempMap = L.webGlTemperatureMapLayer().addTo(map);
tempMap.setPoints([
	[0, 0, 0],
	[100, 100, 50],
	[200, 200, 50],
	[30, 30, 30],
	[40, 40, 40],
	[50, 50, 50],
]);

const mask = [
  [
    [0, 0], [600, 0], [600, 400], [0, 400], [0, 0]
  ],
];

tempMap.setMask(mask, { isLatLng: false });


map.on('click', function(e) {
	L.marker(e.latlng).addTo(map)
		.bindPopup(`座標: ${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`)
		.openPopup();
});

