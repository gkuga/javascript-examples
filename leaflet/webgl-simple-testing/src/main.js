import L from 'leaflet';
import { webglLayer } from './WebGLLayer.js';

// 簡単なマップを作成
const map = L.map('map').setView([0, 0], 2);

// WebGLレイヤーを追加（画面が赤色に染まる）
webglLayer().addTo(map);

console.log('Simple WebGL layer added!');

