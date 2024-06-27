export function cubeCreate() {
  /* let sx = 0 + side,
    sy = pos.y + side,
    sz = pos.z - side; */
  let p = [
    [-0.5, -0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5],
    [-0.5, 0.5, 0.5],
    [-0.5, 0.5, -0.5],
    [0.5, 0.5, -0.5],
    [0.5, -0.5, -0.5],
    [-0.5, -0.5, -0.5],
  ];

  let n = [
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
    [-1, 1, -1],
    [1, 1, -1],
    [1, -1, -1],
    [-1, -1, -1],
  ];
  let vertexes = [],
    j = 0;
  while (j < 8) {
    vertexes[j] = [
      ...p[j],
      n[j][0],
      0,
      0,
      ...p[j],
      0,
      n[j][1],
      0,
      ...p[j],
      0,
      0,
      n[j][2],
    ];
    j++;
  }
  let ind = [
    2, 11, 5, 8, -1,
    6, 3, 15, 18, -1,
    19, 22, 4, 1, -1,
    0, 9, 21, 12, -1,
    14, 17, 23, 20, -1,
    23, 14, 17, -1,
    16, 13, 7, 10,
  ];

  vertexes = [
    ...vertexes[0],
    ...vertexes[1],
    ...vertexes[2],
    ...vertexes[3],
    ...vertexes[4],
    ...vertexes[5],
    ...vertexes[6],
    ...vertexes[7],
  ];

  return [vertexes, ind];
}