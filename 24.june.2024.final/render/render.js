import { primCreate } from "../prims/prim.js";
import { mat4 } from "../mth/mat4.js";
import { vec3 } from "../mth/vec3.js";
import { timer } from "../time/timer.js";
import { input_init } from "../mth/input.js";

class _render {
  constructor(canvas, name, camera) {
    this.canvas = canvas;
    this.name = name;
    this.gl = canvas.getContext("webgl2");
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0.0, 0.0, 0.1, 1);
    //this.prg = this.gl.createProgram();
    this.timer = timer();
    this.prims = [];
    this.input = input_init(this);
    this.cam = camera;
  
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  primAttach(name, type, mtl, pos, side = 3) {
    let p = primCreate(name, type, mtl, pos, side, this.gl);
    this.prims[this.prims.length] = p;
    return p;
  }

  programUniforms(shd) {
    if (shd.uniforms["matrView"] != undefined) {
      //let m = mat4().matrView(vec3(5, 3, 5), vec3(0, 0, 0), vec3(0, 1, 0));
      let arr = this.cam.matrView.toArray();
      let mVLoc = shd.uniforms["matrView"].loc;
      this.gl.uniformMatrix4fv(mVLoc, false, arr);
    }

    if (shd.uniforms["matrProj"] != undefined) {
      //let m1 = mat4().matrFrustum(-0.08, 0.08, -0.08, 0.08, 0.1, 200);
      let arr1 = this.cam.matrProj.toArray();
      let mPLoc = shd.uniforms["matrProj"].loc;
      this.gl.uniformMatrix4fv(mPLoc, false, arr1);
    }
  }

  transformProgramUniforms(shd) {
    if (shd.uniforms["Time"] == undefined) return;
    let timeLoc = shd.uniforms["Time"].loc;

    this.gl.uniform1f(timeLoc, this.timer.globalTime);
  }

  render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    this.timer.response();
    this.input.responseCamera(this);
    this.input.reset();
    for (const p of this.prims) {
      if (p.mtl.shader.id != null &&
          p.mtl.shader.shaders[0].id != null &&
          p.mtl.shader.shaders[1].id != null &&
          p.shdIsLoaded == null) {
        p.mtl.apply();
        this.programUniforms(p.mtl.shader);
        this.transformProgramUniforms(p.mtl.shader);

        if (p.mtl.shader.uniforms["IsEarth"] == undefined) return;
        let k = 0;
        if (p.name == "Earth") k = 1;
        let mWLoc = p.mtl.shader.uniforms["IsEarth"].loc;
        this.gl.uniform1f(mWLoc, k);

        //if (p.name == "Clouds") setInterval(() => {}, 10000);
        p.render(this.timer);
        p.shdIsLoaded = 1;
        return;
      }
      if (p.shdIsLoaded == null) return;
      p.mtl.apply();
      this.programUniforms(p.mtl.shader);

      if (p.mtl.shader.uniforms["IsEarth"] == undefined) return;
      let k = 0;
      if (p.name == "Earth") k = 1;
      let mWLoc = p.mtl.shader.uniforms["IsEarth"].loc;
      this.gl.uniform1f(mWLoc, k);

      this.transformProgramUniforms(p.mtl.shader);
      p.render(this.timer);
    }
  }
}

export function renderCreate(canvas, name, camera) {
  return new _render(canvas, name, camera);
}
