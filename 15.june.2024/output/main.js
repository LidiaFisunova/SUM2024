(function () {
  'use strict';

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
      let r2 = (r * r);
      p[i] = r2, p[i + 1] = r2, p[i + 2] = r2;
    }
  }


  /// second pass
  function getSDF2() {
    let p = pixels.data;
    let par = [];
    let pp = [];
    let i, j, x, l;
    for (i = 0; i < imgW * 4; i += 4) {
      for (j = 0, l = 0, x = 0; j < imgH; j++) {
        if (p[j * imgW * 4 + i] == 255) {
          l++;
          continue;
        }
        pp[x] = [0, l * 4, p[j * imgW * 4 + i]]; // 0 - intersection, x, y
        x++;
        l++;
      }
      par = par.concat([pp]);
      pp = [];
    }

    let s;
    let last_intersection;
    for (j = 6; j < par.length; j++) {
      pp = par[j];
      i = 0;
      pp.length;
      last_intersection = 0;
      while (i >= 0) {
        //console.log(pp[i], i);
        //if (pp[i] == undefined)
        //  pp[i] = [1, 1, 1];
        s = ((pp[i][2] + pp[i][1] * pp[i][1] - (pp[i + 1][2] + pp[i + 1][1] * pp[i + 1][1])) / (2 * pp[i][1] - 2 * pp[i + 1][1]));
        if (last_intersection < s) {
          pp[i][0] = last_intersection = s;
          i++;
        }
        else {
          pp.splice(i, 1);
          i--;
          console.log(i, j, pp[i]);
          //pp[i][0] = last_intersection = s;
        }
        if (pp.length == i + 1)
          break;
      }
    }
    let k = 0;
    j = 0;

    for (i = 0, x = 0; i < imgW * 4; i += 4) {
      for (let h = 0, l = 0; h < imgH; h++) {  
        //console.log(par[k][j], "k:", k, "j:", j, "i:", i);
        if (par[k] == undefined || par[k].length == 0) {
          l++;
          continue;
        }
        if (par[k][j][0] != 0 && par[k][j][0] < l)
          j++;
        x = h * imgW * 4 + i;
        if (p[x] > 255)
          p[x] = 0;
        let r = par[k][j][1] - l * 4;
        //console.log(par[k][j][1], l);
        let r2 = ((r * r) / 1000 + p[x]) / 10;
        p[x] = r2, p[x + 1] = r2, p[x + 2] = r2;
        l++;
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

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgaW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdW5cIik7XHJcbmxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxubGV0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5sZXQgcGl4ZWxzO1xyXG5sZXQgaW1nVyA9IGltZy53aWR0aCwgaW1nSCA9IGltZy5oZWlnaHQ7XHJcblxyXG5mdW5jdGlvbiBpbnZlcnRUb0JXKCkge1xyXG4gIGxldCBwID0gcGl4ZWxzLmRhdGE7XHJcbiAgZm9yIChsZXQgaiA9IDA7IGogPCBwLmxlbmd0aDsgaiArPSA0KSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIChwW2pdICtcclxuICAgICAgICBwW2ogKyAxXSArXHJcbiAgICAgICAgcFtqICsgMl0pIC8gMiA+IDI1NSAvIDJcclxuICAgICkge1xyXG4gICAgICBwW2pdID0gMjU1O1xyXG4gICAgICBwW2ogKyAxXSA9IDI1NTtcclxuICAgICAgcFtqICsgMl0gPSAyNTU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwW2pdID0gMDtcclxuICAgICAgcFtqICsgMV0gPSAwO1xyXG4gICAgICBwW2ogKyAyXSA9IDA7XHJcbiAgICB9XHJcbiAgICBwW2ogKyAzXSA9IDI1NTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5cclxuLy8gZmlyc3QgcGFzc1xyXG5mdW5jdGlvbiBnZXRTREYxKCkge1xyXG4gIGxldCBwID0gcGl4ZWxzLmRhdGE7XHJcbiAgbGV0IHBhciA9IFtdO1xyXG4gIGxldCBwcCA9IFtdO1xyXG4gIGxldCBpLCBqO1xyXG4gIGZvciAoaSA9IDAsIGogPSAwOyBpIDwgcC5sZW5ndGg7IGkgKz0gNCkge1xyXG4gICAgaWYgKGkgJSAoaW1nVyAqIDQpID09IDAgJiYgaSAhPSAwKSB7XHJcbiAgICAgIHBhciA9IHBhci5jb25jYXQoW3BwXSk7XHJcbiAgICAgIHBwID0gW107XHJcbiAgICAgIGogPSAwO1xyXG4gICAgfVxyXG4gICAgaWYgKHBbaV0gPT0gMjU1KVxyXG4gICAgICBjb250aW51ZTtcclxuICAgIGlmIChwW2ldID09IDApIHtcclxuICAgICAgcHBbal0gPSBbMCwgaSAlIChpbWdXICogNCldO1xyXG4gICAgICBqKys7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgcztcclxuICBmb3IgKGogPSAwOyBqIDwgcGFyLmxlbmd0aDsgaisrKSB7XHJcbiAgICBwcCA9IHBhcltqXTtcclxuICAgIGkgPSAwO1xyXG4gICAgd2hpbGUgKGkgPCBwcC5sZW5ndGggLSAxKSB7XHJcbiAgICAgIHMgPSAoKHBwW2ldWzFdICogcHBbaV1bMV0gLSAocHBbaSArIDFdWzFdICogcHBbaSArIDFdWzFdKSkgLyAoMiAqIHBwW2ldWzFdIC0gMiAqIHBwW2kgKyAxXVsxXSkpO1xyXG4gICAgICBwcFtpXVswXSA9IHM7XHJcbiAgICAgIGkrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIFxyXG4gIGxldCBrID0gMDtcclxuICBmb3IgKGkgPSAwLCBqID0gMDsgaSA8IHAubGVuZ3RoOyBpICs9IDQpIHtcclxuICAgIGlmIChpICUgKGltZ1cgKiA0KSA9PSAwICYmIGkgIT0gMCAmJiBpICE9IChpbWdXICogNCkpXHJcbiAgICAgIGsrKywgaiA9IDA7XHJcbiAgICBpZiAocGFyW2tdID09IHVuZGVmaW5lZCB8fCBwYXJba10ubGVuZ3RoID09IDApIHtcclxuICAgICAgcFtpXSA9IDEwMDAsIHBbaSArIDFdID0gMTAwMCwgcFtpICsgMl0gPSAxMDAwO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGlmIChwYXJba11bal1bMF0gIT0gMCAmJiBwYXJba11bal1bMF0gPCBpICUgKGltZ1cgKiA0KSlcclxuICAgICAgaisrO1xyXG4gICAgbGV0IHIgPSBwYXJba11bal1bMV0gLSBpICUgKGltZ1cgKiA0KTtcclxuICAgIGxldCByMiA9IChyICogcik7XHJcbiAgICBwW2ldID0gcjIsIHBbaSArIDFdID0gcjIsIHBbaSArIDJdID0gcjI7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuLy8vIHNlY29uZCBwYXNzXHJcbmZ1bmN0aW9uIGdldFNERjIoKSB7XHJcbiAgbGV0IHAgPSBwaXhlbHMuZGF0YTtcclxuICBsZXQgcGFyID0gW107XHJcbiAgbGV0IHBwID0gW107XHJcbiAgbGV0IGksIGosIHgsIGw7XHJcbiAgZm9yIChpID0gMDsgaSA8IGltZ1cgKiA0OyBpICs9IDQpIHtcclxuICAgIGZvciAoaiA9IDAsIGwgPSAwLCB4ID0gMDsgaiA8IGltZ0g7IGorKykge1xyXG4gICAgICBpZiAocFtqICogaW1nVyAqIDQgKyBpXSA9PSAyNTUpIHtcclxuICAgICAgICBsKys7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgcHBbeF0gPSBbMCwgbCAqIDQsIHBbaiAqIGltZ1cgKiA0ICsgaV1dOyAvLyAwIC0gaW50ZXJzZWN0aW9uLCB4LCB5XHJcbiAgICAgIHgrKztcclxuICAgICAgbCsrO1xyXG4gICAgfVxyXG4gICAgcGFyID0gcGFyLmNvbmNhdChbcHBdKTtcclxuICAgIHBwID0gW107XHJcbiAgfVxyXG5cclxuICBsZXQgcztcclxuICBsZXQgbGVuLCBsYXN0X2ludGVyc2VjdGlvbjtcclxuICBmb3IgKGogPSA2OyBqIDwgcGFyLmxlbmd0aDsgaisrKSB7XHJcbiAgICBwcCA9IHBhcltqXTtcclxuICAgIGkgPSAwO1xyXG4gICAgbGVuID0gcHAubGVuZ3RoO1xyXG4gICAgbGFzdF9pbnRlcnNlY3Rpb24gPSAwO1xyXG4gICAgd2hpbGUgKGkgPj0gMCkge1xyXG4gICAgICAvL2NvbnNvbGUubG9nKHBwW2ldLCBpKTtcclxuICAgICAgLy9pZiAocHBbaV0gPT0gdW5kZWZpbmVkKVxyXG4gICAgICAvLyAgcHBbaV0gPSBbMSwgMSwgMV07XHJcbiAgICAgIHMgPSAoKHBwW2ldWzJdICsgcHBbaV1bMV0gKiBwcFtpXVsxXSAtIChwcFtpICsgMV1bMl0gKyBwcFtpICsgMV1bMV0gKiBwcFtpICsgMV1bMV0pKSAvICgyICogcHBbaV1bMV0gLSAyICogcHBbaSArIDFdWzFdKSk7XHJcbiAgICAgIGlmIChsYXN0X2ludGVyc2VjdGlvbiA8IHMpIHtcclxuICAgICAgICBwcFtpXVswXSA9IGxhc3RfaW50ZXJzZWN0aW9uID0gcztcclxuICAgICAgICBpKys7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcHAuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgIGktLTtcclxuICAgICAgICBjb25zb2xlLmxvZyhpLCBqLCBwcFtpXSk7XHJcbiAgICAgICAgLy9wcFtpXVswXSA9IGxhc3RfaW50ZXJzZWN0aW9uID0gcztcclxuICAgICAgfVxyXG4gICAgICBpZiAocHAubGVuZ3RoID09IGkgKyAxKVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuICBsZXQgayA9IDA7XHJcbiAgaiA9IDA7XHJcblxyXG4gIGZvciAoaSA9IDAsIHggPSAwOyBpIDwgaW1nVyAqIDQ7IGkgKz0gNCkge1xyXG4gICAgZm9yIChsZXQgaCA9IDAsIGwgPSAwOyBoIDwgaW1nSDsgaCsrKSB7ICBcclxuICAgICAgLy9jb25zb2xlLmxvZyhwYXJba11bal0sIFwiazpcIiwgaywgXCJqOlwiLCBqLCBcImk6XCIsIGkpO1xyXG4gICAgICBpZiAocGFyW2tdID09IHVuZGVmaW5lZCB8fCBwYXJba10ubGVuZ3RoID09IDApIHtcclxuICAgICAgICBsKys7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBhcltrXVtqXVswXSAhPSAwICYmIHBhcltrXVtqXVswXSA8IGwpXHJcbiAgICAgICAgaisrO1xyXG4gICAgICB4ID0gaCAqIGltZ1cgKiA0ICsgaTtcclxuICAgICAgaWYgKHBbeF0gPiAyNTUpXHJcbiAgICAgICAgcFt4XSA9IDA7XHJcbiAgICAgIGxldCByID0gcGFyW2tdW2pdWzFdIC0gbCAqIDQ7XHJcbiAgICAgIC8vY29uc29sZS5sb2cocGFyW2tdW2pdWzFdLCBsKTtcclxuICAgICAgbGV0IHIyID0gKChyICogcikgLyAxMDAwICsgcFt4XSkgLyAxMDtcclxuICAgICAgcFt4XSA9IHIyLCBwW3ggKyAxXSA9IHIyLCBwW3ggKyAyXSA9IHIyO1xyXG4gICAgICBsKys7XHJcbiAgICB9XHJcbiAgICBrKys7XHJcbiAgfVxyXG59XHJcbiBcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcclxuICBjYW52YXMud2lkdGggPSBpbWdXICogMztcclxuICBjYW52YXMuaGVpZ2h0ID0gaW1nSDtcclxuXHJcbiAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuICBwaXhlbHMgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCBpbWdXLCBpbWdIKTtcclxuICBpbnZlcnRUb0JXKCk7XHJcblxyXG4gIGNvbnRleHQucHV0SW1hZ2VEYXRhKHBpeGVscywgMCwgMCk7XHJcbiAgcGl4ZWxzID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgaW1nVywgaW1nSCk7XHJcbiBcclxuICBnZXRTREYxKCk7XHJcbiAgZ2V0U0RGMigpO1xyXG4gIGNvbnRleHQucHV0SW1hZ2VEYXRhKHBpeGVscywgaW1nVywgMCk7XHJcbn0pO1xyXG5cclxuLypcclxubGV0IHM7XHJcbiAgZm9yIChqID0gMDsgaiA8IHBhci5sZW5ndGg7IGorKykge1xyXG4gICAgcHAgPSBwYXJbal07XHJcbiAgICBpID0gMDtcclxuICAgIHdoaWxlIChwcC5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGlmIChpID09IHBwLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIHMgPSAoKHBwW2ldWzFdICogcHBbaV1bMV0gKiAyIC0gKHBwW2kgKyAxXVsxXSAqIHBwW2kgKyAxXVsxXSAqIDIpKSAvICgyICogcHBbaV1bMV0gLSAyICogcHBbaSArIDFdWzFdKSk7XHJcbiAgICAgIC8vY29uc29sZS5sb2coYHMke3N9LCAke3BwW2ldWzFdfWApO1xyXG4gICAgICBpZiAocHBbaV1bMV0gPCBzKSB7XHJcbiAgICAgICAgcHBbaV1bMF0gPSBzO1xyXG4gICAgICAgIGkrKztcclxuICAgICAgfVxyXG5cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcHAgPSBwcC5yZW1vdmUocHBbaV0pO1xyXG4gICAgICAgIGktLTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICAgICovIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztFQUFBLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDekMsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztFQUMvQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ3RDLElBQUksTUFBTSxDQUFDO0VBQ1gsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN4QztFQUNBLFNBQVMsVUFBVSxHQUFHO0VBQ3RCLEVBQUUsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztFQUN0QixFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7RUFDeEMsSUFBSTtFQUNKLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ1gsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNoQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0VBQy9CLE1BQU07RUFDTixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7RUFDakIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztFQUNyQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0VBQ3JCLEtBQUssTUFBTTtFQUNYLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNmLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDbkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNuQixLQUFLO0VBQ0wsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztFQUNuQixHQUFHO0VBQ0gsQ0FBQztBQUNEO0FBQ0E7QUFDQTtFQUNBO0VBQ0EsU0FBUyxPQUFPLEdBQUc7RUFDbkIsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO0VBQ3RCLEVBQUUsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0VBQ2YsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDZCxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNYLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUMzQyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUN2QyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUM3QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDZCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDWixLQUFLO0VBQ0wsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHO0VBQ25CLE1BQU0sU0FBUztFQUNmLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQ25CLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsQyxNQUFNLENBQUMsRUFBRSxDQUFDO0VBQ1YsS0FBSztFQUNMLEdBQUc7QUFDSDtFQUNBLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDUixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUNuQyxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDaEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ1YsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtFQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdEcsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ25CLE1BQU0sQ0FBQyxFQUFFLENBQUM7RUFDVixPQUFPO0VBQ1AsS0FBSztFQUNMO0VBQ0EsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDWixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7RUFDM0MsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7RUFDeEQsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2pCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO0VBQ25ELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztFQUNwRCxNQUFNLFNBQVM7RUFDZixLQUFLO0VBQ0wsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0VBQzFELE1BQU0sQ0FBQyxFQUFFLENBQUM7RUFDVixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQzFDLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3JCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztFQUM1QyxHQUFHO0VBQ0gsQ0FBQztBQUNEO0FBQ0E7RUFDQTtFQUNBLFNBQVMsT0FBTyxHQUFHO0VBQ25CLEVBQUUsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztFQUN0QixFQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztFQUNmLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2QsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNqQixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQ3BDLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzdDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO0VBQ3RDLFFBQVEsQ0FBQyxFQUFFLENBQUM7RUFDWixRQUFRLFNBQVM7RUFDakIsT0FBTztFQUNQLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztFQUNWLE1BQU0sQ0FB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WUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ2xELEVBQUUsVUFBVSxFQUFFLENBQUM7QUFDZjtFQUNBLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3JDLEVBQUUsTUFBTSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDbEQ7RUFDQSxFQUFFLE9BQU8sRUFBRSxDQUFDO0VBQ1osRUFBRSxPQUFPLEVBQUUsQ0FBQztFQUNaLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3hDLENBQUMsQ0FBQyxDQUFDO0FBQ0g7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0FBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7Ozs7OyJ9
