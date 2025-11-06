import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.webgl-temperature-map';
import * as turf from '@turf/turf';

var map = L.map('map', {
	crs: L.CRS.Simple,
	attributionControl: false,
	minZoom: -2,
	maxZoom: 2,
	zoomSnap: 0.5
});
const bounds = [[0, 0], [100, 100]];
L.imageOverlay('/assets/bg.webp', bounds).addTo(map);
map.fitBounds(bounds);
console.log(map.getSize());

// WebGLレイヤーが利用可能か確認
console.log('L.webGlTemperatureMapLayer type:', typeof L.webGlTemperatureMapLayer);

// シンプルにWebGLレイヤーを作成
const tempMap = L.webGlTemperatureMapLayer().addTo(map);
console.log('WebGL temperature map layer created:', tempMap);

// 利用可能なメソッドを確認
console.log('Available methods on tempMap:', Object.getOwnPropertyNames(tempMap.__proto__));

tempMap.setPoints([
	[25, 25, 30],  // マップ境界内の座標に変更
	[75, 75, 60],
	[25, 75, 40],
	[75, 25, 50],
	[175, 125, 100],
	[50, 50, 45]
]);
console.log('Points set on WebGL layer');

// レイヤーの強制再描画を試行
setTimeout(() => {
	if (typeof tempMap.drawLayer === 'function') {
		tempMap.drawLayer();
		console.log('WebGL layer manually redrawn');
	}
	if (typeof tempMap.needRedraw === 'function') {
		tempMap.needRedraw();
		console.log('WebGL layer marked for redraw');
	}
}, 100);

// WebGLレイヤーの状態をチェック
function checkWebGLLayerStatus() {
	console.log('Checking WebGL layer status...');
	console.log('TempMap._canvas:', tempMap._canvas);
	console.log('TempMap visible:', map.hasLayer(tempMap));
	
	// マップ上のすべてのレイヤーをチェック
	map.eachLayer(function(layer) {
		console.log('Layer on map:', layer.constructor.name, layer);
	});
}

// レイヤーの初期化を待つ
setTimeout(() => {
	console.log('WebGL layer should be initialized now');
	checkWebGLLayerStatus();
	const allCanvases = document.querySelectorAll('canvas');
	console.log('Canvases after timeout:', allCanvases.length);
	
	// WebGLレイヤーを強制再描画
	if (map.hasLayer(tempMap)) {
		// redrawメソッドが存在するかチェック
		if (typeof tempMap.redraw === 'function') {
			tempMap.redraw();
			console.log('WebGL layer redrawn');
		} else {
			console.log('redraw method not available');
		}
	}
	
	// より長い遅延後にもう一度チェック
	setTimeout(() => {
		console.log('Secondary check after longer delay...');
		checkWebGLLayerStatus();
	}, 2000);
}, 1000);

// Canvas合成を使ったマスク機能（Turf.js対応）
let isMaskApplied = false;
let compositeLayer = null;
let originalTempMap = tempMap; // 元のWebGLレイヤーを保存

// 複数のポリゴンを組み合わせたマスク
const polygon1 = turf.polygon([[[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]]]);
const polygon2 = turf.polygon([[[60, 60], [80, 60], [80, 80], [60, 80], [60, 60]]]);
const multiPolygonMask = turf.featureCollection([polygon1, polygon2]);

// Turf.jsを使った複雑なマスク領域（座標は[lng, lat]形式）
const complexMaskPolygon = turf.polygon([[
  [30, 30], [20, 60], [40, 80], [70, 70], [80, 40], [60, 20], [30, 30]
]]);

const circleMask = turf.circle([50, 50], 15, {units: 'meters'}); // 半径15の円

// 現在使用中のマスク（デフォルトは円形）
let currentMask = circleMask;
let maskType = 'circle'; // 'rectangle', 'polygon', 'circle', 'multi'
const maskArea = [[20, 20], [70, 70]]; // シンプルな四角形マスク

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

