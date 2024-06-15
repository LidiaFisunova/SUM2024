import { primCreate } from "../prims/prim.js";
import { mat4 } from "../mth/mat4.js";
import { vec3 } from "../mth/vec3.js";

class _render {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2");
    this.gl.clearColor(0.9, 0.7, 0.7, 1);
    this.prg = this.gl.createProgram();

    this.prims = [];
  }

  primAttach(name, type, shd_name, pos, side = 5) {
    let p = primCreate(name, type, shd_name, pos, side, this.gl);
    this.prims[this.prims.length] = p;
  }

  programUniforms(shd) {
    let m = mat4().matrView(vec3(5, 5, 5), vec3(0, 0, 0), vec3(0, 1, 0));
    let arr = m.toArray();
    let mVLoc = shd.uniforms["matrView"].loc;
    this.gl.uniformMatrix4fv(mVLoc, false, arr);

    let m1 = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);
    let arr1 = m1.toArray();
    let mPLoc = shd.uniforms["matrProj"].loc;
    this.gl.uniformMatrix4fv(mPLoc, false, arr1);

    /*
    let timeLoc = shd.uniforms["Time"].loc;

    if (timeLoc != -1) {
      const date = new Date();
      let t =
        date.getMinutes() * 60 +
        date.getSeconds() +
        date.getMilliseconds() / 1000;
      gl.uniform1f(timeLoc, t);
    }
    */
    shd.updateShaderData();
  }

  render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    for (const p of this.prims) {
      if (
        p.mtl.shader.id != null &&
        p.mtl.shader.shaders[0].id != null &&
        p.mtl.shader.shaders[1].id != null &&
        p.shdIsLoaded == null
      ) {
        p.mtl.shader.apply();
        p.render(this.gl);
        this.programUniforms(p.mtl.shader);
        p.shdIsLoaded = 1;
      }
      if (p.shdIsLoaded == null) return;
      p.render(this.gl);
    }
  }
}

export function renderCreate(canvas) {
  return new _render(canvas);
}
