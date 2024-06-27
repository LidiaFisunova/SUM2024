import { index_buffer, vertex_buffer } from "../UBO/ubo.js";
import { cubeCreate } from "./cube.js";
import { earthCreate } from "./earth.js";
import { shader } from "../shd/shader.js";
import { mat4 } from "../mth/mat4.js";
import { vec3 } from "../mth/vec3.js";

class _prim {
  constructor(gl, name, type, mtl, pos, VBuf, IBuf, VA, noofI, noofV, side) {
    this.name = name;
    (this.VBuf = VBuf), (this.IBuf = IBuf), (this.VA = VA); /* render info */
    this.type = type; /* platon figure type */
    this.pos = pos; /* position */

    this.side = side;
    //let shd = shader(shd_name, gl);
    this.mtl = mtl;
    this.shdIsLoaded = null;
    this.noofI = noofI;
    this.noofV = noofV;
    this.gl = gl;
    this.matrWourld = mat4();
  }

  texAttach(url, gl, type = "2d") {
    this.mtl.textureAttach(url, type, gl);
  }

  updatePrimData(timer) {
    if (this.mtl.shader.uniforms["matrWorld"] == undefined) return;
    let mr, m1;
    if (this.type == "earth" || this.type == "clouds") {
      m1 = mat4()
        .matrMulMatr2(mat4().matrRotateY(30 * timer.globalTime))
        .matrMulMatr2(mat4().matrScale(vec3(3, 3, 3)));
    } else {
      mr = mat4().matrScale(vec3(this.side));
      m1 = mat4()
        .matrTranslate(this.pos)
        .matrMulMatr2(mr)
        .matrMulMatr2(mat4().matrRotateY(30 * timer.globalTime));
    }
    let arr1 = m1.toArray();
    let mWLoc = this.mtl.shader.uniforms["matrWorld"].loc;
    this.gl.uniformMatrix4fv(mWLoc, false, arr1);
  }

  render(timer) {
    let gl = this.gl;
    gl.bindVertexArray(this.VA);
    if (this.shdIsLoaded == null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
      if (this.mtl.shader.attrs["InNormal"] != undefined) {
        this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 12, 0);
        this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
      }
      else this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 16, 0);
      // this.mtl.shader.updateShaderData();
    }
    this.updatePrimData(timer);

    if (this.noofI != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
      gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
    } else {
      gl.drawArrays(gl.LINE_STRIP, 0, this.noofV);
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

export function primCreate(name, type, mtl, pos, side = 3, gl) {
  let vi;
  if (type == "cube") vi = cubeCreate();
  if (type == "earth") vi = earthCreate(name);
  let vert = vi[0],
    ind = vi[1],
    w = vi[2],
    h = vi[3];

  let vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  let vertexBuffer = vertex_buffer(vert, gl),
    indexBuffer,
    indlen;

  if (ind != null) (indexBuffer = index_buffer(ind, gl)), (indlen = ind.length);
  else (indexBuffer = null), (indlen = null);

  let pr = new _prim(
    gl,
    name,
    type,
    mtl,
    pos,
    vertexBuffer,
    indexBuffer,
    vertexArray,
    indlen,
    vert.length,
    side
  );
  pr.w = w;
  pr.h = h;
  return pr;
}
