import { renderCreate } from "./render/render";
import { vec3 } from "./mth/vec3";
import { camera } from "./mth/camera";
let rnd;

//Common uniform variables
//let matrView = mat4().matrView(vec3(5, 5, 5), vec3(0, 0, 0), vec3(0, 1, 0));
//let matrProj = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);

// OpenGL initialization
export function initGL() {
  let canvas = document.getElementById("canvas");
  let camera0 = camera(canvas.clientWidth, canvas.clientHeight).camSet().camSetProj(0.1, 0.1, 300);;

  rnd = renderCreate(canvas, "default", camera0);

  rnd.primAttach("cubePrim", "cube", "default", vec3(0, 0, 0));
  //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
} // End of 'initGL' function

// Render function
export function render() {
  rnd.gl.clear(rnd.gl.COLOR_BUFFER_BIT);

  rnd.render();
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
