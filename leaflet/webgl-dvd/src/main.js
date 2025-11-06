import L from 'leaflet';
import { webglLayer } from './WebGLLayer.js';

const map = L.map('map').setView([0, 0], 2);

webglLayer().addTo(map);

console.log('Simple WebGL layer added!');

