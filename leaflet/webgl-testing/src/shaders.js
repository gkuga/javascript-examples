// 頂点シェーダー
export const vertexShaderSource = `
	precision mediump float;
	attribute vec2 a_position;
	uniform vec2 u_resolution;
	uniform float u_time;
	varying vec2 v_position;
	
	void main() {
		vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
		position.y = -position.y;
		gl_Position = vec4(position, 0.0, 1.0);
		v_position = a_position;
	}
`;

// フラグメントシェーダー（アニメーションするグラデーション）
export const fragmentShaderSource = `
	precision mediump float;
	uniform vec2 u_resolution;
	uniform float u_time;
	varying vec2 v_position;
	
	void main() {
		vec2 uv = v_position / u_resolution;
		
		// アニメーションするグラデーション
		float wave = sin(uv.x * 10.0 + u_time * 2.0) * sin(uv.y * 10.0 + u_time * 3.0);
		vec3 color = vec3(0.5 + 0.5 * wave, 0.3 + 0.3 * sin(u_time), 0.8);
		
		// 中心からの距離による透明度
		vec2 center = vec2(0.5, 0.5);
		float dist = distance(uv, center);
		float alpha = 0.3 * (1.0 - smoothstep(0.0, 0.5, dist));
		
		gl_FragColor = vec4(color, alpha);
	}
`;