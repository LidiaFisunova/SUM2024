class _image {
  constructor(img, name) {
    this.img = img;
    this.name = name;
  }
}

export function imageCreate(img, name) {
  return new _image(img, name);
}

class _texture {
  constructor(nameURL, textureType, gl) {
    this.name = nameURL.name;
    this.gl = gl;
    if (textureType == "2d") this.type = gl.TEXTURE_2D;
    else (this.type = null), console.log("texture type is not 2d");
    this.id = gl.createTexture();
    gl.bindTexture(this.type, this.id);
    if (nameURL.img) {
      gl.texImage2D(
        this.type,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 0])
      );
      nameURL.img.onload = () => {
        gl.bindTexture(this.type, this.id);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          this.type,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          nameURL.img
        );
        gl.generateMipmap(this.type);
        gl.texParameteri(this.type, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(this.type, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(
          this.type,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        );
        gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      };
    }
  }

  apply(i, shd, tex) {
    this.gl.activeTexture(this.gl.TEXTURE0 + i);
    this.gl.bindTexture(tex.type, tex.id);

    if (shd.uniforms["earthTex"] == undefined) return;
    let texLoc = shd.uniforms["earthTex"].loc;
    this.gl.uniform1i(texLoc, i);
  }
}

export function texture(url, type, gl) {
  return new _texture(url, type, gl);
}
