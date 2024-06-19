import { index_buffer, vertex_buffer } from "../UBO/ubo.js";
import { cubeCreate } from "./cube.js";
import { shader } from "../shd/shader.js";
import { mat4 } from "../mth/mat4.js";
import { vec3 } from "../mth/vec3.js";

class _material {
  constructor(shd, ubo) {
    this.shader = shd;
    this.ubo = ubo;
  }
}

class _prim {
  constructor(gl, name, type, shd_name, pos, VBuf, IBuf, VA, noofI, noofV, side) {
    this.name = name;
    (this.VBuf = VBuf), (this.IBuf = IBuf), (this.VA = VA); /* render info */
    this.type = type; /* platon figure type */
    this.pos = pos; /* position */

    this.side = side;
    let shd = shader(shd_name, gl);
    this.mtl = new _material(shd, null);
    this.shdIsLoaded = null;
    this.noofI = noofI;
    this.noofV = noofV;
    this.gl = gl;
  }

  updatePrimData(timer) {
    //let mr = mat4().matrRotateX(30);

    let mr = mat4().matrScale(vec3(this.side));
    let m1 = mat4().matrTranslate(this.pos).matrMulMatr2(mr).matrMulMatr2(mat4().matrRotateY(30 * removeEventListener.globalTime));
    let arr1 = m1.toArray();
    let mWLoc = this.mtl.shader.uniforms["matrWorld"].loc;
    this.gl.uniformMatrix4fv(mWLoc, false, arr1);
  }

  render(timer) {
    let gl = this.gl;
    if (this.noofI != null) {
      if (this.mtl.shdIsLoaded == null) {
        this.updatePrimData(timer);
        this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
        this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
        this.mtl.shader.updateShaderData();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
      gl.bindVertexArray(this.VA.id);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
      gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
    } else {
      if (this.mtl.shdIsLoaded == null) {
        this.updatePrimData(timer);
        this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
        this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
        this.mtl.shader.updateShaderData();
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

export function primCreate(name, type, mtl, pos, side=3, gl) {
  let vi;
  if (type == "cube") vi = cubeCreate();
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
    ind.length,
    vert.length,
    side
  );
}