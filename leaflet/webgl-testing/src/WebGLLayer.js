import L from 'leaflet';
import { vertexShaderSource, fragmentShaderSource } from './shaders.js';

// WebGLレイヤークラスを定義
export const WebGLLayer = L.Layer.extend({
	initialize: function (options) {
		L.setOptions(this, options);
		this._canvas = null;
		this._gl = null;
		this._program = null;
		this._time = 0;
		this._animationId = null;
	},

	onAdd: function (map) {
		this._map = map;
		this._createCanvas();
		this._initWebGL();
		this._createShaderProgram();
		
		// 初期サイズを設定してから頂点データを作成
		this._reset();
		this._startAnimation();
		
		map.on('viewreset', this._reset, this);
		map.on('zoom', this._reset, this);
		map.on('move', this._reset, this);
	},

	onRemove: function (map) {
		if (this._animationId) {
			cancelAnimationFrame(this._animationId);
		}
		map.off('viewreset', this._reset, this);
		map.off('zoom', this._reset, this);
		map.off('move', this._reset, this);
		
		if (this._canvas && this._canvas.parentNode) {
			this._canvas.parentNode.removeChild(this._canvas);
		}
	},

	_createCanvas: function () {
		this._canvas = L.DomUtil.create('canvas', 'leaflet-webgl-layer');
		this._canvas.style.pointerEvents = 'none';
		this._canvas.style.position = 'absolute';
		this._canvas.style.zIndex = 200;
		
		this._map.getPanes().overlayPane.appendChild(this._canvas);
	},

	_initWebGL: function () {
		this._gl = this._canvas.getContext('webgl') || this._canvas.getContext('experimental-webgl');
		
		if (!this._gl) {
			console.error('WebGLが利用できません');
			return;
		}

		this._gl.enable(this._gl.BLEND);
		this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
	},

	_createShaderProgram: function () {
		const vertexShader = this._createShader(this._gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = this._createShader(this._gl.FRAGMENT_SHADER, fragmentShaderSource);

		if (!vertexShader || !fragmentShader) {
			console.error('シェーダーの作成に失敗しました');
			return;
		}

		this._program = this._gl.createProgram();
		this._gl.attachShader(this._program, vertexShader);
		this._gl.attachShader(this._program, fragmentShader);
		this._gl.linkProgram(this._program);

		if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS)) {
			console.error('シェーダープログラムの初期化に失敗:', this._gl.getProgramInfoLog(this._program));
			this._gl.deleteProgram(this._program);
			this._program = null;
			return;
		}

		// uniform locationを取得
		this._locations = {
			position: this._gl.getAttribLocation(this._program, 'a_position'),
			resolution: this._gl.getUniformLocation(this._program, 'u_resolution'),
			time: this._gl.getUniformLocation(this._program, 'u_time')
		};

		// デバッグ用
		console.log('WebGLプログラムが正常に初期化されました');
		console.log('Attribute locations:', this._locations);

		// 頂点バッファを作成（画面全体を覆う四角形）
		this._positionBuffer = this._gl.createBuffer();
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._positionBuffer);
	},

	_createShader: function (type, source) {
		const shader = this._gl.createShader(type);
		this._gl.shaderSource(shader, source);
		this._gl.compileShader(shader);

		if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
			console.error('シェーダーのコンパイルエラー:', this._gl.getShaderInfoLog(shader));
			this._gl.deleteShader(shader);
			return null;
		}

		return shader;
	},

	_reset: function () {
		if (!this._canvas || !this._gl || !this._positionBuffer) return;

		const size = this._map.getSize();
		const topLeft = this._map.containerPointToLayerPoint([0, 0]);

		L.DomUtil.setPosition(this._canvas, topLeft);
		
		this._canvas.width = size.x;
		this._canvas.height = size.y;
		this._canvas.style.width = size.x + 'px';
		this._canvas.style.height = size.y + 'px';

		this._gl.viewport(0, 0, size.x, size.y);
		
		// 頂点データを更新（画面全体を覆う2つの三角形）
		const positions = new Float32Array([
			0, 0,
			size.x, 0,
			0, size.y,
			0, size.y,
			size.x, 0,
			size.x, size.y
		]);
		
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._positionBuffer);
		this._gl.bufferData(this._gl.ARRAY_BUFFER, positions, this._gl.STATIC_DRAW);
		
		console.log('Buffer updated with size:', size.x, 'x', size.y, 'vertices:', positions.length / 2);
		console.log('🔥 WebGL layer updated!'); // テスト用ログ
	},

	_render: function () {
		if (!this._gl || !this._program || !this._locations || !this._positionBuffer) {
			console.warn('WebGLが初期化されていません');
			return;
		}

		this._time += 0.016; // 約60FPS

		this._gl.clearColor(0, 0, 0, 0);
		this._gl.clear(this._gl.COLOR_BUFFER_BIT);

		this._gl.useProgram(this._program);

		// 頂点属性を設定
		if (this._locations.position >= 0) {
			this._gl.enableVertexAttribArray(this._locations.position);
			this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._positionBuffer);
			this._gl.vertexAttribPointer(this._locations.position, 2, this._gl.FLOAT, false, 0, 0);
		}

		// uniformを設定
		if (this._locations.resolution) {
			this._gl.uniform2f(this._locations.resolution, this._canvas.width, this._canvas.height);
		}
		if (this._locations.time) {
			this._gl.uniform1f(this._locations.time, this._time);
		}

		// 描画（6つの頂点で2つの三角形）
		this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
	},

	_startAnimation: function () {
		const animate = () => {
			this._render();
			this._animationId = requestAnimationFrame(animate);
		};
		animate();
	}
});

// ファクトリー関数も一緒にエクスポート
export const webglLayer = function (options) {
	return new WebGLLayer(options);
};

// Leafletのグローバル名前空間にも追加（互換性のため）
L.WebGLLayer = WebGLLayer;
L.webglLayer = webglLayer;