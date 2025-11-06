import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.webgl-temperature-map';

const bounds = [[0, 0], [100, 100]];

const offscreenContainer = document.createElement('div');
offscreenContainer.style.position = 'absolute';
offscreenContainer.style.left = '-9999px';
offscreenContainer.style.width = '512px';
offscreenContainer.style.height = '512px';
document.body.appendChild(offscreenContainer);
const offscreenMap = L.map(offscreenContainer, {
	crs: L.CRS.Simple,
	attributionControl: false,
	minZoom: -2,
	maxZoom: 2,
	zoomSnap: 0.5
});
offscreenMap.fitBounds(bounds);
const tempMap = L.webGlTemperatureMapLayer().addTo(offscreenMap);
tempMap.setPoints([
	[25, 25, 30],
	[75, 75, 60],
	[25, 75, 40],
	[75, 25, 50],
	[175, 125, 100],
	[50, 50, 45]
])
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
tempMap.drawLayer();
ctx.drawImage(tempMap._canvas, 0, 0, canvas.width, canvas.height);
const maskArea = [[20, 20], [70, 70]];
ctx.globalCompositeOperation = 'destination-in';
const maskBounds = [
  [(maskArea[0][0] - bounds[0][0]) / (bounds[1][0] - bounds[0][0]),
    (maskArea[0][1] - bounds[0][1]) / (bounds[1][1] - bounds[0][1])],
  [(maskArea[1][0] - bounds[0][0]) / (bounds[1][0] - bounds[0][0]),
    (maskArea[1][1] - bounds[0][1]) / (bounds[1][1] - bounds[0][1])]
];
const maskX = maskBounds[0][1] * canvas.width;
const maskY = (1 - maskBounds[1][0]) * canvas.height;
const maskWidth = (maskBounds[1][1] - maskBounds[0][1]) * canvas.width;
const maskHeight = (maskBounds[1][0] - maskBounds[0][0]) * canvas.height;
ctx.fillRect(maskX, maskY, maskWidth, maskHeight);
const imageData = canvas.toDataURL();
var map = L.map('map', {
	crs: L.CRS.Simple,
	attributionControl: false,
	minZoom: -2,
	maxZoom: 2,
	zoomSnap: 0.5
});
map.fitBounds(bounds);
L.imageOverlay('/assets/bg.webp', bounds).addTo(map);
L.imageOverlay(imageData, bounds, {
  opacity: 0.35,
  interactive: false
}).addTo(map);