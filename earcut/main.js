import earcut from 'earcut';
const vertices = [6, 0, 0, 5, 2, 12, 9, 14, 15, 9, 13, 2];
const triangles = earcut(vertices);
const triangles_vertices = triangles.map(val => [vertices[val * 2], vertices[val * 2 + 1]]);
for (let i = 0; triangles_vertices.length > i; i += 3)
  process.stdout.write(`M ${triangles_vertices[i][0]} ${triangles_vertices[i][1]} L ${triangles_vertices[i + 1][0]} ${triangles_vertices[i + 1][1]} L ${triangles_vertices[i + 2][0]} ${triangles_vertices[i + 2][1]} Z`) 
