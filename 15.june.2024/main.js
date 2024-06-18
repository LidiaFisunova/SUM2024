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
function getSDF1() {
  let p = pixels.data;
  let par = [];
  let pp = [];
  let i, j;
  for (i = 0, j = 0; i < p.length; i += 4) {
    if (i % (imgW * 4) == 0 && i != 0) {
      //if (pp.length == 0)
      //  continue;
      par = par.concat([pp]);
      pp = [];
      j = 0;
    }
    if (p[i] == 255)
      continue;
    if (p[i] == 0) {
      pp[j] = [0, i % imgW];
      j++;
    }
  }

  let s;
  for (j = 0; j < par.length; j++) {
    pp = par[j];
    i = 0;
    while (i < pp.length - 1) {
      s = ((pp[i][1] * pp[i][1] * 2 - (pp[i + 1][1] * pp[i + 1][1] * 2)) / (2 * pp[i][1] - 2 * pp[i + 1][1]));
      pp[i][0] = s;
      i++;
      }
    }
  
  let k = 0;
  for (i = 0, j = 0; i < p.length; i += 4) {
    if (i % imgW == 0 && i != 0 && i != imgW)
      k++, j = 0;
    //console.log(par[k][j], "k:", k, "j:", j, "i:", i);
    //if (k == 300 && j == 2)
    //  p[i] = 65723;
    if (par[k] == undefined || par[k].length == 0) {
      p[i] = 1000, p[i + 1] = 1000, p[i + 2] = 1000;
      continue;
    }
    if (par[k][j][0] != 0 && par[k][j][0] < i % imgW)
      j++;
    let r = par[k][j][0] - i % imgW;
    let r2 = (r * r / 3);
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

  getSDF1();
  context.putImageData(pixels, 0, 0); 
});

/*
let s;
  for (j = 0; j < par.length; j++) {
    pp = par[j];
    i = 0;
    while (pp.length > 1) {
      if (i == pp.length - 1)
        break;
      s = ((pp[i][1] * pp[i][1] * 2 - (pp[i + 1][1] * pp[i + 1][1] * 2)) / (2 * pp[i][1] - 2 * pp[i + 1][1]));
      //console.log(`s${s}, ${pp[i][1]}`);
      if (pp[i][1] < s) {
        pp[i][0] = s;
        i++;
      }

      else {
        pp = pp.remove(pp[i]);
        i--;
      }
    }
  }
    */