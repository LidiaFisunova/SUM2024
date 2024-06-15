import { index_buffer, vertex_buffer } from "../UBO/ubo.js";
import { cubeCreate } from "./cube.js";
import { shader } from "../shd/shader.js";

class _material {
  constructor(shd, ubo) {
    this.shader = shd;
    this.ubo = ubo;
  }
}

class _prim {
  constructor(gl, name, type, shd_name, pos, VBuf, IBuf, VA, side = 5) {
    this.name = name;
    (this.VBuf = VBuf), (this.IBuf = IBuf), (this.VA = VA); /* render info */
    this.type = type; /* platon figure type */
    this.side = side; /* platon figure side lenght */
    this.pos = pos; /* position */

    let shd = shader(shd_name, gl);
    this.shdIsLoaded = null;
    this.mtl = new _material(shd, null);
  }

  render(gl) {
    if (this.noofI != null) {
      if (this.mtl.shdIsLoaded == null) {
        this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
        this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
      gl.bindVertexArray(this.VA.id);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
      gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
    } else {
      if (this.mtl.shdIsLoaded == null) {
        this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
        this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
      }
      gl.bindVertexArray(this.VA.id);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.noofV);
    }
  }
}

class _vertex {
  constructor(pos, norm) {
    (this.pos = pos), (this.norm = norm);
  }
}

export function vrt(pos, norm) {
  return new _vertex(pos, norm);
}

export function primCreate(name, type, mtl, pos, side = 5, gl) {
  let vi;
  if (type == "cube") vi = cubeCreate(pos, side);
  let vert = vi[0],
    ind = vi[1];

  let vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  let vertexBuffer = vertex_buffer(vert, gl);

  let indexBuffer = index_buffer(ind, gl);

  return new _prim(
    gl,
    name,
    type,
    mtl,
    pos,
    vertexBuffer,
    indexBuffer,
    vertexArray,
    side
  );
}
