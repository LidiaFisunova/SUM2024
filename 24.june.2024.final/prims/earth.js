export function earthCreate() {
    let vertexes = [], w = 20, h = 20,
      i, j, theta, phi, G = [], ind = [];
    let pi = Math.acos(-1);
    
    for (i = 0, theta = 0; i < h; i++, theta += pi / (h - 1)) {
        for (j = 0, phi = 0; j < w; j++, phi += 2 * pi / (w - 1)) {
            G[j] = Math.sin(theta) * Math.sin(phi);
            G[j + 1] = Math.cos(theta);
            G[j + 2] = Math.sin(theta) * Math.cos(phi);
        }
        vertexes = vertexes.concat(...G);
    }

    for (i = 0; i < h; i++) {
        for (j = 0; j < w - 1; j += 4) {
            ind[i * h + j] = i * h + j;
            ind[i * h + j + 1] = i * h + j + 1;
            ind[i * h + j + 2] = (i + 1) * h + j;
            ind[i * h + j + 3] = (i + 1) * h + j + 1;
        }
    }
    return [vertexes, ind];
}