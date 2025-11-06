import L from 'leaflet';

// 最小限のWebGLレイヤー
export const WebGLLayer = L.Layer.extend({
	initialize: function (options) {
		this._canvas = null;
		this._gl = null;
		this._program = null;
		this._animationId = null;
		
		// DVDアニメーション用の状態
		this._dvdX = 50;
		this._dvdY = 50;
		this._dvdVelX = 2;
		this._dvdVelY = 1.5;
		this._dvdWidth = 120;
		this._dvdHeight = 40;
		this._color = [Math.random(), Math.random(), Math.random()];
	},

	onAdd: function (map) {
		this._map = map;
		this._createCanvas();
		this._initWebGL();
		this._createShaders();
		this._createTextTexture();
		
		// マップイベントのリスナーを追加
		this._map.on('resize', this._updateSize, this);
		this._map.on('zoom', this._updateSize, this);
		
		this._startAnimation();
	},

	onRemove: function (map) {
		if (this._animationId) {
			cancelAnimationFrame(this._animationId);
		}
		
		this._map.off('resize', this._updateSize, this);
		this._map.off('zoom', this._updateSize, this);
		
		if (this._canvas && this._canvas.parentNode) {
			this._canvas.parentNode.removeChild(this._canvas);
		}

		if (this._gl) {
			if (this._texture) {
				this._gl.deleteTexture(this._texture);
			}
			if (this._positionBuffer) {
				this._gl.deleteBuffer(this._positionBuffer);
			}
			if (this._texCoordBuffer) {
				this._gl.deleteBuffer(this._texCoordBuffer);
			}
			if (this._program) {
				this._gl.deleteProgram(this._program);
			}
			const ext = this._gl.getExtension('WEBGL_lose_context');
			if (ext) {
				ext.loseContext();
			}
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
		
		// WebGLの設定
		this._gl.enable(this._gl.BLEND);
		this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
	},

	_createShaders: function () {
		const gl = this._gl;
		
		// 頂点シェーダー
		const vertexShaderSource = `
			attribute vec2 a_position;
			attribute vec2 a_texCoord;
			uniform vec2 u_resolution;
			uniform vec2 u_translation;
			varying vec2 v_texCoord;
			
			void main() {
				vec2 position = a_position + u_translation;
				vec2 zeroToOne = position / u_resolution;
				vec2 zeroToTwo = zeroToOne * 2.0;
				vec2 clipSpace = zeroToTwo - 1.0;
				gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
				v_texCoord = a_texCoord;
			}
		`;
		
		// フラグメントシェーダー
		const fragmentShaderSource = `
			precision mediump float;
			uniform sampler2D u_texture;
			uniform vec3 u_color;
			varying vec2 v_texCoord;
			
			void main() {
				vec4 texColor = texture2D(u_texture, v_texCoord);
				gl_FragColor = vec4(u_color * texColor.rgb, texColor.a);
			}
		`;
		
		const vertexShader = this._createShader(gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = this._createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
		
		this._program = gl.createProgram();
		gl.attachShader(this._program, vertexShader);
		gl.attachShader(this._program, fragmentShader);
		gl.linkProgram(this._program);
		
		if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
			console.error('Program link error:', gl.getProgramInfoLog(this._program));
			return;
		}
		
		// 属性とユニフォームの場所を取得
		this._positionLocation = gl.getAttribLocation(this._program, 'a_position');
		this._texCoordLocation = gl.getAttribLocation(this._program, 'a_texCoord');
		this._resolutionLocation = gl.getUniformLocation(this._program, 'u_resolution');
		this._translationLocation = gl.getUniformLocation(this._program, 'u_translation');
		this._textureLocation = gl.getUniformLocation(this._program, 'u_texture');
		this._colorLocation = gl.getUniformLocation(this._program, 'u_color');
		
		// バッファを作成
		this._createBuffers();
	},

	_createShader: function (type, source) {
		const gl = this._gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Shader compile error:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		
		return shader;
	},

	_createBuffers: function () {
		const gl = this._gl;
		
		// 矩形の頂点データ
		const positions = [
			0, 0,
			this._dvdWidth, 0,
			0, this._dvdHeight,
			this._dvdWidth, 0,
			this._dvdWidth, this._dvdHeight,
			0, this._dvdHeight,
		];
		
		// テクスチャ座標
		const texCoords = [
			0, 0,
			1, 0,
			0, 1,
			1, 0,
			1, 1,
			0, 1,
		];
		
		// 位置バッファ
		this._positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		
		// テクスチャ座標バッファ
		this._texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	},

	_createTextTexture: function () {
		// Canvas要素を作成してテキストを描画
		const textCanvas = document.createElement('canvas');
		const ctx = textCanvas.getContext('2d');
		
		textCanvas.width = this._dvdWidth;
		textCanvas.height = this._dvdHeight;
		
		// テキストスタイル
		ctx.fillStyle = 'white';
		ctx.font = 'bold 24px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		
		// テキストを描画
		ctx.fillText('DVD', textCanvas.width / 2, textCanvas.height / 2);
		
		// WebGLテクスチャを作成
		const gl = this._gl;
		this._texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	},

	_startAnimation: function () {
		const animate = () => {
			this._updateDVDPosition();
			this._draw();
			this._animationId = requestAnimationFrame(animate);
		};
		animate();
	},

	_updateDVDPosition: function () {
		const size = this._map.getSize();
		
		// 位置を更新
		this._dvdX += this._dvdVelX;
		this._dvdY += this._dvdVelY;
		
		// 境界での跳ね返り
		if (this._dvdX <= 0 || this._dvdX + this._dvdWidth >= size.x) {
			this._dvdVelX = -this._dvdVelX;
			this._dvdX = Math.max(0, Math.min(size.x - this._dvdWidth, this._dvdX));
			// 色を変更
			this._color = [Math.random(), Math.random(), Math.random()];
		}
		
		if (this._dvdY <= 0 || this._dvdY + this._dvdHeight >= size.y) {
			this._dvdVelY = -this._dvdVelY;
			this._dvdY = Math.max(0, Math.min(size.y - this._dvdHeight, this._dvdY));
			// 色を変更
			this._color = [Math.random(), Math.random(), Math.random()];
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
		
		// DVDロゴが画面外に出ないように位置を調整
		if (this._dvdX + this._dvdWidth > size.x) {
			this._dvdX = size.x - this._dvdWidth;
		}
		if (this._dvdY + this._dvdHeight > size.y) {
			this._dvdY = size.y - this._dvdHeight;
		}
	},

	_draw: function () {
		if (!this._gl || !this._program) return;
		
		const gl = this._gl;
		const size = this._map.getSize();
		
		// 画面をクリア
		gl.clearColor(0.0, 0.0, 0.0, 0.8);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		// シェーダープログラムを使用
		gl.useProgram(this._program);
		
		// ユニフォームを設定
		gl.uniform2f(this._resolutionLocation, size.x, size.y);
		gl.uniform2f(this._translationLocation, this._dvdX, this._dvdY);
		gl.uniform3fv(this._colorLocation, this._color);
		
		// テクスチャをバインド
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.uniform1i(this._textureLocation, 0);
		
		// 位置属性を設定
		gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
		gl.enableVertexAttribArray(this._positionLocation);
		gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, 0, 0);
		
		// テクスチャ座標属性を設定
		gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
		gl.enableVertexAttribArray(this._texCoordLocation);
		gl.vertexAttribPointer(this._texCoordLocation, 2, gl.FLOAT, false, 0, 0);
		
		// 描画
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
});

export const webglLayer = function (options) {
	return new WebGLLayer(options);
};

L.WebGLLayer = WebGLLayer;
L.webglLayer = webglLayer;