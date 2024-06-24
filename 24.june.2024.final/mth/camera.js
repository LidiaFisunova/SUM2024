import { vec3 } from "./vec3";
import { mat4 } from "./mat4";

class _camera {
    constructor(w, h) {
        this.at = vec3(0, 0, 0);
        this.loc = vec3(5, 5, 5);
        this.up = vec3(0, 1, 0);
        this.matrView = null, this.matrVP = null;
        this.dir = null, this.right = null;
        if (h == undefined)
            h = w;
        this.frameW = w, this.frameH = h; 
    }

    camSet(loc, at, up) {
        if (loc == undefined)
            loc = this.loc;
        else {
            this.loc = loc;
        }
        if (at == undefined)
            at = this.at;
        else {
            this.at = at;
        }
        if (up == undefined)
            up = this.up;
        else {
            this.up = up;
        }

        this.matrView = mat4().matrView(loc, at, up);

        this.right = vec3(this.matrView.a[0][0],
            this.matrView.a[1][0],
            this.matrView.a[2][0]);
        this.up = vec3(this.matrView.a[0][1],
            this.matrView.a[1][1],
            this.matrView.a[2][1]);
        this.dir = vec3(-this.matrView.a[0][2],
                            -this.matrView.a[1][2],
                            -this.matrView.a[2][2]);
        return this;
    }

    camSetProj(projSize, ProjDist, ProjFarClip) {
        let rx, ry;

        this.projDist = ProjDist;
        this.projFarClip = ProjFarClip;
        rx = ry = this.projSize = projSize;
      
        /* Correct aspect ratio */
        if (this.frameW >= this.frameH)
          rx *= this.frameW / this.frameH;
        else
          ry *= this.frameH / this.frameW;
      
        this.wp = rx;
        this.hp = ry;
        this.matrProj =
          mat4().matrFrustum(-rx / 2, rx / 2, -ry / 2, ry / 2,
            this.projDist, this.projFarClip);
        this.matrVP = this.matrView.matrMulMatr2(this.matrProj);      

        return this;
    }
}

export function camera(w, h) {
    return new _camera(w, h); 
}