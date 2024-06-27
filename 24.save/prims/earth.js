export function earthCreate(name) {
  let vertexes = [],
    w = 100,
    h = 100,
    i,
    j,
    theta,
    phi,
    G = [],
    ind = [],
    x,
    y,
    R;
  let pi = Math.acos(-1),
    z;

  R = name == "Earth" ? 1 : 1.2;

  https: for (i = 0, theta = 0; i < h; i++, theta += pi / (h - 1)) {
    for (j = 0, phi = 0; j < w; j++, phi += (2 * pi) / (w - 1)) {
      //G[0] = Math.sin(theta) * Math.sin(phi);
      //G[1] = Math.cos(theta);
      //G[2] = Math.sin(theta) * Math.cos(phi);
      G[0] = j / (w - 1);
      G[1] = i / (h - 1);
      if (name == "Earth") z = -1;
      else {
        //
      }
      G[2] = R;
      vertexes = vertexes.concat(...G);
    }
  }

  for (i = 0, y = 0; y < h - 1; i += 4, y++) {
    for (j = 0, x = 0; j < (2 + w * 2) * 2 - 4; j += 4) {
      //j - count of ind in one row, x - defining a sequence of ind
      ind[i * h + j] = y * h + x;
      if (x == w - 1) {
        ind[i * h + j + 1] = y * h;
      } else ind[i * h + j + 1] = y * h + x + 1;
      ind[i * h + j + 2] = (y + 1) * h + x;
      if (x == w - 1) ind[i * h + j + 3] = (y + 1) * h;
      else ind[i * h + j + 3] = (y + 1) * h + x + 1;

      x++;
    }
  }
  return [vertexes, ind];
}
