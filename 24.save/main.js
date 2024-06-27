import { renderCreate } from "./render/render";
import { vec3 } from "./mth/vec3";
import { camera } from "./mth/camera";
import { mtl } from "./material/mtl";
import { imageCreate } from "./texture/tex";

let rnd1;

// OpenGL initialization
export function initGL() {
  let canvas1 = document.getElementById("canvas1");
  let camera1 = camera(canvas1.clientWidth, canvas1.clientHeight)
    .camSet(vec3(5, 6, 5))
    .camSetProj(0.1, 0.1, 300);

  rnd1 = renderCreate(canvas1, "earth", camera1);
  let mtl1 = mtl("earth", null, rnd1.gl);
  let mtl2 = mtl("earth", null, rnd1.gl);
  let mtl3 = mtl("default", null, rnd1.gl);

  let img = new Image();
  img.src = "earth.jpeg";
  let nameURL = imageCreate(img, "earth");

  mtl1.textureAttach(nameURL);

  //rnd1.primAttach("Clouds", "earth", mtl2, vec3(0, 2, 0), 5);
  rnd1.primAttach("Cube", "cube", mtl3, vec3(1, 0, 0), 2);
  rnd1.primAttach("Earth", "earth", mtl1, vec3(0, 2, 0), 3);
  //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
} // End of 'initGL' function

// Render function
export function render() {
  rnd1.gl.clear(rnd1.gl.COLOR_BUFFER_BIT);
  rnd1.gl.clear(rnd1.gl.DEPTH_BUFFER_BIT);

  rnd1.render();
}

console.log("library.js was imported");

window.addEventListener("load", () => {
  document.getElementById("Lida").onclick = (e) => {
    e.target.innerHTML = getGeoData(30, 59);
  };

  initGL();

  const draw = () => {
    render();

    window.requestAnimationFrame(draw);
  };
  draw();
});

//      function get() {
//        //https://api.openweathermap.org/data/2.5/weather?lat=30&lon=59&appid=fa794a0fcea5e8cd7b7e33a0d5d76fa4
//        document.getElementById("Lida").innerHTML = getGeoData();
//      }

export async function getGeoData(lat, lon) {
  const req = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=fa794a0fcea5e8cd7b7e33a0d5d76fa4`;
  let request = await fetch(req);
  let data = await request.json();
  return data.clouds.all;
}
