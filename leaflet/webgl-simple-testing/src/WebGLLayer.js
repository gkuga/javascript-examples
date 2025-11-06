import L from 'leaflet';

// 最小限のWebGLレイヤー
export const WebGLLayer = L.Layer.extend({
	initialize: function (options) {
		this._canvas = null;
		this._gl = null;
	},

	onAdd: function (map) {
		this._map = map;
		this._createCanvas();
		this._initWebGL();
		this._draw();
	},

	onRemove: function (map) {
		if (this._canvas && this._canvas.parentNode) {
			this._canvas.parentNode.removeChild(this._canvas);
		}
	},

	_createCanvas: function () {
		this._canvas = L.DomUtil.create('canvas');
		this._canvas.style.position = 'absolute';
		this._canvas.style.pointerEvents = 'none';
		this._map.getPanes().overlayPane.appendChild(this._canvas);
		this._updateSize();
	},

	_initWebGL: function () {
		this._gl = this._canvas.getContext('webgl');
		if (!this._gl) {
			console.error('WebGL not supported');
			return;
		}
	},

	_updateSize: function () {
		const size = this._map.getSize();
		this._canvas.width = size.x;
		this._canvas.height = size.y;
		this._canvas.style.width = size.x + 'px';
		this._canvas.style.height = size.y + 'px';
		
		if (this._gl) {
			this._gl.viewport(0, 0, size.x, size.y);
		}
	},

	_draw: function () {
		if (!this._gl) return;
		
		// 画面を赤色でクリア
		this._gl.clearColor(1.0, 0.0, 0.0, 0.5);  // 赤色、半透明
		this._gl.clear(this._gl.COLOR_BUFFER_BIT);
		
		console.log('WebGL drawing complete!');
	}
});

export const webglLayer = function (options) {
	return new WebGLLayer(options);
};

L.WebGLLayer = WebGLLayer;
L.webglLayer = webglLayer;