const defaultGradient = {
    0.4: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
}

function gradient(grad=defaultGradient) {
  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d', {willReadFrequently: true}),
      gradient = ctx.createLinearGradient(0, 0, 0, 256);

  canvas.width = 1;
  canvas.height = 256;

  for (var i in grad) {
      gradient.addColorStop(+i, grad[i]);
  }

	ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 256);

  this._grad = ctx.getImageData(0, 0, 1, 256).data;

  return this;
}