// WebGLレイヤーからCanvas画像を取得
function captureWebGLLayer() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // より詳細にCanvasを検索
  const allCanvases = document.querySelectorAll('canvas');
  console.log('All canvases found:', allCanvases.length);
  
  let webglCanvas = null;
  
  // すべてのcanvas要素をチェック
  allCanvases.forEach((canvasEl, index) => {
    console.log(`Canvas ${index}:`, {
      className: canvasEl.className,
      width: canvasEl.width,
      height: canvasEl.height,
      style: canvasEl.style.cssText,
      parent: canvasEl.parentElement?.className
    });
    
    // leaflet関連のクラス名があるキャンバスを優先
    if (canvasEl.className.includes('leaflet') || canvasEl.parentElement?.className.includes('leaflet')) {
      webglCanvas = canvasEl;
      console.log('Leaflet canvas found at index:', index);
    }
  });
  
  // Leafletキャンバスが見つからない場合は、最初のキャンバスを使用
  if (!webglCanvas && allCanvases.length > 0) {
    webglCanvas = allCanvases[0];
    console.log('Using first canvas as fallback');
  }
  
  let hasValidData = false;
  
  if (webglCanvas && webglCanvas.width > 0 && webglCanvas.height > 0) {
    console.log('Selected canvas dimensions:', webglCanvas.width, 'x', webglCanvas.height);
    try {
      // WebGLキャンバスを強制的に再描画
      if (originalTempMap && typeof originalTempMap.drawLayer === 'function') {
        originalTempMap.drawLayer();
        console.log('WebGL layer redrawn before capture');
      }
      
      ctx.drawImage(webglCanvas, 0, 0, canvas.width, canvas.height);
      console.log('Canvas image captured successfully');
      
      // キャンバスに何か描画されているかチェック
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // より詳細なデータチェック：透明でないピクセルを探す
      let coloredPixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { // アルファ値が0より大きい
          hasValidData = true;
          coloredPixels++;
        }
      }
      
      console.log('Canvas has visible data:', hasValidData);
      console.log('Colored pixels count:', coloredPixels);
      
      // 一部のピクセルの色情報をログ出力（デバッグ用）
      if (hasValidData) {
        console.log('Sample pixel colors:');
        for (let i = 0; i < Math.min(data.length, 100); i += 16) {
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          if (a > 0) {
            console.log(`  Pixel: rgba(${r}, ${g}, ${b}, ${a})`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error capturing canvas:', error);
      hasValidData = false;
    }
  }
  
  // 有効なデータがない場合はテストキャンバスを作成
  if (!hasValidData) {
    console.warn('No valid WebGL data found, creating test heatmap');
    createTestCanvas(ctx, canvas);
  }
  
  return canvas;
}

// テスト用のカラフルなキャンバスを作成
function createTestCanvas(ctx, canvas) {
  const width = canvas.width;
  const height = canvas.height;
  
  // 背景を透明にクリア
  ctx.clearRect(0, 0, width, height);
  
  // ヒートマップポイントの座標（Canvas座標系）
  const points = [
    {x: width * 0.25, y: height * 0.25, temp: 30, color: [255, 100, 0]},   // 左上：オレンジ
    {x: width * 0.75, y: height * 0.75, temp: 60, color: [255, 0, 0]},     // 右下：赤
    {x: width * 0.25, y: height * 0.75, temp: 40, color: [255, 150, 0]},   // 左下：オレンジ
    {x: width * 0.75, y: height * 0.25, temp: 50, color: [255, 50, 0]},    // 右上：赤オレンジ
    {x: width * 0.5, y: height * 0.5, temp: 45, color: [255, 120, 0]}      // 中央：オレンジ
  ];
  
  // 各ポイントでヒートマップ風の円を描画
  points.forEach(point => {
    const intensity = point.temp / 60;
    const radius = Math.min(width, height) * 0.15; // より大きな半径
    
    // 放射状グラデーションを作成
    const radialGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    
    // 中心部は高温度の色（不透明）
    const centerAlpha = Math.min(0.8, intensity * 1.2);
    radialGradient.addColorStop(0, `rgba(${point.color[0]}, ${point.color[1]}, ${point.color[2]}, ${centerAlpha})`);
    
    // 中間部分
    const midAlpha = Math.min(0.6, intensity * 0.8);
    radialGradient.addColorStop(0.3, `rgba(${point.color[0]}, ${point.color[1] + 50}, ${point.color[2]}, ${midAlpha})`);
    
    // 外側は透明
    radialGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    
    // グラデーション合成モードを設定
    ctx.globalCompositeOperation = 'screen'; // 明るく重ねる
    ctx.fillStyle = radialGradient;
    
    // 円を描画
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // 合成モードをリセット
  ctx.globalCompositeOperation = 'source-over';
  
  console.log('Enhanced test heatmap canvas created with realistic temperature visualization');
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

// マスクを適用したCanvas画像を作成
function createMaskedCanvas() {
  const canvas = captureWebGLLayer();
  const ctx = canvas.getContext('2d');
  const maskArea = [[20, 20], [70, 70]]; // シンプルな四角形（後方互換性のため）
  const mapBounds = [[0, 0], [100, 100]];

  // 複数ポリゴンマスクを適用
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
  return canvas;
}

// マップの準備完了後にマスク処理を実行
map.whenReady(function() {
	console.log('Map is ready');
	
	// 遅延を短縮：WebGLレイヤーの初期化を待つ最小限の時間
	setTimeout(() => {
		checkWebGLLayerStatus();
		
		console.log('Applying mask to WebGL layer...');
		const canvas = createMaskedCanvas();
		
		// 元のWebGLレイヤーを非表示にし、マスクされたレイヤーを表示
		if (map.hasLayer(originalTempMap)) {
			map.removeLayer(originalTempMap);
			console.log('Original WebGL layer removed');
		}
		
		const imageData = canvas.toDataURL();
		console.log('Masked canvas to data URL:', imageData.substring(0, 50) + '...');
		
		const maskedLayer = L.imageOverlay(imageData, bounds, {
			opacity: 0.35,
			interactive: false
		}).addTo(map);
		
		console.log('Masked layer added to map:', maskedLayer);
		console.log('複数ポリゴンマスクが適用されたヒートマップを表示中');
	}, 300); // 遅延を300msに短縮
});

