import { primCreate } from "../prims/prim.js";
import { mat4 } from "../mth/mat4.js";
import { vec3 } from "../mth/vec3.js";
import { timer } from "../time/timer.js";

class _render {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2");
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0.9, 0.7, 0.7, 1);
    this.prg = this.gl.createProgram();
    this.timer = timer();
    this.prims = [];
  }

  primAttach(name, type, shd_name, pos, side=3) {
    let p = primCreate(name, type, shd_name, pos, side, this.gl);
    this.prims[this.prims.length] = p;
  }

  programUniforms(shd) {
    let m = mat4().matrView(vec3(5, 3, 5), vec3(0, 0, 0), vec3(0, 1, 0));
    let arr = m.toArray();
    let mVLoc = shd.uniforms["matrView"].loc;
    this.gl.uniformMatrix4fv(mVLoc, false, arr);

    let m1 = mat4().MatrFrustum(-0.08, 0.08, -0.08, 0.08, 0.1, 200);
    //let m1 = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);
    let arr1 = m1.toArray();
    let mPLoc = shd.uniforms["matrProj"].loc;
    this.gl.uniformMatrix4fv(mPLoc, false, arr1);
  }

  transformProgramUniforms(shd) {
    if (shd.uniforms["Time"] == undefined)
      return;
    let timeLoc = shd.uniforms["Time"].loc;

    this.gl.uniform1f(timeLoc, this.timer.globalTime);
    }
  

  render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.timer.response();
    for (const p of this.prims) {
      if (
        p.mtl.shader.id != null &&
        p.mtl.shader.shaders[0].id != null &&
        p.mtl.shader.shaders[1].id != null &&
        p.shdIsLoaded == null
      ) {
        p.mtl.shader.apply();
        this.programUniforms(p.mtl.shader);
        this.transformProgramUniforms(p.mtl.shader);
        p.render(this.timer);
        p.shdIsLoaded = 1;
        return;
      }
      if (p.shdIsLoaded == null) return;
      this.transformProgramUniforms(p.mtl.shader);
      p.render();
    }
  }
}

export function renderCreate(canvas) {
  return new _render(canvas);
}
