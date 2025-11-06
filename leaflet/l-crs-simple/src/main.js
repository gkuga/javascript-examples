import L from 'leaflet';
import * as turf from '@turf/turf';

var map = L.map('map', {
	crs: L.CRS.Simple,
	attributionControl: false,
	minZoom: -2,
	maxZoom: 2,
	zoomSnap: 0.5
});
const bounds = [[0, 0], [100, 100]];
const backgroundLayer = L.imageOverlay('assets/bg.webp', bounds).addTo(map);
map.fitBounds(bounds);
console.log(map.getSize());

// const mask = [
//   [
//     [0, 0], [600, 0], [600, 400], [0, 400], [0, 0]
//   ],
// ];

// tempMap.setMask(mask, { isLatLng: false });


// 新しいレイヤーグループを作成
const redRectangleLayer = L.layerGroup().addTo(map);

// 赤い四角形を描画（座標をマップの表示範囲内に調整）
const redRectangle = L.rectangle([[10, 10], [30, 40]], {
	color: 'red',
	fillColor: 'red',
	fillOpacity: 0.5,
	weight: 2
}).addTo(redRectangleLayer);

// より目立つテスト用の四角形も追加
const testRectangle = L.rectangle([[50, 50], [80, 80]], {
	color: 'blue',
	fillColor: 'blue',
	fillOpacity: 0.7,
	weight: 3
}).addTo(map);

// 四角形にポップアップを追加
redRectangle.bindPopup('赤い四角形');
testRectangle.bindPopup('テスト用青い四角形');

// Canvas合成を使ったマスク機能（Turf.js対応）
let isMaskApplied = false;
let compositeLayer = null;

// 複雑なマスク領域をTurf.jsで定義
const maskArea = [[20, 20], [70, 70]]; // シンプルな四角形（後方互換性のため）

// Turf.jsを使った複雑なマスク領域の例（座標は[lng, lat]形式）
const complexMaskPolygon = turf.polygon([[
  [30, 30], [20, 60], [40, 80], [70, 70], [80, 40], [60, 20], [30, 30]
]]);

const circleMask = turf.circle([50, 50], 15, {units: 'meters'}); // 半径15の円

// 複数のポリゴンを組み合わせたマスク（修正版）
const polygon1 = turf.polygon([[[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]]]);
const polygon2 = turf.polygon([[[60, 60], [80, 60], [80, 80], [60, 80], [60, 60]]]);

// FeatureCollectionとして複数ポリゴンを管理
const multiPolygonMask = turf.featureCollection([polygon1, polygon2]);

// 現在使用中のマスク（デフォルトは円形）
let currentMask = circleMask;
let maskType = 'circle'; // 'rectangle', 'polygon', 'circle', 'multi'

// 描画レイヤーを非表示にする
function hideDrawingLayers() {
  map.removeLayer(redRectangleLayer);
  map.removeLayer(testRectangle);
}

// 描画レイヤーを表示する
function showDrawingLayers() {
  map.addLayer(redRectangleLayer);
  map.addLayer(testRectangle);
}

// Canvas上に四角形を描画する関数
function drawRectangleOnCanvas(canvas, ctx, bounds, style, mapBounds) {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  // 座標を正規化（0-1の範囲）
  const normalizedBounds = [
    [(bounds[0][0] - mapBounds[0][0]) / (mapBounds[1][0] - mapBounds[0][0]),
     (bounds[0][1] - mapBounds[0][1]) / (mapBounds[1][1] - mapBounds[0][1])],
    [(bounds[1][0] - mapBounds[0][0]) / (mapBounds[1][0] - mapBounds[0][0]),
     (bounds[1][1] - mapBounds[0][1]) / (mapBounds[1][1] - mapBounds[0][1])]
  ];
  
  // Canvas座標に変換
  const x = normalizedBounds[0][1] * canvasWidth;
  const y = (1 - normalizedBounds[1][0]) * canvasHeight; // Y軸は反転
  const width = (normalizedBounds[1][1] - normalizedBounds[0][1]) * canvasWidth;
  const height = (normalizedBounds[1][0] - normalizedBounds[0][0]) * canvasHeight;
  
  // 四角形を描画
  ctx.fillStyle = style.fillColor;
  ctx.globalAlpha = style.fillOpacity;
  ctx.fillRect(x, y, width, height);
  
  if (style.weight > 0) {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.weight;
    ctx.globalAlpha = 1;
    ctx.strokeRect(x, y, width, height);
  }
}

// 点がマスク領域内にあるかをTurf.jsで判定
function isPointInMask(point, mask) {
  const turfPoint = turf.point([point[1], point[0]]); // [lng, lat]形式に変換
  
  // FeatureCollectionの場合（複数ポリゴン）
  if (mask.type === 'FeatureCollection') {
    return mask.features.some(feature => {
      return turf.booleanPointInPolygon(turfPoint, feature);
    });
  }
  
  // 単一のFeatureまたはGeometryの場合
  return turf.booleanPointInPolygon(turfPoint, mask);
}

