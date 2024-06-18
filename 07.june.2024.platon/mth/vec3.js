class _vec3 {
  constructor(x, y, z) {
    if (typeof(x) != "number") {
      if (x == undefined) {
        return;
      }
      (this.x = x.x), (this.y = x.y), (this.z = x.z);
    }
    else if (y != undefined && z != undefined)
      (this.x = x), (this.y = y), (this.z = z);
    else (this.x = x), (this.y = x), (this.z = x);
  }

  //Vector3 add another
  vec3AddVec3(v) {
    return new _vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  //Vector3 substract another
  vec3SubVec3(v) {
    return new _vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  //Vector3 multiplicated by number
  vec3MulNum(n) {
    return new _vec3(this.x * n, this.y * n, this.z * n);
  }

  //Vector3 devided by number
  vec3DivNum(n) {
    if (n == 0) return;
    return new _vec3(this.x / n, this.y / n, this.z / n);
  }

  //Vector3 Negative
  vec3Neg() {
    return new _vec3(-this.x, -this.y, -this.z);
  }

  //Two vectors3 dot product
  vec3DotVec3(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  //Vector3 Lenght evaluation
  vec3Len() {
    let len = this.vec3DotVec3(this);
    if (len == 0 || len == 1) return len;
    return Math.sqrt(len);
  }

  //Vector3 Normalize
  vec3Normalize() {
    let len = this.vec3DotVec3(this);

    if (len == 1 || len == 0) return this;
    return this.vec3DivNum(Math.sqrt(len));
  }

  //Vector3 transfomation
  vec3Transform(m) {
    return new _vec3(
      this.x * m.a[0][0] + this.y * m.a[1][0] + this.z * m.a[2][0],
      this.x * m.a[0][1] + this.y * m.a[1][1] + this.z * m.a[2][1],
      this.x * m.a[0][2] + this.y * m.a[1][2] + this.z * m.a[2][2]
    );
  }

  //Vector3 by matrix multiplication (with homogenious devide)
  vec3MulMatr(m) {
    let w =
      this.x * m.a[0][3] + this.y * m.a[1][3] + this.z * m.a[2][3] + m.a[3][3];

    return new _vec3(
      (V.X * m.a[0][0] + this.y * m.a[1][0] + V.Z * m.a[2][0] + m.a[3][0]) / w,
      (V.X * m.a[0][1] + this.y * m.a[1][1] + V.Z * m.a[2][1] + m.a[3][1]) / w,
      (V.X * m.a[0][2] + this.y * m.a[1][2] + V.Z * m.a[2][2] + m.a[3][2]) / w
    );
  }

  //Cross product of two vectors
  vec3CrossVec3(v) {
    return new _vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  //Point by matrix transformation
  pointTransform(m) {
    let v = new _vec3(
      this.x * m.a[0][0] + this.y * m.a[1][0] + V.Z * m.a[2][0] + m.a[3][0],
      this.x * m.a[0][1] + this.y * m.a[1][1] + V.Z * m.a[2][1] + m.a[3][1],
      this.x * m.a[0][2] + this.y * m.a[1][2] + V.Z * m.a[2][2] + m.a[3][2]
    );

    return v;
  }
}

export function vec3(x, y, z) {
  return new _vec3(x, y, z);
}
