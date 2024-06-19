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



// first pass
function getSDF1() {
  let p = pixels.data;
  let par = [];
  let pp = [];
  let i, j;
  for (i = 0, j = 0; i < p.length; i += 4) {
    if (i % (imgW * 4) == 0 && i != 0) {
      par = par.concat([pp]);
      pp = [];
      j = 0;
    }
    if (p[i] == 255)
      continue;
    if (p[i] == 0) {
      pp[j] = [0, i % (imgW * 4)];
      j++;
    }
  }

  let s;
  for (j = 0; j < par.length; j++) {
    pp = par[j];
    i = 0;
    while (i < pp.length - 1) {
      s = ((pp[i][1] * pp[i][1] - (pp[i + 1][1] * pp[i + 1][1])) / (2 * pp[i][1] - 2 * pp[i + 1][1]));
      pp[i][0] = s;
      i++;
      }
    }
  
  let k = 0;
  for (i = 0, j = 0; i < p.length; i += 4) {
    if (i % (imgW * 4) == 0 && i != 0 && i != (imgW * 4))
      k++, j = 0;
    if (par[k] == undefined || par[k].length == 0) {
      p[i] = 1000, p[i + 1] = 1000, p[i + 2] = 1000;
      continue;
    }
    if (par[k][j][0] != 0 && par[k][j][0] < i % (imgW * 4))
      j++;
    let r = par[k][j][1] - i % (imgW * 4);
    let r2 = (r * r / 50);
    p[i] = r2, p[i + 1] = r2, p[i + 2] = r2;
  }
}


/// second pass
function getSDF2() {
  let p = pixels.data;
  let par = [];
  let pp = [];
  let i, j, x;
  for (i = 0, x = 0; i < imgH; i++) {
    for (j = 0; j < imgW * 4; j += 4) {  
      if (p[i * imgH * 4 + j] == 255)
        continue;
      pp[x] = [0, i * imgH * 4 + j, p[i * imgH * 4 + j]]; // 0 - intersection, x, y
      x++;
    }
    par = par.concat([pp]);
    pp = [], x = 0;
  }

  let s;
  let len;
  for (j = 0; j < par.length; j++) {
    pp = par[j];
    i = 0;
    len = pp.length;
    while (pp.length > 0) {
      console.log(pp[i], i);
      s = ((pp[i][2] + pp[i][1] * pp[i][1] - (pp[i + 1][2] + pp[i + 1][1] * pp[i + 1][1])) / (2 * pp[i][1] - 2 * pp[i + 1][1]));
      if (pp[i][1] < s) {
        pp[i][0] = s;
        i++;
      }
      else {
        pp.pop(i);
        i--;
      }
      if (pp.length == len)
        break;
    }
  }
  let k = 0;
  j = 0;

  for (i = 0, x = 0; i < imgH; i++) {
    for (let h = 0; h < imgW * 4; h += 4) {  
      console.log(par[k][j], "k:", k, "j:", j, "i:", i);
      if (par[k] == undefined || par[k].length == 0) {
        continue;
      }
      if (par[k][j][0] != 0 && par[k][j][0] < i % (imgH * 4))
        j++;
      x = i * imgH * 4 + h;
      if (p[x] > 255)
        p[x] = 0;
      let r = par[k][j][1] - h;
      let r2 = (r * r / 50) + p[x];
      p[x] = r2, p[x + 1] = r2, p[x + 2] = r2;
    }
    k++;
  }
}

window.addEventListener("load", () => {
  canvas.width = imgW * 3;
  canvas.height = imgH;

  context.drawImage(img, 0, 0);
  pixels = context.getImageData(0, 0, imgW, imgH);
  invertToBW();

  context.putImageData(pixels, 0, 0);
  pixels = context.getImageData(0, 0, imgW, imgH);
 
  getSDF1();
  getSDF2();
  context.putImageData(pixels, imgW, 0);
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