import {vec3} from "./vec3"

class _mat4 {
  constructor() {
    this.a = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  toArray() {
    let t = this.a;
    return [].concat(t[0]).concat(t[1]).concat(t[2]).concat(t[3]);
  }

  //Translate matrix
  matrTranslate(v) {
    let m = new _mat4();
    m.a = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [v.x, v.y, v.z, 1],
    ];
    return m;
  }

  //Multiplying two matrixes
  matrMulMatr2(m) {
    let r = new _mat4();

    r.a[0][0] =
      this.a[0][0] * m.a[0][0] +
      this.a[0][1] * m.a[1][0] +
      this.a[0][2] * m.a[2][0] +
      this.a[0][3] * m.a[3][0];

    r.a[0][1] =
      this.a[0][0] * m.a[0][1] +
      this.a[0][1] * m.a[1][1] +
      this.a[0][2] * m.a[2][1] +
      this.a[0][3] * m.a[3][1];

    r.a[0][2] =
      this.a[0][0] * m.a[0][2] +
      this.a[0][1] * m.a[1][2] +
      this.a[0][2] * m.a[2][2] +
      this.a[0][3] * m.a[3][2];

    r.a[0][3] =
      this.a[0][0] * m.a[0][3] +
      this.a[0][1] * m.a[1][3] +
      this.a[0][2] * m.a[2][3] +
      this.a[0][3] * m.a[3][3];

    r.a[1][0] =
      this.a[1][0] * m.a[0][0] +
      this.a[1][1] * m.a[1][0] +
      this.a[1][2] * m.a[2][0] +
      this.a[1][3] * m.a[3][0];

    r.a[1][1] =
      this.a[1][0] * m.a[0][1] +
      this.a[1][1] * m.a[1][1] +
      this.a[1][2] * m.a[2][1] +
      this.a[1][3] * m.a[3][1];

    r.a[1][2] =
      this.a[1][0] * m.a[0][2] +
      this.a[1][1] * m.a[1][2] +
      this.a[1][2] * m.a[2][2] +
      this.a[1][3] * m.a[3][2];

    r.a[1][3] =
      this.a[1][0] * m.a[0][3] +
      this.a[1][1] * m.a[1][3] +
      this.a[1][2] * m.a[2][3] +
      this.a[1][3] * m.a[3][3];

    r.a[2][0] =
      this.a[2][0] * m.a[0][0] +
      this.a[2][1] * m.a[1][0] +
      this.a[2][2] * m.a[2][0] +
      this.a[2][3] * m.a[3][0];

    r.a[2][1] =
      this.a[2][0] * m.a[0][1] +
      this.a[2][1] * m.a[1][1] +
      this.a[2][2] * m.a[2][1] +
      this.a[2][3] * m.a[3][1];

    r.a[2][2] =
      this.a[2][0] * m.a[0][2] +
      this.a[2][1] * m.a[1][2] +
      this.a[2][2] * m.a[2][2] +
      this.a[2][3] * m.a[3][2];

    r.a[2][3] =
      this.a[2][0] * m.a[0][3] +
      this.a[2][1] * m.a[1][3] +
      this.a[2][2] * m.a[2][3] +
      this.a[2][3] * m.a[3][3];

    r.a[3][0] =
      this.a[3][0] * m.a[0][0] +
      this.a[3][1] * m.a[1][0] +
      this.a[3][2] * m.a[2][0] +
      this.a[3][3] * m.a[3][0];

    r.a[3][1] =
      this.a[3][0] * m.a[0][1] +
      this.a[3][1] * m.a[1][1] +
      this.a[3][2] * m.a[2][1] +
      this.a[3][3] * m.a[3][1];

    r.a[3][2] =
      this.a[3][0] * m.a[0][2] +
      this.a[3][1] * m.a[1][2] +
      this.a[3][2] * m.a[2][2] +
      this.a[3][3] * m.a[3][2];

    r.a[3][3] =
      this.a[3][0] * m.a[0][3] +
      this.a[3][1] * m.a[1][3] +
      this.a[3][2] * m.a[2][3] +
      this.a[3][3] * m.a[3][3];

    return r;
  }

  //Multiplying three matrixes
  matrMulMatr3(m1, m2) {
    return this.matrMulMatr2(m1.matrMulMatr2(m2));
  }

