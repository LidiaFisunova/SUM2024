import { renderCreate } from "./render/render.js";
import { vec3 } from "./mth/vec3.js";
import { camera } from "./mth/camera.js";
import { mtl } from "./material/mtl.js";
import { imageCreate } from "./texture/tex.js";

let rnd1;

// OpenGL initialization
export function initGL() {
  let canvas1 = document.getElementById("canvas1");
  let camera1 = camera(canvas1.clientWidth, canvas1.clientHeight)
    .camSet(vec3(5, 6, 5))
    .camSetProj(0.1, 0.1, 300);

  rnd1 = renderCreate(canvas1, "earth", camera1);
  return rnd1;
  //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
} // End of 'initGL' function

// Render function
export function render() {
  rnd1.render();
}

console.log("library.js was imported");

window.addEventListener("load", () => {

  initGL();

  let mtl1 = mtl("earth", null, rnd1.gl);
  let mtl2 = mtl("earth", null, rnd1.gl);
  let mtl3 = mtl("default", null, rnd1.gl);

  let img = new Image();
  img.src = "earth.jpeg";
  let nameURL = imageCreate(img, "earth");
  mtl1.textureAttach(nameURL);

  //let img1 = new Image();
  //img1.src = "clouds1.png";
  //let nameURL1 = imageCreate(img1, "clouds");
  //mtl2.textureAttach(nameURL1);

  //rnd1.primAttach("Cube", "cube", mtl3, vec3(1, 0, 0), 2);
  rnd1.primAttach("Earth", "earth", mtl1, vec3(0, 2, 0), 2);
  let cloud = rnd1.primAttach("Clouds", "earth", mtl2, vec3(0, 2, 0), 5);

  let x = 0, y = 0;

  setInterval(() => {
    if (cloud.VBuf.id) {
      console.log(`lb${x}:${y}`);
      storeGeoData(cloud, x, y);
      x++;
      if (x >= cloud.w) {
        x = 0;
        y++;
        if (y >= cloud.h)
          y = 0;
      }
    }
  }, 10);

  const draw = () => {
    /*
    rnd1.gl.bindBuffer(rnd1.gl.ARRAY_BUFFER, cloud.VBuf.id);
    for (let x = 0; x < cloud.w; x++) {
      for (let y = 0; y < cloud.h; y++) {
        let x1 = 1, y1 = 1,  offset = (y * cloud.w + x) * 16;
        rnd1.gl.bufferSubData(rnd1.gl.ARRAY_BUFFER, offset + 12, new Float32Array([10]));
      }
    }
    r += 1.8;
    if (r > 100)
      r = 0;
    */
    render();

    window.requestAnimationFrame(draw);
  };
  draw();
});

export async function getGeoData(lat, lon) {
  const req = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=fa794a0fcea5e8cd7b7e33a0d5d76fa4`;
  let request = await fetch(req);
  let data = await request.json();
  return data.clouds.all;
}

export async function storeGeoData(cloud, x, y) {
  let lat = y * 180 / (cloud.h - 1) - 90, lon = x * 360 / (cloud.w - 1) - 180;
  const req = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=fa794a0fcea5e8cd7b7e33a0d5d76fa4`;

  let request = await fetch(req);
  let data = await request.json();
  let r = data.clouds.all;

  console.log(`lb${lat}:${lon}->${r}`);

  rnd1.gl.bindBuffer(rnd1.gl.ARRAY_BUFFER, cloud.VBuf.id);
  let offset = (y * cloud.w + x) * 16;
  rnd1.gl.bufferSubData(rnd1.gl.ARRAY_BUFFER, offset + 12, new Float32Array([r]));
}