// Canvas上にTurf.jsマスクを適用
function applyTurfMask(canvas, ctx, mask) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const mapBounds = [[0, 0], [100, 100]];
  
  // 各ピクセルをチェックしてマスク外のピクセルを透明にする
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      // Canvas座標をマップ座標に変換
      const mapX = (x / canvas.width) * (mapBounds[1][0] - mapBounds[0][0]) + mapBounds[0][0];
      const mapY = ((canvas.height - y) / canvas.height) * (mapBounds[1][1] - mapBounds[0][1]) + mapBounds[0][1];
      
      // マスク領域外の場合は透明にする
      if (!isPointInMask([mapX, mapY], mask)) {
        const index = (y * canvas.width + x) * 4;
        data[index + 3] = 0; // アルファ値を0に設定（透明）
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// マスクを適用したCanvas画像を作成（Turf.js対応）
function createMaskedCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const mapBounds = [[0, 0], [100, 100]];
  
  // 1. 描画レイヤーを描画
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 赤い四角形を描画
  drawRectangleOnCanvas(canvas, ctx, [[10, 10], [30, 40]], {
    fillColor: 'red',
    fillOpacity: 0.5,
    color: 'red',
    weight: 2
  }, mapBounds);
  
  // 青い四角形を描画
  ctx.globalAlpha = 1;
  drawRectangleOnCanvas(canvas, ctx, [[50, 50], [80, 80]], {
    fillColor: 'blue',
    fillOpacity: 0.7,
    color: 'blue',
    weight: 3
  }, mapBounds);
  
  // 2. Turf.jsマスクを適用
  if (maskType === 'rectangle') {
    // 従来の四角形マスク
    ctx.globalCompositeOperation = 'destination-in';
    const maskBounds = [
      [(maskArea[0][0] - mapBounds[0][0]) / (mapBounds[1][0] - mapBounds[0][0]),
       (maskArea[0][1] - mapBounds[0][1]) / (mapBounds[1][1] - mapBounds[0][1])],
      [(maskArea[1][0] - mapBounds[0][0]) / (mapBounds[1][0] - mapBounds[0][0]),
       (maskArea[1][1] - mapBounds[0][1]) / (mapBounds[1][1] - mapBounds[0][1])]
    ];
    
    const maskX = maskBounds[0][1] * canvas.width;
    const maskY = (1 - maskBounds[1][0]) * canvas.height;
    const maskWidth = (maskBounds[1][1] - maskBounds[0][1]) * canvas.width;
    const maskHeight = (maskBounds[1][0] - maskBounds[0][0]) * canvas.height;
    
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 1;
    ctx.fillRect(maskX, maskY, maskWidth, maskHeight);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    // Turf.jsマスクを適用
    applyTurfMask(canvas, ctx, currentMask);
  }
  
  return canvas;
}

// Canvas画像をLeafletレイヤーとして表示
function showCompositeLayer() {
  if (compositeLayer) {
    map.removeLayer(compositeLayer);
  }
  
  const canvas = createMaskedCanvas();
  const imageData = canvas.toDataURL();
  
  compositeLayer = L.imageOverlay(imageData, bounds, {
    opacity: 1,
    interactive: false
  }).addTo(map);
}

// マスクタイプを切り替える関数
function switchMaskType(type) {
  try {
    maskType = type;
    switch(type) {
      case 'rectangle':
        // 従来の四角形マスク
        console.log('四角形マスクに切り替えました');
        break;
      case 'circle':
        currentMask = circleMask;
        console.log('円形マスクに切り替えました', circleMask);
        break;
      case 'polygon':
        currentMask = complexMaskPolygon;
        console.log('複雑なポリゴンマスクに切り替えました', complexMaskPolygon);
        break;
      case 'multi':
        currentMask = multiPolygonMask;
        console.log('複数ポリゴンマスクに切り替えました', multiPolygonMask);
        break;
    }
    
    // マスクが適用されている場合は再描画
    if (isMaskApplied) {
      showCompositeLayer();
    }
    
    console.log(`マスクタイプを${type}に変更しました`);
  } catch (error) {
    console.error(`マスクタイプ${type}への切り替えでエラーが発生しました:`, error);
  }
}

// マスクの表示/非表示を切り替える関数
function toggleLayerMask() {
  if (isMaskApplied) {
    // 合成レイヤーを削除し、元の描画レイヤーを表示
    if (compositeLayer) {
      map.removeLayer(compositeLayer);
      compositeLayer = null;
    }
    showDrawingLayers();
    isMaskApplied = false;
    console.log('レイヤーマスクを無効化');
  } else {
    // 元の描画レイヤーを非表示にし、合成レイヤーを表示
    hideDrawingLayers();
    showCompositeLayer();
    isMaskApplied = true;
    console.log('レイヤーマスクを適用');
  }
}

// Mキーでレイヤーマスクの表示/非表示を切り替え
// 数字キー1-4でマスクタイプを切り替え
// 1: 四角形マスク（従来）
// 2: 円形マスク（Turf.js）
// 3: 複雑なポリゴンマスク（Turf.js）
// 4: 複数ポリゴンマスク（Turf.js）
document.addEventListener('keydown', function(e) {
  if (e.key === 'm' || e.key === 'M') {
    toggleLayerMask();
  } else if (e.key >= '1' && e.key <= '4') {
    const types = ['rectangle', 'circle', 'polygon', 'multi'];
    switchMaskType(types[parseInt(e.key) - 1]);
  }
});

map.on('click', function(e) {
	L.marker(e.latlng).addTo(map)
		.bindPopup(`座標: ${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`)
		.openPopup();
});