  MatrInverse() {
    let r = new _mat4();
    let det = matrDeterm(M);

    if (det == 0) return r;

    /* build adjoint matrix */
    r.a[0][0] =
      +matrDeterm3x3(
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[1][0] =
      -matrDeterm3x3(
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[2][0] =
      +matrDeterm3x3(
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;

    r.a[3][0] =
      -matrDeterm3x3(
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r.a[0][1] =
      -matrDeterm3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[1][1] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[2][1] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;

    r.a[3][1] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r.a[0][2] =
      +matrDeterm3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[1][2] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[2][2] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;

    r.a[3][2] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r.a[0][3] =
      -matrDeterm3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3]
      ) / det;

    r.a[1][3] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3]
      ) / det;

    r.a[2][3] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3]
      ) / det;

    r.a[3][3] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2]
      ) / det;

    return r;
  }

  //Rotation matrix
  matrRotate(angle, v) {
    let a = angle * 3.1415926535897932 / 180,
      s = Math.sin(a),
      c = Math.cos(a);

    let r = new _mat4();
    r.a = [
      [
        c + v.x * v.x * (1 - c),
        v.y * v.x * (1 - c) - v.z * s,
        v.z * v.x * (1 - c) + v.y * s,
        0,
      ],
      [
        v.x * v.y * (1 - c) + v.z * s,
        c + v.y * v.y * (1 - c),
        v.z * v.y * (1 - c) - v.x * s,
        0,
      ],
      [
        v.x * v.z * (1 - c) - v.y * s,
        v.y * v.z * (1 - c) + v.x * s,
        c + v.z * v.z * (1 - c),
        0,
      ],
      [0, 0, 0, 1],
    ];
    return r;
  }

  //View matrix
  matrView(loc, at, up1) {
    let dir = at.sub(loc).normalize(),
      right = dir.cross(up1).normalize(),
      up = right.cross(dir).normalize();
    let m = new _mat4();
    m.a = [
      [right.x, up.x, -dir.x, 0],
      [right.y, up.y, -dir.y, 0],
      [right.z, up.z, -dir.z, 0],
      [-loc.dot(right), -loc.dot(up), loc.dot(dir), 1],
    ];
    return m;
  }

  //Frustum matrix
  matrFrustum(l, r, b, t, n, f) {
    let m = new _mat4();
    m.a = [
      [(2 * n) / (r - l), 0, 0, 0],
      [0, (2 * n) / (t - b), 0, 0],
      [(r + l) / (r - l), (t + b) / (t - b), -((f + n) / (f - n)), -1],
      [0, 0, -((2 * n * f) / (f - n)), 0],
    ];
    return m;
  }

  //Transpose matrix
  matrTranspose() {
    let m = new _mat4();

    (m.a = [m.a[0][0], m.a[1][0], m.a[2][0], m.a[3][0]]),
      [m.a[0][1], m.a[1][1], m.a[2][1], m.a[3][1]],
      [m.a[0][2], m.a[1][2], m.a[2][2], m.a[3][2]],
      [m.a[0][3], m.a[1][3], m.a[2][3], m.a[3][3]];
    return m;
  }

  //Ratation by X matrix
  matrRotateX(angleInDegree) {
    let a = angleInDegree * 3.1415926535897932 / 180,
      si = Math.sin(a),
      co = Math.cos(a),
      m = new _mat4();

    m.a = [
      [1, 0, 0, 0],
      [0, co, si, 0],
      [0, -si, co, 0],
      [0, 0, 0, 1],
    ];
    return m;
  }

  //Rotation by Y matrix
  matrRotateY(angleInDegree) {
    let a = angleInDegree * 3.1415926535897932 / 180,
      si = Math.sin(a),
      co = Math.cos(a),
      m = new _mat4();

    m.a = [
      [co, 0, -si, 0],
      [0, 1, 0, 0],
      [si, 0, co, 0],
      [0, 0, 0, 1],
    ];
    return m;
  }

  //Rotation by Z matrix
  matrRotateZ(angleInDegree) {
    let a = angleInDegree * 3.1415926535897932 / 180,
      si = Math.sin(a),
      co = Math.cos(a),
      m = new _mat4();

    m.a = [
      [co, si, 0, 0],
      [-si, co, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    return m;
  }

  //Scale matrix
  matrScale(v) {
    let m = new _mat4();

    m.a = [
      [v.x, 0, 0, 0],
      [0, v.y, 0, 0],
      [0, 0, v.z, 0],
      [0, 0, 0, 1],
    ];
    return m;
  }

  matrOrtho(l, r, b, t, n, f) {
    let m = new _mat4();

    m.a = [
      [2 / (r - l), 0, 0, 0],
      [0, 2 / (t - b), 0, 0],
      [0, 0, -2 / (f - n), 0],
      [-(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1],
    ];
    return m;
  }
  //Point by matrix transformation
  transformPoint(v) {
    let ve = vec3(
      v.x * this.a[0][0] + v.y * this.a[1][0] + v.z * this.a[2][0] + this.a[3][0],
      v.x * this.a[0][1] + v.y * this.a[1][1] + v.z * this.a[2][1] + this.a[3][1],
      v.x * this.a[0][2] + v.y * this.a[1][2] + v.z * this.a[2][2] + this.a[3][2]
    );

    return ve;
  }
}

function matrDeterm3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
  return (
    a11 * a22 * a33 +
    a12 * a23 * a31 +
    a13 * a21 * a32 -
    a11 * a23 * a32 -
    a12 * a21 * a33 -
    a13 * a22 * a31
  );
}

function matrDeterm(m) {
  let d =
    +this.a[0][0] *
      matrDeterm3x3(
        m.a[1][1],
        m.a[1][2],
        m.a[1][3],
        m.a[2][1],
        m.a[2][2],
        m.a[2][3],
        m.a[3][1],
        m.a[3][2],
        m.a[3][3]
      ) +
    -m.a[0][1] *
      matrDeterm3x3(
        m.a[1][0],
        m.a[1][2],
        m.a[1][3],
        m.a[2][0],
        m.a[2][2],
        m.a[2][3],
        m.a[3][0],
        m.a[3][2],
        m.a[3][3]
      ) +
    +m.a[0][2] *
      matrDeterm3x3(
        m.a[1][0],
        m.a[1][1],
        m.a[1][3],
        m.a[2][0],
        m.a[2][1],
        m.a[2][3],
        m.a[3][0],
        m.a[3][1],
        m.a[3][3]
      ) +
    -m.a[0][3] *
      matrDeterm3x3(
        m.a[1][0],
        m.a[1][1],
        m.a[1][2],
        m.a[2][0],
        m.a[2][1],
        m.a[2][2],
        m.a[3][0],
        m.a[3][1],
        m.a[3][2]
      );
  return d;
}

export function mat4() {
  return new _mat4();
}
