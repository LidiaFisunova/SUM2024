import { shader } from "../shd/shader.js";
import { texture } from "../texture/tex.js";

class _material {
  constructor(shd_name, ubo, gl) {
    this.shader = shader(shd_name, gl);
    this.ubo = ubo;
    this.textures = [];
    this.gl = gl;
  }

  textureAttach(url, type = "2d") {
    this.textures[this.textures.length] = texture(url, type, this.gl);
  }

  apply() {
    if (this.shader.id == null) return;
    this.shader.apply();

    for (let t = 0; t < this.textures.length; t++)
      if (this.textures[t] != null)
        this.textures[t].apply(t, this.shader, this.textures[t]);
  }
}

export function mtl(shd, ubo, gl) {
  return new _material(shd, ubo, gl);
}
