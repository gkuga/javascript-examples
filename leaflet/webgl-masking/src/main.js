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

const maskArea1 = [[20, 20], [40, 40]];
const maskArea2 = [[60, 60], [90, 90]];

const maskCanvas = document.createElement('canvas');
maskCanvas.width = canvas.width;
maskCanvas.height = canvas.height;
const maskCtx = maskCanvas.getContext('2d');

maskCtx.fillStyle = 'white';

const maskBounds1 = [
  [(maskArea1[0][0] - bounds[0][0]) / (bounds[1][0] - bounds[0][0]),
    (maskArea1[0][1] - bounds[0][1]) / (bounds[1][1] - bounds[0][1])],
  [(maskArea1[1][0] - bounds[0][0]) / (bounds[1][0] - bounds[0][0]),
    (maskArea1[1][1] - bounds[0][1]) / (bounds[1][1] - bounds[0][1])]
];
const maskX1 = maskBounds1[0][1] * canvas.width;
const maskY1 = (1 - maskBounds1[1][0]) * canvas.height;
const maskWidth1 = (maskBounds1[1][1] - maskBounds1[0][1]) * canvas.width;
const maskHeight1 = (maskBounds1[1][0] - maskBounds1[0][0]) * canvas.height;
maskCtx.fillRect(maskX1, maskY1, maskWidth1, maskHeight1);

const maskBounds2 = [
  [(maskArea2[0][0] - bounds[0][0]) / (bounds[1][0] - bounds[0][0]),
    (maskArea2[0][1] - bounds[0][1]) / (bounds[1][1] - bounds[0][1])],
  [(maskArea2[1][0] - bounds[0][0]) / (bounds[1][0] - bounds[0][0]),
    (maskArea2[1][1] - bounds[0][1]) / (bounds[1][1] - bounds[0][1])]
];
const maskX2 = maskBounds2[0][1] * canvas.width;
const maskY2 = (1 - maskBounds2[1][0]) * canvas.height;
const maskWidth2 = (maskBounds2[1][1] - maskBounds2[0][1]) * canvas.width;
const maskHeight2 = (maskBounds2[1][0] - maskBounds2[0][0]) * canvas.height;
maskCtx.fillRect(maskX2, maskY2, maskWidth2, maskHeight2);

ctx.globalCompositeOperation = 'destination-in';
ctx.drawImage(maskCanvas, 0, 0);
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

