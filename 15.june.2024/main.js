let img = document.getElementById("sun");
let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
let pixels;
let imgW = img.width, imgH = img.height;

function invertToBW() {
  let p = pixels.data;
  for (let j = 0; j < p.length; j += 4) {
    if (
      (p[j] +
        p[j + 1] +
        p[j + 2]) / 2 > 255 / 2
    ) {
      p[j] = 255;
      p[j + 1] = 255;
      p[j + 2] = 255;
    } else {
      p[j] = 0;
      p[j + 1] = 0;
      p[j + 2] = 0;
    }
    p[j + 3] = 255;
  }
}


//context.putImageData(pixels, 0, 0);
function getSDF() {
  let p = pixels.data;
  par = [];
  pp = [];
  for (const i = 0, j = 0; i < p.length - 1; i += 4) {
    if (p[i] == 0) {
      pp[j] = [0, i];
      j++;
    }
    if (i % imgW == 0) {
      par.concat([pp]);
      pp = [];
    }
  }
  i = 0;
  for (j = 0; j < par.length; j++) {
    a = par[j].length;
    pp = par[j];
    while (1) {
      s = ((pp[i][1] * pp[i][1] * 2 - (pp[i + 1][1] * pp[i + 1][1] * 2)) / (2 * pp[i][1] - 2 * pp[i + 1][1]));
      if (pp[i][1] < s) {
        pp[i][0] = s;
        i++;
        if (i == a)
          break;
      }
      else {
        pp.remove(pp[i]);
        i--;
      }
    }
  }
  const k = 0;
  for (i = 0, j = 0; i < p.length - 1; i += 4) {
    if (i % imgW == 0)
      k++;
    if (par[k][j][1] < i)
      j++;
    let r = par[k][j][1] - i;
    let r2 = r * r / 3;
    p[i] = r2, p[i + 1] = r2, p[i + 2] = r2;
  }
}

window.addEventListener("load", () => {
  canvas.width = imgW * 2;
  canvas.height = imgH;

  context.drawImage(img, 0, 0);
  pixels = context.getImageData(0, 0, imgW, imgH);
  invertToBW();

  context.putImageData(pixels, 0, 0);

  getSDF();
  context.putImageData(pixels, 0, 0);
});