import { renderCreate } from "./render/render";
import { vec3 } from "./mth/vec3";
import { camera } from "./mth/camera";
let rnd1, rnd2;

//Common uniform variables
//let matrView = mat4().matrView(vec3(5, 5, 5), vec3(0, 0, 0), vec3(0, 1, 0));
//let matrProj = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);

// OpenGL initialization
export function initGL() {
  let canvas1 = document.getElementById("canvas1");
  let camera1 = camera(canvas1.clientWidth, canvas1.clientHeight).camSet().camSetProj(0.1, 0.1, 300);

  let canvas2 = document.getElementById("canvas2");
  let camera2 = camera(canvas2.clientWidth, canvas2.clientHeight).camSet().camSetProj(0.1, 0.1, 300);

  rnd1 = renderCreate(canvas1, "earth", camera1);

  rnd2 = renderCreate(canvas2, "default", camera2);
  rnd2.primAttach("cubePrim", "cube", "default", vec3(0, 0, 0));
  rnd1.primAttach("Earth", "earth", "earth", vec3(0, 2, 0), 3);
  //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
} // End of 'initGL' function

// Render function
export function render() {
  rnd1.gl.clear(rnd1.gl.COLOR_BUFFER_BIT);

  rnd1.render();

  rnd2.gl.clear(rnd2.gl.COLOR_BUFFER_BIT);

  rnd2.render();
}

console.log("library.js was imported");

window.addEventListener("load", () => {
  initGL();

  const draw = () => {
    render();

    window.requestAnimationFrame(draw);
  };
  draw();
});
