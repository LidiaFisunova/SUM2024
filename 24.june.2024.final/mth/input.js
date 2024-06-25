import { vec3 } from "./vec3.js";
import { mat4 } from "./mat4.js";

const D2R = degrees => degrees * Math.PI / 180;
const R2D = radians => radians * 180 / Math.PI;
 
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.clientX - p2.clientX, 2) + Math.pow(p1.clientY - p2.clientY, 2));
}
 
export class input {
  constructor(rnd) {
    //gl.canvas.addEventListener('click', (e) => this.onClick(e));
    rnd.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    rnd.canvas.addEventListener('mousewheel', (e) => this.onMouseWheel(e));
    rnd.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    rnd.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    rnd.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    if ('ontouchstart' in document.documentElement) {
      rnd.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
      rnd.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
      rnd.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    this.mX = 0;
    this.mY = 0;
    this.mZ = 0;
    this.mDx = 0;
    this.mDy = 0;
    this.mDz = 0;
    this.mButtons = [0, 0, 0, 0, 0];
    this.mButtonsOld = [0, 0, 0, 0, 0];
    this.mButtonsClick = [0, 0, 0, 0, 0];
    
    // Zoom specific
    this.scaling = false;
    this.dist = 0;
    this.scale_factor = 1.0;
    this.curr_scale = 1.0;
    this.max_zoom = 8.0;
    this.min_zoom = 0.5;
    
    
    this.keys = [];
    this.keysOld = [];
    this.keysClick = [];
    [
      "Enter", "Backspace",
      "Delete", "Space", "Tab", "Escape", "ArrowLeft", "ArrowUp", "ArrowRight",
      "ArrowDown", "Shift", "Control", "Alt", "ShiftLeft", "ShiftRight", "ControlLeft",
      "ControlRight", "PageUp", "PageDown", "End", "Home",
      "Digit0", "Digit1",
      "KeyA",
      "Numpad0", "NumpadMultiply",
      "F1",
    ].forEach(key => {
      this.keys[key] = 0;
      this.keysOld[key] = 0;
      this.keysClick[key] = 0;
    });
 
    this.shiftKey = false;
    this.altKey = false;
    this.ctrlKey = false;
 
    this.isFirst = true;
  } // End of 'constructor' function
 
  /// Mouse handle functions
 
  onClick(e) {
    //cria
  } // End of 'onClick' function
  
  onTouchStart(e) {
    if (e.touches.length == 1)
      this.mButtons[0] = 1;
    else if (e.touches.length == 2) {
      this.mButtons[0] = 0;
      this.mButtons[2] = 1;
    }
    else {
      this.mButtons[0] = 0;
      this.mButtons[2] = 0;
      this.mButtons[1] = 1;
    }
    let
      x = e.targetTouches[0].pageX - e.target.offsetLeft,
      y = e.targetTouches[0].pageY - e.target.offsetTop;
    this.mDx = 0;
    this.mDy = 0;
    this.mDz = 0;
    this.mX = x;
    this.mY = y;
 
    let tt = e.targetTouches;
    if (tt.length >= 2) {
      this.dist = distance(tt[0], tt[1]);
      this.scaling = true;
    } else {                    
      this.scaling = false;
    }
  } // End of 'onTouchStart' function
 
  onTouchMove(e) {
    e.preventDefault();
 
    let
      x = e.targetTouches[0].pageX - e.target.offsetLeft,
      y = e.targetTouches[0].pageY - e.target.offsetTop;
 
    let tt = e.targetTouches;

    if (this.scaling) {                                             
      this.mDz = 0;
      this.curr_scale = (distance(tt[0], tt[1]) / this.dist) * this.scale_factor;
 
      let d = distance(tt[0], tt[1]);
      if (Math.abs(d - this.dist) > 0) {//47) {
        if (d < this.dist)
          this.mDz = 1 * (d / this.dist), this.dist = d;
        else if (d > this.dist)
          this.mDz = -1 * (this.dist / d), this.dist = d;
        this.mZ += this.mDz;
 
        this.mDx = x - this.mX;
        this.mDy = y - this.mY;
        this.mX = x;
        this.mY = y;
        return;
      }
    }
 
    if (this.mButtons[1] == 1) {
      this.mDx = 0;
      this.mDy = 0;
      this.mDz = y - this.mZ;
      this.mX = x;
      this.mY = y;
      this.mZ += this.mDz;
    } else {
      this.mDx = x - this.mX;
      this.mDy = y - this.mY;
      this.mDz = 0;
      this.mX = x;
      this.mY = y;
    }  
  } // End of 'onTouchMove' function
 
  onTouchEnd(e) {
    this.mButtons[0] = 0;
    this.mButtons[1] = 0;
    this.mButtons[2] = 0;
    let
      x = e.targetTouches[0].pageX - e.target.offsetLeft,
      y = e.targetTouches[0].pageY - e.target.offsetTop;
    this.mDx = 0;
    this.mDy = 0;
    this.mDz = 0;
    this.mX = x;
    this.mY = y;
 
    let tt = e.targetTouches;
    if (tt.length < 2) {
      this.scaling = false;
      if (this.curr_scale < this.min_zoom) {
        this.scale_factor = this.min_zoom;
      } else {
        if (this.curr_scale > this.max_zoom) {
          this.scale_factor = this.max_zoom; 
        } else {
          this.scale_factor = this.curr_scale;
        }
      }
    } else {
      this.scaling = true;
    }
  } // End of 'onTouchMove' function
 
  onMouseMove(e) {
    let
      dx = e.movementX,
      dy = e.movementY;
    this.mDx = dx;
    this.mDy = dy;
    this.mDz = 0;
    this.mX += dx;
    this.mY += dy;
  } // End of 'onMouseMove' function
 
  onMouseWheel(e) {
    if (e.wheelDelta != 0)
      e.preventDefault();
    this.mZ += (this.mDz = e.wheelDelta / 120);
  } // End of 'onMouseWheel' function
 
  onMouseDown(e) {
    e.preventDefault();
    this.mDx = 0;
    this.mDy = 0;
    this.mDz = 0;
 
    this.mButtonsOld[e.button] = this.mButtons[e.button];
    this.mButtons[e.button] = 1;
    this.mButtonsClick[e.button] = !this.mButtonsOld[e.button] && this.mButtons[e.button];
    
    this.shiftKey = e.shiftKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
  } // End of 'onMouseMove' function
  
  onMouseUp(e) {
    e.preventDefault();
    this.mDx = 0;
    this.mDy = 0;
    this.mDz = 0;
 
    this.mButtonsOld[e.button] = this.mButtons[e.button];
    this.mButtons[e.button] = 0;
    this.mButtonsClick[e.button] = 0;
 
    this.shiftKey = e.shiftKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
  } // End of 'onMouseMove' function
 
  /// Keyboard handle
  onKeyDown(e) {
    if (e.target.tagName.toLowerCase() == 'textarea')
      return;
    let focused_element = null;
    if (document.hasFocus() &&
        document.activeElement !== document.body &&
        document.activeElement !== document.documentElement) {
      focused_element = document.activeElement;
      if (focused_element.tagName.toLowerCase() == 'textarea')
        return;
    }      
    if (e.code != "F12" && e.code != "F11" && e.code != "KeyR")
      e.preventDefault();
    this.keysOld[e.code] = this.keys[e.code];
    this.keys[e.code] = 1;
    this.keysClick[e.code] = !this.keysOld[e.code] && this.keys[e.code];
    
    this.shiftKey = e.shiftKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
  } // End of 'onKeyDown' function
  
  onKeyUp(e) {
    if (e.target.tagName.toLowerCase() == 'textarea')
      return;
    let focused_element = null;
    if (document.hasFocus() &&
        document.activeElement !== document.body &&
        document.activeElement !== document.documentElement) {
      focused_element = document.activeElement;
      if (focused_element.tagName.toLowerCase() == 'textarea')
        return;
    }      
    if (e.code != "F12" && e.code != "F11" && e.code != "KeyR")
      e.preventDefault();
    this.keysOld[e.code] = this.keys[e.code];
    this.keys[e.code] = 0;
    this.keysClick[e.code] = 0;
 
    this.shiftKey = e.shiftKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
  } // End of 'onKeyUp' function
  
  /// Camera movement handling
  reset() {
    this.mDx = 0;
    this.mDy = 0;
    this.mDz = 0;
    this.mButtonsClick.forEach(k => this.mButtonsClick[k] = 0);
    this.keysClick.forEach(k => this.keysClick[k] = 0);
 
    this.shiftKey = this.keys["ShiftLeft"] || this.keys["ShiftRight"];
    this.altKey = this.keys["AltLeft"] || this.keys["AltRight"];
    this.ctrlKey = this.keys["ControlLeft"] || this.keys["ControlRight"];
  } // End of reset' function
          
  responseCamera(rnd) {
    if (this.shiftKey && this.keysClick["KeyF"]) {
      rnd.cam = rnd.cam.camSet(vec3(6), vec3(0), vec3(0, 1, 0));
      return;
    }
    if (this.ctrlKey) {
      // Handle camera orientation
      let
        Dist = rnd.cam.at.sub(rnd.cam.loc).len(),
        cosT = (rnd.cam.loc.y - rnd.cam.at.y) / Dist,
        sinT = Math.sqrt(1 - cosT * cosT),
        plen = Dist * sinT,
        cosP = (rnd.cam.loc.z - rnd.cam.at.z) / plen,
        sinP = (rnd.cam.loc.x - rnd.cam.at.x) / plen,
        azimuth = R2D(Math.atan2(sinP, cosP)),
        elevator = R2D(Math.atan2(sinT, cosT));
 
      azimuth += rnd.timer.globalDeltaTime * 3 *
        (-30 * this.mButtons[0] * this.mDx +
         47 * (this.keys["ArrowLeft"] - this.keys["ArrowRight"]));
 
      elevator += rnd.timer.globalDeltaTime * 2 *
        (-30 * this.mButtons[0] * this.mDy +
         47 * (this.keys["ArrowUp"] - this.keys["ArrowDown"]));
      if (elevator < 0.08)
        elevator = 0.08;
      else if (elevator > 178.90)
        elevator = 178.90;
 
      Dist += rnd.timer.globalDeltaTime * (1 + this.shiftKey * 18) *
        (8 * this.mDz +
         8 * (this.keys["PageUp"] - this.keys["PageDown"]));
      if (Dist < 0.1)
        Dist = 0.1;
 
      /* Handle camera position */
      if (this.mButtons[2]) {
        let Wp = rnd.cam.projSize;
        let Hp = rnd.cam.projSize;
        if (rnd.cam.frameW > rnd.cam.frameH)
          Wp *= rnd.cam.frameW / rnd.cam.frameH;
        else
          Hp *= rnd.cam.frameH / rnd.cam.frameW;
        let sx = -this.mDx * Wp / rnd.cam.frameW * Dist / rnd.cam.projDist;
        let sy = this.mDy * Hp / rnd.cam.frameH * Dist / rnd.cam.projDist;
 
        let dv = rnd.cam.right.mulNum(sx).add(rnd.cam.up.mulNum(sy));
        rnd.cam.at = rnd.cam.at.add(dv);
        rnd.cam.loc = rnd.cam.loc.add(dv);
      }

      let loc = mat4().matrRotate(elevator, vec3(1, 0, 0)).matrMulMatr2(
                      mat4().matrRotate(azimuth, vec3(0, 1, 0)).matrMulMatr2( 
                        mat4().matrTranslate(rnd.cam.at))).transformPoint(vec3(0, Dist, 0))
      /* Setup result camera */
      rnd.cam = rnd.cam.camSet(loc,
                          rnd.cam.at,
                          vec3(0, 1, 0)
                          );
      //                   matrRotate(azimuth, vec3(0, 1, 0)).matrMulMatr2( 
      //                   matrTranslate(rnd.cam.at))).transformPoint(vec3(0, Dist, 0)),
      //           rnd.cam.at,
      //           vec3(0, 1, 0)
      //           );
    }
  } // End of 'responseсCamera' function
} // End of 'input' class

export function input_init(rnd) {
    return new input(rnd);
}