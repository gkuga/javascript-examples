import * as turf from '@turf/turf';

const polygon1 = turf.polygon([[[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]]]);
const polygon2 = turf.polygon([[[60, 60], [80, 60], [80, 80], [60, 80], [60, 60]]]);
const multiPolygonMask = turf.featureCollection([polygon1, polygon2]);

function isPointInMask(point, mask) {
  const turfPoint = turf.point([point[1], point[0]]);
  
  if (mask.type === 'FeatureCollection') {
    return mask.features.some(feature => {
      return turf.booleanPointInPolygon(turfPoint, feature);
    });
  }
  return turf.booleanPointInPolygon(turfPoint, mask);
}

function applyTurfMask(canvas, ctx, mask) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const mapBounds = [[0, 0], [100, 100]];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const mapX = (x / canvas.width) * (mapBounds[1][0] - mapBounds[0][0]) + mapBounds[0][0];
      const mapY = ((canvas.height - y) / canvas.height) * (mapBounds[1][1] - mapBounds[0][1]) + mapBounds[0][1];
      if (!isPointInMask([mapX, mapY], mask)) {
        const index = (y * canvas.width + x) * 4;
        data[index + 3] = 0;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}