(function (exports) {
  'use strict';

  class _buffer {
    constructor(type, size, gl) {
      this.type = type; // Buffer type (gl.***_BUFFER)
      this.size = size; // Buffer size in bytes
      this.id = null;
      this.gl = gl;
      if (size == 0 || type == undefined) return;
      this.id = gl.createBuffer();
      gl.bindBuffer(type, this.id);
      gl.bufferData(type, size, gl.STATIC_DRAW);
    }
    update(data) {}
  }

  class _vertex_buffer extends _buffer {
    constructor(vArray, gl) {
      const n = vArray.length;
      super(gl.ARRAY_BUFFER, n * 4, gl);
      gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id);
      gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(vArray),
        this.gl.STATIC_DRAW
      );
    }
    apply(Loc, size, offset) {
      this.gl.vertexAttribPointer(Loc, 3, this.gl.FLOAT, false, size, offset);
      this.gl.enableVertexAttribArray(Loc);
    }
  }
  function vertex_buffer(...args) {
    return new _vertex_buffer(...args);
  } // End of 'vertex_buffer' function

  class _index_buffer extends _buffer {
    constructor(iArray, gl) {
      const n = iArray.length;
      super(gl.ELEMENT_ARRAY_BUFFER, n * 4, gl);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint32Array(iArray),
        this.gl.STATIC_DRAW
      );
    }
  }
  function index_buffer(...args) {
    return new _index_buffer(...args);
  } // End of 'ubo_buffer' function

  function cubeCreate() {
    /* let sx = 0 + side,
      sy = pos.y + side,
      sz = pos.z - side; */
    let p = [
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
    ];

    let n = [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
      [1, 1, -1],
      [1, -1, -1],
      [-1, -1, -1],
    ];
    let vertexes = [],
      j = 0;
    while (j < 8) {
      vertexes[j] = [
        ...p[j],
        n[j][0],
        0,
        0,
        ...p[j],
        0,
        n[j][1],
        0,
        ...p[j],
        0,
        0,
        n[j][2],
      ];
      j++;
    }
    let ind = [
      2, 11, 5, 8, 6, 3, 15, 18, 19, 22, 4, 1, 0, 9, 21, 12, 14, 17, 23, 20, 23,
      14, 17, 16, 13, 7, 10,
    ];

    vertexes = [
      ...vertexes[0],
      ...vertexes[1],
      ...vertexes[2],
      ...vertexes[3],
      ...vertexes[4],
      ...vertexes[5],
      ...vertexes[6],
      ...vertexes[7],
    ];

    return [vertexes, ind];
  }

  function earthCreate() {
      let vertexes = [], w = 20, h = 20,
        i, j, theta, phi, G = [], ind = [];
      let pi = Math.acos(-1);
      
      for (i = 0, theta = 0; i < h; i++, theta += pi / (h - 1)) {
          for (j = 0, phi = 0; j < w; j++, phi += 2 * pi / (w - 1)) {
              G[j] = Math.sin(theta) * Math.sin(phi);
              G[j + 1] = Math.cos(theta);
              G[j + 2] = Math.sin(theta) * Math.cos(phi);
          }
          vertexes = vertexes.concat(...G);
      }

      for (i = 0; i < h; i++) {
          for (j = 0; j < w - 1; j += 4) {
              ind[i * h + j] = i * h + j;
              ind[i * h + j + 1] = i * h + j + 1;
              ind[i * h + j + 2] = (i + 1) * h + j;
              ind[i * h + j + 3] = (i + 1) * h + j + 1;
          }
      }
      return [vertexes, ind];
  }

  class _shader {
    async _init(name, gl) {
      this.gl = gl;
      this.name = name;
      this.id = null;
      this.shaders = [
        {
          id: null,
          type: this.gl.VERTEX_SHADER,
          name: "vert",
          src: "",
        },
        {
          id: null,
          type: this.gl.FRAGMENT_SHADER,
          name: "frag",
          src: "",
        },
      ];
      for (const s of this.shaders) {
        let response = await fetch(`bin/shaders/${name}/${s.name}.glsl`);
        let src = await response.text();
        if (typeof src == "string" && src != "") s.src = src;
      }
      // recompile shaders
      this.updateShadersSource();
    }
    updateShadersSource() {
      this.shaders[0].id = null;
      this.shaders[1].id = null;
      this.id = null;
      if (this.shaders[0].src == "" || this.shaders[1].src == "") return;
      for (const s of this.shaders) {
        s.id = this.gl.createShader(s.type);
        this.gl.shaderSource(s.id, s.src);
        this.gl.compileShader(s.id);
        if (!this.gl.getShaderParameter(s.id, this.gl.COMPILE_STATUS)) {
          let buf = this.gl.getShaderInfoLog(s.id);
          console.log(`Shader ${this.name}/${s.name} compile fail: ${buf}`);
        }
      }
      this.id = this.gl.createProgram();

      for (const s of this.shaders) {
        if (s.id != null) this.gl.attachShader(this.id, s.id);
      }
      let prg = this.id;
      this.gl.linkProgram(prg);
      if (!this.gl.getProgramParameter(prg, this.gl.LINK_STATUS)) {
        let buf = this.gl.getProgramInfoLog(prg);
        console.log(`Shader program ${this.name} link fail: ${buf}`);
      }
      this.updateShaderData();
    }
    updateShaderData() {
      // Shader attributes
      this.attrs = {};
      const countAttrs = this.gl.getProgramParameter(
        this.id,
        this.gl.ACTIVE_ATTRIBUTES
      );
      for (let i = 0; i < countAttrs; i++) {
        const info = this.gl.getActiveAttrib(this.id, i);
        this.attrs[info.name] = {
          name: info.name,
          type: info.type,
          size: info.size,
          loc: this.gl.getAttribLocation(this.id, info.name),
        };
      }

      // Shader uniforms
      this.uniforms = {};
      const countUniforms = this.gl.getProgramParameter(
        this.id,
        this.gl.ACTIVE_UNIFORMS
      );
      for (let i = 0; i < countUniforms; i++) {
        const info = this.gl.getActiveUniform(this.id, i);
        this.uniforms[info.name] = {
          name: info.name,
          type: info.type,
          size: info.size,
          loc: this.gl.getUniformLocation(this.id, info.name),
        };
      }

      // Shader uniform blocks
      this.uniformBlocks = {};
      const countUniformBlocks = this.gl.getProgramParameter(
        this.id,
        this.gl.ACTIVE_UNIFORM_BLOCKS
      );
      for (let i = 0; i < countUniformBlocks; i++) {
        const block_name = this.gl.getActiveUniformBlockName(this.id, i);
        const index = this.gl.getActiveUniformBlockIndex(this.id, block_name);
        this.uniformBlocks[block_name] = {
          name: block_name,
          index: index,
          size: this.gl.getActiveUniformBlockParameter(
            this.id,
            idx,
            this.gl.UNIFORM_BLOCK_DATA_SIZE
          ),
          bind: this.gl.getActiveUniformBlockParameter(
            this.id,
            idx,
            this.gl.UNIFORM_BLOCK_BINDING
          ),
        };
      }
    }
    constructor(name, gl) {
      this._init(name, gl);
    }
    apply() {
      if (this.id != null) this.gl.useProgram(this.id);
    }
  }
  function shader(name, gl) {
    return new _shader(name, gl);
  }
  /*
  let src = document.getElementById("shdVertSrc").value;
  shd.shaders[0].src = src;
  shd.updateShadersSource();
  */

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
    add(v) {
      return new _vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    //Vector3 substract another
    sub(v) {
      return new _vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    //Vector3 multiplicated by number
    mulNum(n) {
      return new _vec3(this.x * n, this.y * n, this.z * n);
    }

    //Vector3 devided by number
    divNum(n) {
      if (n == 0) return;
      return new _vec3(this.x / n, this.y / n, this.z / n);
    }

    //Vector3 Negative
    neg() {
      return new _vec3(-this.x, -this.y, -this.z);
    }

    //Two vectors3 dot product
    dot(v) {
      return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    //Vector3 Lenght evaluation
    len() {
      let len = this.dot(this);
      if (len == 0 || len == 1) return len;
      return Math.sqrt(len);
    }

    //Vector3 Normalize
    normalize() {
      let len = this.dot(this);

      if (len == 1 || len == 0) return this;
      return this.divNum(Math.sqrt(len));
    }

    //Vector3 transfomation
    transform(m) {
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
    cross(v) {
      return new _vec3(
        this.y * v.z - this.z * v.y,
        this.z * v.x - this.x * v.z,
        this.x * v.y - this.y * v.x
      );
    }

    //Point by matrix transformation
    pointTransform(m) {
      let v = new _vec3(
        this.x * m.a[0][0] + this.y * m.a[1][0] + v.z * m.a[2][0] + m.a[3][0],
        this.x * m.a[0][1] + this.y * m.a[1][1] + v.z * m.a[2][1] + m.a[3][1],
        this.x * m.a[0][2] + this.y * m.a[1][2] + v.z * m.a[2][2] + m.a[3][2]
      );

      return v;
    }
  }

  function vec3(x, y, z) {
    return new _vec3(x, y, z);
  }

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

  function mat4() {
    return new _mat4();
  }

  class _material {
    constructor(shd, ubo) {
      this.shader = shd;
      this.ubo = ubo;
    }
  }

  class _prim {
    constructor(gl, name, type, shd_name, pos, VBuf, IBuf, VA, noofI, noofV, side) {
      this.name = name;
      (this.VBuf = VBuf), (this.IBuf = IBuf), (this.VA = VA); /* render info */
      this.type = type; /* platon figure type */
      this.pos = pos; /* position */

      this.side = side;
      let shd = shader(shd_name, gl);
      this.mtl = new _material(shd, null);
      this.shdIsLoaded = null;
      this.noofI = noofI;
      this.noofV = noofV;
      this.gl = gl;
      this.matrWourld = mat4();
    }

    updatePrimData(timer) {

      if (this.mtl.shader.uniforms["matrWorld"] == undefined)
        return;
      let mr, m1;
      if (this.type == "earth") {
        m1 = mat4().matrMulMatr2(mat4().matrRotateY(30 * timer.globalTime)).matrMulMatr2(mat4().matrScale(vec3(3, 3, 3)));  
      }
      else {
        mr = mat4().matrScale(vec3(this.side));
        m1 = mat4().matrTranslate(this.pos).matrMulMatr2(mr).matrMulMatr2(mat4().matrRotateY(30 * timer.globalTime));
      }
      let arr1 = m1.toArray();
      let mWLoc = this.mtl.shader.uniforms["matrWorld"].loc;
      this.gl.uniformMatrix4fv(mWLoc, false, arr1);
    }

    render(timer) {
      let gl = this.gl;
      if (this.noofI != null) {
        if (this.mtl.shdIsLoaded == null) {
          this.updatePrimData(timer);
          if (this.mtl.shader.attrs["InNormal"] == undefined)
            this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 12, 0);
          else {
            this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
            this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
          }
          this.mtl.shader.updateShaderData();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
        gl.bindVertexArray(this.VA.id);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
        gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
      } else {
        if (this.mtl.shdIsLoaded == null) {
          this.updatePrimData(timer);
          if (this.mtl.shader.attrs["InNormal"] == undefined)
            this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 12, 0);
          else {
            this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
            this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
          }
          this.mtl.shader.updateShaderData();
        }
        gl.bindVertexArray(this.VA.id);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.noofV);
      }
    }
  }

  function primCreate(name, type, mtl, pos, side=3, gl) {
    let vi;
    if (type == "cube") vi = cubeCreate();
    if (type == "earth") vi = earthCreate();
    let vert = vi[0],
      ind = vi[1];

    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let vertexBuffer = vertex_buffer(vert, gl), indexBuffer, indlen;

    if (ind != null)
      indexBuffer = index_buffer(ind, gl), indlen = ind.length;
    else indexBuffer = null, indlen = null;

    return new _prim(
      gl,
      name,
      type,
      mtl,
      pos,
      vertexBuffer,
      indexBuffer,
      vertexArray,
      indlen,
      vert.length,
      side
    );
  }

  class _timer {
    // Timer obtain current time in seconds method
    getTime() {
      const date = new Date();
      let t =
        date.getMilliseconds() / 1000.0 +
        date.getSeconds() +
        date.getMinutes() * 60;
      return t;
    };

    // Timer response method
    response() {
      let t = this.getTime();
      // Global time
      this.globalTime = t;
      this.globalDeltaTime = t - this.oldTime;
      // Time with pause
      if (this.isPause) {
        this.localDeltaTime = 0;
        this.pauseTime += t - this.oldTime;
      } else {
        this.localDeltaTime = this.globalDeltaTime;
        this.localTime = t - this.pauseTime - this.startTime;
      }
      // FPS
      this.frameCounter++;
      if (t - this.oldTimeFPS > 3) {
        this.FPS = this.frameCounter / (t - this.oldTimeFPS);
        this.oldTimeFPS = t;
        this.frameCounter = 0;
        //if (tag_id != null)
        //  document.getElementById(tag_id).innerHTML = this.getFPS();
      }
      this.oldTime = t;
    };
   
    constructor() {
      // Fill timer global data
      this.globalTime = this.localTime = this.getTime();
      this.globalDeltaTime = this.localDeltaTime = 0;
    
      // Fill timer semi global data
      this.startTime = this.oldTime = this.oldTimeFPS = this.globalTime;
      this.frameCounter = 0;
      this.isPause = false;
      this.FPS = 30.0;
      this.pauseTime = 0;
    }
    // Obtain FPS as string method
    getFPS = () => this.FPS.toFixed(3);
  }

  function timer() {
    return new _timer();
  }

  const R2D = radians => radians * 180 / Math.PI;
   
  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.clientX - p2.clientX, 2) + Math.pow(p1.clientY - p2.clientY, 2));
  }
   
  class input {
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
                          mat4().matrTranslate(rnd.cam.at))).transformPoint(vec3(0, Dist, 0));
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

  function input_init(rnd) {
      return new input(rnd);
  }

  class _render {
    constructor(canvas, name, camera) {
      this.canvas = canvas;
      this.name = name;
      this.gl = canvas.getContext("webgl2");
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.clearColor(0.9, 0.7, 0.7, 1);
      this.prg = this.gl.createProgram();
      this.timer = timer();
      this.prims = [];
      this.input = input_init(this);
      this.cam = camera;
    }

    primAttach(name, type, shd_name, pos, side=3) {
      let p = primCreate(name, type, shd_name, pos, side, this.gl);
      this.prims[this.prims.length] = p;
    }

    programUniforms(shd) {
      if (shd.uniforms["matrView"] != undefined) {
        //let m = mat4().matrView(vec3(5, 3, 5), vec3(0, 0, 0), vec3(0, 1, 0));
        let arr = this.cam.matrView.toArray();
        let mVLoc = shd.uniforms["matrView"].loc;
        this.gl.uniformMatrix4fv(mVLoc, false, arr);
      }

      if (shd.uniforms["matrView"] != undefined) {
        //let m1 = mat4().matrFrustum(-0.08, 0.08, -0.08, 0.08, 0.1, 200);
        let arr1 = this.cam.matrProj.toArray();
        let mPLoc = shd.uniforms["matrProj"].loc;
        this.gl.uniformMatrix4fv(mPLoc, false, arr1);
      }    
    }

    transformProgramUniforms(shd) {
      if (shd.uniforms["Time"] == undefined)
        return;
      let timeLoc = shd.uniforms["Time"].loc;

      this.gl.uniform1f(timeLoc, this.timer.globalTime);
      }
    

    render() {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.timer.response();
      this.input.responseCamera(this);
      for (const p of this.prims) {
        if (
          p.mtl.shader.id != null &&
          p.mtl.shader.shaders[0].id != null &&
          p.mtl.shader.shaders[1].id != null &&
          p.shdIsLoaded == null
        ) {
          this.input.reset();
          p.mtl.shader.apply();
          this.programUniforms(p.mtl.shader);
          this.transformProgramUniforms(p.mtl.shader);
          p.render(this.timer);
          p.shdIsLoaded = 1;
          return;
        }
        if (p.shdIsLoaded == null) return;
        p.mtl.shader.apply();
        this.transformProgramUniforms(p.mtl.shader);
        p.render(this.timer);
      }
    }
  }

  function renderCreate(canvas, name, camera) {
    return new _render(canvas, name, camera);
  }

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

  function camera(w, h) {
      return new _camera(w, h); 
  }

  let rnd1, rnd2;

  //Common uniform variables
  //let matrView = mat4().matrView(vec3(5, 5, 5), vec3(0, 0, 0), vec3(0, 1, 0));
  //let matrProj = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);

  // OpenGL initialization
  function initGL() {
    let canvas1 = document.getElementById("canvas1");
    let camera1 = camera(canvas1.clientWidth, canvas1.clientHeight).camSet().camSetProj(0.1, 0.1, 300);

    let canvas2 = document.getElementById("canvas2");
    let camera2 = camera(canvas2.clientWidth, canvas2.clientHeight).camSet().camSetProj(0.1, 0.1, 300);

    rnd1 = renderCreate(canvas1, "earth", camera1);

    rnd2 = renderCreate(canvas2, "default", camera2);
    rnd2.primAttach("cubePrim", "cube", "default", vec3(0, 0, 0));
    rnd1.primAttach("Earth", "earth", "earth", vec3(0, 2, 0), 3);
    //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
  } // End of 'initGL' function

  // Render function
  function render() {
    rnd1.gl.clear(rnd1.gl.COLOR_BUFFER_BIT);

    rnd1.render();

    rnd2.gl.clear(rnd2.gl.COLOR_BUFFER_BIT);

    rnd2.render();
  }

  console.log("library.js was imported");

  window.addEventListener("load", () => {
    initGL();

    const draw = () => {
      render();

      window.requestAnimationFrame(draw);
    };
    draw();
  });

  exports.initGL = initGL;
  exports.render = render;

  return exports;

})({});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vVUJPL3Viby5qcyIsIi4uL3ByaW1zL2N1YmUuanMiLCIuLi9wcmltcy9lYXJ0aC5qcyIsIi4uL3NoZC9zaGFkZXIuanMiLCIuLi9tdGgvdmVjMy5qcyIsIi4uL210aC9tYXQ0LmpzIiwiLi4vcHJpbXMvcHJpbS5qcyIsIi4uL3RpbWUvdGltZXIuanMiLCIuLi9tdGgvaW5wdXQuanMiLCIuLi9yZW5kZXIvcmVuZGVyLmpzIiwiLi4vbXRoL2NhbWVyYS5qcyIsIi4uL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IodHlwZSwgc2l6ZSwgZ2wpIHtcclxuICAgIHRoaXMudHlwZSA9IHR5cGU7IC8vIEJ1ZmZlciB0eXBlIChnbC4qKipfQlVGRkVSKVxyXG4gICAgdGhpcy5zaXplID0gc2l6ZTsgLy8gQnVmZmVyIHNpemUgaW4gYnl0ZXNcclxuICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgaWYgKHNpemUgPT0gMCB8fCB0eXBlID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgdGhpcy5pZCA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgZ2wuYmluZEJ1ZmZlcih0eXBlLCB0aGlzLmlkKTtcclxuICAgIGdsLmJ1ZmZlckRhdGEodHlwZSwgc2l6ZSwgZ2wuU1RBVElDX0RSQVcpO1xyXG4gIH1cclxuICB1cGRhdGUoZGF0YSkge31cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gYnVmZmVyKC4uLmFyZ3MpIHtcclxuICByZXR1cm4gbmV3IF9idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICdidWZmZXInIGZ1bmN0aW9uXHJcblxyXG5jbGFzcyBfdWJvX2J1ZmZlciBleHRlbmRzIF9idWZmZXIge1xyXG4gIGNvbnN0cnVjdG9yKG5hbWUsIHNpemUsIGJpbmRQb2ludCkge1xyXG4gICAgc3VwZXIodGhpcy5nbC5VTklGT1JNX0JVRkZFUiwgc2l6ZSk7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5iaW5kUG9pbnQgPSBiaW5kUG9pbnQ7IC8vIEJ1ZmZlciBHUFUgYmluZGluZyBwb2ludFxyXG4gIH1cclxuICBhcHBseShzaGQpIHtcclxuICAgIGlmIChcclxuICAgICAgc2hkID09IHVuZGVmaW5lZCB8fFxyXG4gICAgICBzaGQuaWQgPT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgIHNoZC51bmlmb3JtQmxvY2tzW3RoaXMubmFtZV0gPT0gdW5kZWZpbmVkXHJcbiAgICApXHJcbiAgICAgIHJldHVybjtcclxuICAgIGdsLnVuaWZvcm1CbG9ja0JpbmRpbmcoXHJcbiAgICAgIHNoZC5pZCxcclxuICAgICAgc2hkLnVuaWZvcm1CbG9ja3NbdGhpcy5uYW1lXS5pbmRleCxcclxuICAgICAgdGhpcy5iaW5kUG9pbnRcclxuICAgICk7XHJcbiAgICBnbC5iaW5kQnVmZmVyQmFzZSh0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCB0aGlzLmJpbmRQb2ludCwgdGhpcy5pZCk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiB1Ym9fYnVmZmVyKC4uLmFyZ3MpIHtcclxuICByZXR1cm4gbmV3IF91Ym9fYnVmZmVyKC4uLmFyZ3MpO1xyXG59IC8vIEVuZCBvZiAndWJvX2J1ZmZlcicgZnVuY3Rpb25cclxuXHJcbmNsYXNzIF92ZXJ0ZXhfYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IodkFycmF5LCBnbCkge1xyXG4gICAgY29uc3QgbiA9IHZBcnJheS5sZW5ndGg7XHJcbiAgICBzdXBlcihnbC5BUlJBWV9CVUZGRVIsIG4gKiA0LCBnbCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmlkKTtcclxuICAgIGdsLmJ1ZmZlckRhdGEoXHJcbiAgICAgIHRoaXMuZ2wuQVJSQVlfQlVGRkVSLFxyXG4gICAgICBuZXcgRmxvYXQzMkFycmF5KHZBcnJheSksXHJcbiAgICAgIHRoaXMuZ2wuU1RBVElDX0RSQVdcclxuICAgICk7XHJcbiAgfVxyXG4gIGFwcGx5KExvYywgc2l6ZSwgb2Zmc2V0KSB7XHJcbiAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIoTG9jLCAzLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgc2l6ZSwgb2Zmc2V0KTtcclxuICAgIHRoaXMuZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoTG9jKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHZlcnRleF9idWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3ZlcnRleF9idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd2ZXJ0ZXhfYnVmZmVyJyBmdW5jdGlvblxyXG5cclxuY2xhc3MgX2luZGV4X2J1ZmZlciBleHRlbmRzIF9idWZmZXIge1xyXG4gIGNvbnN0cnVjdG9yKGlBcnJheSwgZ2wpIHtcclxuICAgIGNvbnN0IG4gPSBpQXJyYXkubGVuZ3RoO1xyXG4gICAgc3VwZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG4gKiA0LCBnbCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmlkKTtcclxuICAgIGdsLmJ1ZmZlckRhdGEoXHJcbiAgICAgIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLFxyXG4gICAgICBuZXcgVWludDMyQXJyYXkoaUFycmF5KSxcclxuICAgICAgdGhpcy5nbC5TVEFUSUNfRFJBV1xyXG4gICAgKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4X2J1ZmZlciguLi5hcmdzKSB7XHJcbiAgcmV0dXJuIG5ldyBfaW5kZXhfYnVmZmVyKC4uLmFyZ3MpO1xyXG59IC8vIEVuZCBvZiAndWJvX2J1ZmZlcicgZnVuY3Rpb25cclxuIiwiZXhwb3J0IGZ1bmN0aW9uIGN1YmVDcmVhdGUoKSB7XHJcbiAgLyogbGV0IHN4ID0gMCArIHNpZGUsXHJcbiAgICBzeSA9IHBvcy55ICsgc2lkZSxcclxuICAgIHN6ID0gcG9zLnogLSBzaWRlOyAqL1xyXG4gIGxldCBwID0gW1xyXG4gICAgWy0wLjUsIC0wLjUsIDAuNV0sXHJcbiAgICBbMC41LCAtMC41LCAwLjVdLFxyXG4gICAgWzAuNSwgMC41LCAwLjVdLFxyXG4gICAgWy0wLjUsIDAuNSwgMC41XSxcclxuICAgIFstMC41LCAwLjUsIC0wLjVdLFxyXG4gICAgWzAuNSwgMC41LCAtMC41XSxcclxuICAgIFswLjUsIC0wLjUsIC0wLjVdLFxyXG4gICAgWy0wLjUsIC0wLjUsIC0wLjVdLFxyXG4gIF07XHJcblxyXG4gIGxldCBuID0gW1xyXG4gICAgWy0xLCAtMSwgMV0sXHJcbiAgICBbMSwgLTEsIDFdLFxyXG4gICAgWzEsIDEsIDFdLFxyXG4gICAgWy0xLCAxLCAxXSxcclxuICAgIFstMSwgMSwgLTFdLFxyXG4gICAgWzEsIDEsIC0xXSxcclxuICAgIFsxLCAtMSwgLTFdLFxyXG4gICAgWy0xLCAtMSwgLTFdLFxyXG4gIF07XHJcbiAgbGV0IHZlcnRleGVzID0gW10sXHJcbiAgICBqID0gMDtcclxuICB3aGlsZSAoaiA8IDgpIHtcclxuICAgIHZlcnRleGVzW2pdID0gW1xyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICBuW2pdWzBdLFxyXG4gICAgICAwLFxyXG4gICAgICAwLFxyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICAwLFxyXG4gICAgICBuW2pdWzFdLFxyXG4gICAgICAwLFxyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICAwLFxyXG4gICAgICAwLFxyXG4gICAgICBuW2pdWzJdLFxyXG4gICAgXTtcclxuICAgIGorKztcclxuICB9XHJcbiAgbGV0IGluZCA9IFtcclxuICAgIDIsIDExLCA1LCA4LCA2LCAzLCAxNSwgMTgsIDE5LCAyMiwgNCwgMSwgMCwgOSwgMjEsIDEyLCAxNCwgMTcsIDIzLCAyMCwgMjMsXHJcbiAgICAxNCwgMTcsIDE2LCAxMywgNywgMTAsXHJcbiAgXTtcclxuXHJcbiAgdmVydGV4ZXMgPSBbXHJcbiAgICAuLi52ZXJ0ZXhlc1swXSxcclxuICAgIC4uLnZlcnRleGVzWzFdLFxyXG4gICAgLi4udmVydGV4ZXNbMl0sXHJcbiAgICAuLi52ZXJ0ZXhlc1szXSxcclxuICAgIC4uLnZlcnRleGVzWzRdLFxyXG4gICAgLi4udmVydGV4ZXNbNV0sXHJcbiAgICAuLi52ZXJ0ZXhlc1s2XSxcclxuICAgIC4uLnZlcnRleGVzWzddLFxyXG4gIF07XHJcblxyXG4gIHJldHVybiBbdmVydGV4ZXMsIGluZF07XHJcbn0iLCJleHBvcnQgZnVuY3Rpb24gZWFydGhDcmVhdGUoKSB7XHJcbiAgICBsZXQgdmVydGV4ZXMgPSBbXSwgdyA9IDIwLCBoID0gMjAsXHJcbiAgICAgIGksIGosIHRoZXRhLCBwaGksIEcgPSBbXSwgaW5kID0gW107XHJcbiAgICBsZXQgcGkgPSBNYXRoLmFjb3MoLTEpO1xyXG4gICAgXHJcbiAgICBmb3IgKGkgPSAwLCB0aGV0YSA9IDA7IGkgPCBoOyBpKyssIHRoZXRhICs9IHBpIC8gKGggLSAxKSkge1xyXG4gICAgICAgIGZvciAoaiA9IDAsIHBoaSA9IDA7IGogPCB3OyBqKyssIHBoaSArPSAyICogcGkgLyAodyAtIDEpKSB7XHJcbiAgICAgICAgICAgIEdbal0gPSBNYXRoLnNpbih0aGV0YSkgKiBNYXRoLnNpbihwaGkpO1xyXG4gICAgICAgICAgICBHW2ogKyAxXSA9IE1hdGguY29zKHRoZXRhKTtcclxuICAgICAgICAgICAgR1tqICsgMl0gPSBNYXRoLnNpbih0aGV0YSkgKiBNYXRoLmNvcyhwaGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2ZXJ0ZXhlcyA9IHZlcnRleGVzLmNvbmNhdCguLi5HKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgaDsgaSsrKSB7XHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHcgLSAxOyBqICs9IDQpIHtcclxuICAgICAgICAgICAgaW5kW2kgKiBoICsgal0gPSBpICogaCArIGo7XHJcbiAgICAgICAgICAgIGluZFtpICogaCArIGogKyAxXSA9IGkgKiBoICsgaiArIDE7XHJcbiAgICAgICAgICAgIGluZFtpICogaCArIGogKyAyXSA9IChpICsgMSkgKiBoICsgajtcclxuICAgICAgICAgICAgaW5kW2kgKiBoICsgaiArIDNdID0gKGkgKyAxKSAqIGggKyBqICsgMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW3ZlcnRleGVzLCBpbmRdO1xyXG59IiwiY2xhc3MgX3NoYWRlciB7XHJcbiAgYXN5bmMgX2luaXQobmFtZSwgZ2wpIHtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgIHRoaXMuc2hhZGVycyA9IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIHR5cGU6IHRoaXMuZ2wuVkVSVEVYX1NIQURFUixcclxuICAgICAgICBuYW1lOiBcInZlcnRcIixcclxuICAgICAgICBzcmM6IFwiXCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogbnVsbCxcclxuICAgICAgICB0eXBlOiB0aGlzLmdsLkZSQUdNRU5UX1NIQURFUixcclxuICAgICAgICBuYW1lOiBcImZyYWdcIixcclxuICAgICAgICBzcmM6IFwiXCIsXHJcbiAgICAgIH0sXHJcbiAgICBdO1xyXG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc2hhZGVycykge1xyXG4gICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgYmluL3NoYWRlcnMvJHtuYW1lfS8ke3MubmFtZX0uZ2xzbGApO1xyXG4gICAgICBsZXQgc3JjID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICBpZiAodHlwZW9mIHNyYyA9PSBcInN0cmluZ1wiICYmIHNyYyAhPSBcIlwiKSBzLnNyYyA9IHNyYztcclxuICAgIH1cclxuICAgIC8vIHJlY29tcGlsZSBzaGFkZXJzXHJcbiAgICB0aGlzLnVwZGF0ZVNoYWRlcnNTb3VyY2UoKTtcclxuICB9XHJcbiAgdXBkYXRlU2hhZGVyc1NvdXJjZSgpIHtcclxuICAgIHRoaXMuc2hhZGVyc1swXS5pZCA9IG51bGw7XHJcbiAgICB0aGlzLnNoYWRlcnNbMV0uaWQgPSBudWxsO1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICBpZiAodGhpcy5zaGFkZXJzWzBdLnNyYyA9PSBcIlwiIHx8IHRoaXMuc2hhZGVyc1sxXS5zcmMgPT0gXCJcIikgcmV0dXJuO1xyXG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc2hhZGVycykge1xyXG4gICAgICBzLmlkID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIocy50eXBlKTtcclxuICAgICAgdGhpcy5nbC5zaGFkZXJTb3VyY2Uocy5pZCwgcy5zcmMpO1xyXG4gICAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIocy5pZCk7XHJcbiAgICAgIGlmICghdGhpcy5nbC5nZXRTaGFkZXJQYXJhbWV0ZXIocy5pZCwgdGhpcy5nbC5DT01QSUxFX1NUQVRVUykpIHtcclxuICAgICAgICBsZXQgYnVmID0gdGhpcy5nbC5nZXRTaGFkZXJJbmZvTG9nKHMuaWQpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBTaGFkZXIgJHt0aGlzLm5hbWV9LyR7cy5uYW1lfSBjb21waWxlIGZhaWw6ICR7YnVmfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmlkID0gdGhpcy5nbC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc2hhZGVycykge1xyXG4gICAgICBpZiAocy5pZCAhPSBudWxsKSB0aGlzLmdsLmF0dGFjaFNoYWRlcih0aGlzLmlkLCBzLmlkKTtcclxuICAgIH1cclxuICAgIGxldCBwcmcgPSB0aGlzLmlkO1xyXG4gICAgdGhpcy5nbC5saW5rUHJvZ3JhbShwcmcpO1xyXG4gICAgaWYgKCF0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJnLCB0aGlzLmdsLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICBsZXQgYnVmID0gdGhpcy5nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcmcpO1xyXG4gICAgICBjb25zb2xlLmxvZyhgU2hhZGVyIHByb2dyYW0gJHt0aGlzLm5hbWV9IGxpbmsgZmFpbDogJHtidWZ9YCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnVwZGF0ZVNoYWRlckRhdGEoKTtcclxuICB9XHJcbiAgdXBkYXRlU2hhZGVyRGF0YSgpIHtcclxuICAgIC8vIFNoYWRlciBhdHRyaWJ1dGVzXHJcbiAgICB0aGlzLmF0dHJzID0ge307XHJcbiAgICBjb25zdCBjb3VudEF0dHJzID0gdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKFxyXG4gICAgICB0aGlzLmlkLFxyXG4gICAgICB0aGlzLmdsLkFDVElWRV9BVFRSSUJVVEVTXHJcbiAgICApO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudEF0dHJzOyBpKyspIHtcclxuICAgICAgY29uc3QgaW5mbyA9IHRoaXMuZ2wuZ2V0QWN0aXZlQXR0cmliKHRoaXMuaWQsIGkpO1xyXG4gICAgICB0aGlzLmF0dHJzW2luZm8ubmFtZV0gPSB7XHJcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxyXG4gICAgICAgIHR5cGU6IGluZm8udHlwZSxcclxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXHJcbiAgICAgICAgbG9jOiB0aGlzLmdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMuaWQsIGluZm8ubmFtZSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2hhZGVyIHVuaWZvcm1zXHJcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XHJcbiAgICBjb25zdCBjb3VudFVuaWZvcm1zID0gdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKFxyXG4gICAgICB0aGlzLmlkLFxyXG4gICAgICB0aGlzLmdsLkFDVElWRV9VTklGT1JNU1xyXG4gICAgKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnRVbmlmb3JtczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm0odGhpcy5pZCwgaSk7XHJcbiAgICAgIHRoaXMudW5pZm9ybXNbaW5mby5uYW1lXSA9IHtcclxuICAgICAgICBuYW1lOiBpbmZvLm5hbWUsXHJcbiAgICAgICAgdHlwZTogaW5mby50eXBlLFxyXG4gICAgICAgIHNpemU6IGluZm8uc2l6ZSxcclxuICAgICAgICBsb2M6IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuaWQsIGluZm8ubmFtZSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2hhZGVyIHVuaWZvcm0gYmxvY2tzXHJcbiAgICB0aGlzLnVuaWZvcm1CbG9ja3MgPSB7fTtcclxuICAgIGNvbnN0IGNvdW50VW5pZm9ybUJsb2NrcyA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihcclxuICAgICAgdGhpcy5pZCxcclxuICAgICAgdGhpcy5nbC5BQ1RJVkVfVU5JRk9STV9CTE9DS1NcclxuICAgICk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50VW5pZm9ybUJsb2NrczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGJsb2NrX25hbWUgPSB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja05hbWUodGhpcy5pZCwgaSk7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtQmxvY2tJbmRleCh0aGlzLmlkLCBibG9ja19uYW1lKTtcclxuICAgICAgdGhpcy51bmlmb3JtQmxvY2tzW2Jsb2NrX25hbWVdID0ge1xyXG4gICAgICAgIG5hbWU6IGJsb2NrX25hbWUsXHJcbiAgICAgICAgaW5kZXg6IGluZGV4LFxyXG4gICAgICAgIHNpemU6IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrUGFyYW1ldGVyKFxyXG4gICAgICAgICAgdGhpcy5pZCxcclxuICAgICAgICAgIGlkeCxcclxuICAgICAgICAgIHRoaXMuZ2wuVU5JRk9STV9CTE9DS19EQVRBX1NJWkVcclxuICAgICAgICApLFxyXG4gICAgICAgIGJpbmQ6IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrUGFyYW1ldGVyKFxyXG4gICAgICAgICAgdGhpcy5pZCxcclxuICAgICAgICAgIGlkeCxcclxuICAgICAgICAgIHRoaXMuZ2wuVU5JRk9STV9CTE9DS19CSU5ESU5HXHJcbiAgICAgICAgKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcbiAgY29uc3RydWN0b3IobmFtZSwgZ2wpIHtcclxuICAgIHRoaXMuX2luaXQobmFtZSwgZ2wpO1xyXG4gIH1cclxuICBhcHBseSgpIHtcclxuICAgIGlmICh0aGlzLmlkICE9IG51bGwpIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLmlkKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHNoYWRlcihuYW1lLCBnbCkge1xyXG4gIHJldHVybiBuZXcgX3NoYWRlcihuYW1lLCBnbCk7XHJcbn1cclxuLypcclxubGV0IHNyYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hkVmVydFNyY1wiKS52YWx1ZTtcclxuc2hkLnNoYWRlcnNbMF0uc3JjID0gc3JjO1xyXG5zaGQudXBkYXRlU2hhZGVyc1NvdXJjZSgpO1xyXG4qL1xyXG4iLCJjbGFzcyBfdmVjMyB7XHJcbiAgY29uc3RydWN0b3IoeCwgeSwgeikge1xyXG4gICAgaWYgKHR5cGVvZih4KSAhPSBcIm51bWJlclwiKSB7XHJcbiAgICAgIGlmICh4ID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAodGhpcy54ID0geC54KSwgKHRoaXMueSA9IHgueSksICh0aGlzLnogPSB4LnopO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoeSAhPSB1bmRlZmluZWQgJiYgeiAhPSB1bmRlZmluZWQpXHJcbiAgICAgICh0aGlzLnggPSB4KSwgKHRoaXMueSA9IHkpLCAodGhpcy56ID0geik7XHJcbiAgICBlbHNlICh0aGlzLnggPSB4KSwgKHRoaXMueSA9IHgpLCAodGhpcy56ID0geCk7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgYWRkIGFub3RoZXJcclxuICBhZGQodikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyh0aGlzLnggKyB2LngsIHRoaXMueSArIHYueSwgdGhpcy56ICsgdi56KTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBzdWJzdHJhY3QgYW5vdGhlclxyXG4gIHN1Yih2KSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55LCB0aGlzLnogLSB2LnopO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIG11bHRpcGxpY2F0ZWQgYnkgbnVtYmVyXHJcbiAgbXVsTnVtKG4pIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54ICogbiwgdGhpcy55ICogbiwgdGhpcy56ICogbik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgZGV2aWRlZCBieSBudW1iZXJcclxuICBkaXZOdW0obikge1xyXG4gICAgaWYgKG4gPT0gMCkgcmV0dXJuO1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyh0aGlzLnggLyBuLCB0aGlzLnkgLyBuLCB0aGlzLnogLyBuKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBOZWdhdGl2ZVxyXG4gIG5lZygpIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzMoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XHJcbiAgfVxyXG5cclxuICAvL1R3byB2ZWN0b3JzMyBkb3QgcHJvZHVjdFxyXG4gIGRvdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIExlbmdodCBldmFsdWF0aW9uXHJcbiAgbGVuKCkge1xyXG4gICAgbGV0IGxlbiA9IHRoaXMuZG90KHRoaXMpO1xyXG4gICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSAxKSByZXR1cm4gbGVuO1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChsZW4pO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIE5vcm1hbGl6ZVxyXG4gIG5vcm1hbGl6ZSgpIHtcclxuICAgIGxldCBsZW4gPSB0aGlzLmRvdCh0aGlzKTtcclxuXHJcbiAgICBpZiAobGVuID09IDEgfHwgbGVuID09IDApIHJldHVybiB0aGlzO1xyXG4gICAgcmV0dXJuIHRoaXMuZGl2TnVtKE1hdGguc3FydChsZW4pKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyB0cmFuc2ZvbWF0aW9uXHJcbiAgdHJhbnNmb3JtKG0pIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzMoXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIHRoaXMueiAqIG0uYVsyXVswXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgdGhpcy56ICogbS5hWzJdWzFdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyB0aGlzLnogKiBtLmFbMl1bMl1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgYnkgbWF0cml4IG11bHRpcGxpY2F0aW9uICh3aXRoIGhvbW9nZW5pb3VzIGRldmlkZSlcclxuICB2ZWMzTXVsTWF0cihtKSB7XHJcbiAgICBsZXQgdyA9XHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVszXSArIHRoaXMueSAqIG0uYVsxXVszXSArIHRoaXMueiAqIG0uYVsyXVszXSArIG0uYVszXVszXTtcclxuXHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKFxyXG4gICAgICAoVi5YICogbS5hWzBdWzBdICsgdGhpcy55ICogbS5hWzFdWzBdICsgVi5aICogbS5hWzJdWzBdICsgbS5hWzNdWzBdKSAvIHcsXHJcbiAgICAgIChWLlggKiBtLmFbMF1bMV0gKyB0aGlzLnkgKiBtLmFbMV1bMV0gKyBWLlogKiBtLmFbMl1bMV0gKyBtLmFbM11bMV0pIC8gdyxcclxuICAgICAgKFYuWCAqIG0uYVswXVsyXSArIHRoaXMueSAqIG0uYVsxXVsyXSArIFYuWiAqIG0uYVsyXVsyXSArIG0uYVszXVsyXSkgLyB3XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy9Dcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzXHJcbiAgY3Jvc3Modikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyhcclxuICAgICAgdGhpcy55ICogdi56IC0gdGhpcy56ICogdi55LFxyXG4gICAgICB0aGlzLnogKiB2LnggLSB0aGlzLnggKiB2LnosXHJcbiAgICAgIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vUG9pbnQgYnkgbWF0cml4IHRyYW5zZm9ybWF0aW9uXHJcbiAgcG9pbnRUcmFuc2Zvcm0obSkge1xyXG4gICAgbGV0IHYgPSBuZXcgX3ZlYzMoXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIHYueiAqIG0uYVsyXVswXSArIG0uYVszXVswXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgdi56ICogbS5hWzJdWzFdICsgbS5hWzNdWzFdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyB2LnogKiBtLmFbMl1bMl0gKyBtLmFbM11bMl1cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmVjMyh4LCB5LCB6KSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVjMyh4LCB5LCB6KTtcclxufVxyXG4iLCJpbXBvcnQge3ZlYzN9IGZyb20gXCIuL3ZlYzNcIlxyXG5cclxuY2xhc3MgX21hdDQge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgdG9BcnJheSgpIHtcclxuICAgIGxldCB0ID0gdGhpcy5hO1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdCh0WzBdKS5jb25jYXQodFsxXSkuY29uY2F0KHRbMl0pLmNvbmNhdCh0WzNdKTtcclxuICB9XHJcblxyXG4gIC8vVHJhbnNsYXRlIG1hdHJpeFxyXG4gIG1hdHJUcmFuc2xhdGUodikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgWzEsIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAxLCAwXSxcclxuICAgICAgW3YueCwgdi55LCB2LnosIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9NdWx0aXBseWluZyB0d28gbWF0cml4ZXNcclxuICBtYXRyTXVsTWF0cjIobSkge1xyXG4gICAgbGV0IHIgPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzBdWzFdID1cclxuICAgICAgdGhpcy5hWzBdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVswXVsyXSA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgci5hWzFdWzBdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzBdO1xyXG5cclxuICAgIHIuYVsxXVsxXSA9XHJcbiAgICAgIHRoaXMuYVsxXVswXSAqIG0uYVswXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsxXSAqIG0uYVsxXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsyXSAqIG0uYVsyXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVszXSAqIG0uYVszXVsxXTtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICB0aGlzLmFbMV1bMF0gKiBtLmFbMF1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMV0gKiBtLmFbMV1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMl0gKiBtLmFbMl1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bM10gKiBtLmFbM11bMl07XHJcblxyXG4gICAgci5hWzFdWzNdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzNdO1xyXG5cclxuICAgIHIuYVsyXVswXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVswXTtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICB0aGlzLmFbMl1bMF0gKiBtLmFbMF1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMV0gKiBtLmFbMV1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMl0gKiBtLmFbMl1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bM10gKiBtLmFbM11bMV07XHJcblxyXG4gICAgci5hWzJdWzJdID1cclxuICAgICAgdGhpcy5hWzJdWzBdICogbS5hWzBdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzFdICogbS5hWzFdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzJdICogbS5hWzJdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzNdICogbS5hWzNdWzJdO1xyXG5cclxuICAgIHIuYVsyXVszXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVszXTtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzNdWzFdID1cclxuICAgICAgdGhpcy5hWzNdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVszXVsyXSA9XHJcbiAgICAgIHRoaXMuYVszXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICAvL011bHRpcGx5aW5nIHRocmVlIG1hdHJpeGVzXHJcbiAgbWF0ck11bE1hdHIzKG0xLCBtMikge1xyXG4gICAgcmV0dXJuIHRoaXMubWF0ck11bE1hdHIyKG0xLm1hdHJNdWxNYXRyMihtMikpO1xyXG4gIH1cclxuXHJcbiAgTWF0ckludmVyc2UoKSB7XHJcbiAgICBsZXQgciA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbGV0IGRldCA9IG1hdHJEZXRlcm0oTSk7XHJcblxyXG4gICAgaWYgKGRldCA9PSAwKSByZXR1cm4gcjtcclxuXHJcbiAgICAvKiBidWlsZCBhZGpvaW50IG1hdHJpeCAqL1xyXG4gICAgci5hWzBdWzBdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bMF0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVswXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzBdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMF1bMV0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVsxXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzFdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bMV0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVswXVsyXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzFdWzJdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMl1bMl0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVszXVsyXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzBdWzNdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bM10gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVszXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzNdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIC8vUm90YXRpb24gbWF0cml4XHJcbiAgbWF0clJvdGF0ZShhbmdsZSwgdikge1xyXG4gICAgbGV0IGEgPSBhbmdsZSAqIDMuMTQxNTkyNjUzNTg5NzkzMiAvIDE4MCxcclxuICAgICAgcyA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjID0gTWF0aC5jb3MoYSk7XHJcblxyXG4gICAgbGV0IHIgPSBuZXcgX21hdDQoKTtcclxuICAgIHIuYSA9IFtcclxuICAgICAgW1xyXG4gICAgICAgIGMgKyB2LnggKiB2LnggKiAoMSAtIGMpLFxyXG4gICAgICAgIHYueSAqIHYueCAqICgxIC0gYykgLSB2LnogKiBzLFxyXG4gICAgICAgIHYueiAqIHYueCAqICgxIC0gYykgKyB2LnkgKiBzLFxyXG4gICAgICAgIDAsXHJcbiAgICAgIF0sXHJcbiAgICAgIFtcclxuICAgICAgICB2LnggKiB2LnkgKiAoMSAtIGMpICsgdi56ICogcyxcclxuICAgICAgICBjICsgdi55ICogdi55ICogKDEgLSBjKSxcclxuICAgICAgICB2LnogKiB2LnkgKiAoMSAtIGMpIC0gdi54ICogcyxcclxuICAgICAgICAwLFxyXG4gICAgICBdLFxyXG4gICAgICBbXHJcbiAgICAgICAgdi54ICogdi56ICogKDEgLSBjKSAtIHYueSAqIHMsXHJcbiAgICAgICAgdi55ICogdi56ICogKDEgLSBjKSArIHYueCAqIHMsXHJcbiAgICAgICAgYyArIHYueiAqIHYueiAqICgxIC0gYyksXHJcbiAgICAgICAgMCxcclxuICAgICAgXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgLy9WaWV3IG1hdHJpeFxyXG4gIG1hdHJWaWV3KGxvYywgYXQsIHVwMSkge1xyXG4gICAgbGV0IGRpciA9IGF0LnN1Yihsb2MpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICByaWdodCA9IGRpci5jcm9zcyh1cDEpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICB1cCA9IHJpZ2h0LmNyb3NzKGRpcikubm9ybWFsaXplKCk7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbS5hID0gW1xyXG4gICAgICBbcmlnaHQueCwgdXAueCwgLWRpci54LCAwXSxcclxuICAgICAgW3JpZ2h0LnksIHVwLnksIC1kaXIueSwgMF0sXHJcbiAgICAgIFtyaWdodC56LCB1cC56LCAtZGlyLnosIDBdLFxyXG4gICAgICBbLWxvYy5kb3QocmlnaHQpLCAtbG9jLmRvdCh1cCksIGxvYy5kb3QoZGlyKSwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL0ZydXN0dW0gbWF0cml4XHJcbiAgbWF0ckZydXN0dW0obCwgciwgYiwgdCwgbiwgZikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgWygyICogbikgLyAociAtIGwpLCAwLCAwLCAwXSxcclxuICAgICAgWzAsICgyICogbikgLyAodCAtIGIpLCAwLCAwXSxcclxuICAgICAgWyhyICsgbCkgLyAociAtIGwpLCAodCArIGIpIC8gKHQgLSBiKSwgLSgoZiArIG4pIC8gKGYgLSBuKSksIC0xXSxcclxuICAgICAgWzAsIDAsIC0oKDIgKiBuICogZikgLyAoZiAtIG4pKSwgMF0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1RyYW5zcG9zZSBtYXRyaXhcclxuICBtYXRyVHJhbnNwb3NlKCkge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICAobS5hID0gW20uYVswXVswXSwgbS5hWzFdWzBdLCBtLmFbMl1bMF0sIG0uYVszXVswXV0pLFxyXG4gICAgICBbbS5hWzBdWzFdLCBtLmFbMV1bMV0sIG0uYVsyXVsxXSwgbS5hWzNdWzFdXSxcclxuICAgICAgW20uYVswXVsyXSwgbS5hWzFdWzJdLCBtLmFbMl1bMl0sIG0uYVszXVsyXV0sXHJcbiAgICAgIFttLmFbMF1bM10sIG0uYVsxXVszXSwgbS5hWzJdWzNdLCBtLmFbM11bM11dO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1JhdGF0aW9uIGJ5IFggbWF0cml4XHJcbiAgbWF0clJvdGF0ZVgoYW5nbGVJbkRlZ3JlZSkge1xyXG4gICAgbGV0IGEgPSBhbmdsZUluRGVncmVlICogMy4xNDE1OTI2NTM1ODk3OTMyIC8gMTgwLFxyXG4gICAgICBzaSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjbyA9IE1hdGguY29zKGEpLFxyXG4gICAgICBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCBjbywgc2ksIDBdLFxyXG4gICAgICBbMCwgLXNpLCBjbywgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vUm90YXRpb24gYnkgWSBtYXRyaXhcclxuICBtYXRyUm90YXRlWShhbmdsZUluRGVncmVlKSB7XHJcbiAgICBsZXQgYSA9IGFuZ2xlSW5EZWdyZWUgKiAzLjE0MTU5MjY1MzU4OTc5MzIgLyAxODAsXHJcbiAgICAgIHNpID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGNvID0gTWF0aC5jb3MoYSksXHJcbiAgICAgIG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFtjbywgMCwgLXNpLCAwXSxcclxuICAgICAgWzAsIDEsIDAsIDBdLFxyXG4gICAgICBbc2ksIDAsIGNvLCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBieSBaIG1hdHJpeFxyXG4gIG1hdHJSb3RhdGVaKGFuZ2xlSW5EZWdyZWUpIHtcclxuICAgIGxldCBhID0gYW5nbGVJbkRlZ3JlZSAqIDMuMTQxNTkyNjUzNTg5NzkzMiAvIDE4MCxcclxuICAgICAgc2kgPSBNYXRoLnNpbihhKSxcclxuICAgICAgY28gPSBNYXRoLmNvcyhhKSxcclxuICAgICAgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIG0uYSA9IFtcclxuICAgICAgW2NvLCBzaSwgMCwgMF0sXHJcbiAgICAgIFstc2ksIGNvLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1NjYWxlIG1hdHJpeFxyXG4gIG1hdHJTY2FsZSh2KSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIG0uYSA9IFtcclxuICAgICAgW3YueCwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCB2LnksIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgdi56LCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgbWF0ck9ydGhvKGwsIHIsIGIsIHQsIG4sIGYpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbMiAvIChyIC0gbCksIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMiAvICh0IC0gYiksIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgLTIgLyAoZiAtIG4pLCAwXSxcclxuICAgICAgWy0ociArIGwpIC8gKHIgLSBsKSwgLSh0ICsgYikgLyAodCAtIGIpLCAtKGYgKyBuKSAvIChmIC0gbiksIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuICAvL1BvaW50IGJ5IG1hdHJpeCB0cmFuc2Zvcm1hdGlvblxyXG4gIHRyYW5zZm9ybVBvaW50KHYpIHtcclxuICAgIGxldCB2ZSA9IHZlYzMoXHJcbiAgICAgIHYueCAqIHRoaXMuYVswXVswXSArIHYueSAqIHRoaXMuYVsxXVswXSArIHYueiAqIHRoaXMuYVsyXVswXSArIHRoaXMuYVszXVswXSxcclxuICAgICAgdi54ICogdGhpcy5hWzBdWzFdICsgdi55ICogdGhpcy5hWzFdWzFdICsgdi56ICogdGhpcy5hWzJdWzFdICsgdGhpcy5hWzNdWzFdLFxyXG4gICAgICB2LnggKiB0aGlzLmFbMF1bMl0gKyB2LnkgKiB0aGlzLmFbMV1bMl0gKyB2LnogKiB0aGlzLmFbMl1bMl0gKyB0aGlzLmFbM11bMl1cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHZlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWF0ckRldGVybTN4MyhhMTEsIGExMiwgYTEzLCBhMjEsIGEyMiwgYTIzLCBhMzEsIGEzMiwgYTMzKSB7XHJcbiAgcmV0dXJuIChcclxuICAgIGExMSAqIGEyMiAqIGEzMyArXHJcbiAgICBhMTIgKiBhMjMgKiBhMzEgK1xyXG4gICAgYTEzICogYTIxICogYTMyIC1cclxuICAgIGExMSAqIGEyMyAqIGEzMiAtXHJcbiAgICBhMTIgKiBhMjEgKiBhMzMgLVxyXG4gICAgYTEzICogYTIyICogYTMxXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWF0ckRldGVybShtKSB7XHJcbiAgbGV0IGQgPVxyXG4gICAgK3RoaXMuYVswXVswXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzFdLFxyXG4gICAgICAgIG0uYVsxXVsyXSxcclxuICAgICAgICBtLmFbMV1bM10sXHJcbiAgICAgICAgbS5hWzJdWzFdLFxyXG4gICAgICAgIG0uYVsyXVsyXSxcclxuICAgICAgICBtLmFbMl1bM10sXHJcbiAgICAgICAgbS5hWzNdWzFdLFxyXG4gICAgICAgIG0uYVszXVsyXSxcclxuICAgICAgICBtLmFbM11bM11cclxuICAgICAgKSArXHJcbiAgICAtbS5hWzBdWzFdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMF0sXHJcbiAgICAgICAgbS5hWzFdWzJdLFxyXG4gICAgICAgIG0uYVsxXVszXSxcclxuICAgICAgICBtLmFbMl1bMF0sXHJcbiAgICAgICAgbS5hWzJdWzJdLFxyXG4gICAgICAgIG0uYVsyXVszXSxcclxuICAgICAgICBtLmFbM11bMF0sXHJcbiAgICAgICAgbS5hWzNdWzJdLFxyXG4gICAgICAgIG0uYVszXVszXVxyXG4gICAgICApICtcclxuICAgICttLmFbMF1bMl0gKlxyXG4gICAgICBtYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIG0uYVsxXVswXSxcclxuICAgICAgICBtLmFbMV1bMV0sXHJcbiAgICAgICAgbS5hWzFdWzNdLFxyXG4gICAgICAgIG0uYVsyXVswXSxcclxuICAgICAgICBtLmFbMl1bMV0sXHJcbiAgICAgICAgbS5hWzJdWzNdLFxyXG4gICAgICAgIG0uYVszXVswXSxcclxuICAgICAgICBtLmFbM11bMV0sXHJcbiAgICAgICAgbS5hWzNdWzNdXHJcbiAgICAgICkgK1xyXG4gICAgLW0uYVswXVszXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzBdLFxyXG4gICAgICAgIG0uYVsxXVsxXSxcclxuICAgICAgICBtLmFbMV1bMl0sXHJcbiAgICAgICAgbS5hWzJdWzBdLFxyXG4gICAgICAgIG0uYVsyXVsxXSxcclxuICAgICAgICBtLmFbMl1bMl0sXHJcbiAgICAgICAgbS5hWzNdWzBdLFxyXG4gICAgICAgIG0uYVszXVsxXSxcclxuICAgICAgICBtLmFbM11bMl1cclxuICAgICAgKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1hdDQoKSB7XHJcbiAgcmV0dXJuIG5ldyBfbWF0NCgpO1xyXG59XHJcbiIsImltcG9ydCB7IGluZGV4X2J1ZmZlciwgdmVydGV4X2J1ZmZlciB9IGZyb20gXCIuLi9VQk8vdWJvLmpzXCI7XHJcbmltcG9ydCB7IGN1YmVDcmVhdGUgfSBmcm9tIFwiLi9jdWJlLmpzXCI7XHJcbmltcG9ydCB7IGVhcnRoQ3JlYXRlIH0gZnJvbSBcIi4vZWFydGguanNcIjtcclxuaW1wb3J0IHsgc2hhZGVyIH0gZnJvbSBcIi4uL3NoZC9zaGFkZXIuanNcIjtcclxuaW1wb3J0IHsgbWF0NCB9IGZyb20gXCIuLi9tdGgvbWF0NC5qc1wiO1xyXG5pbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4uL210aC92ZWMzLmpzXCI7XHJcblxyXG5jbGFzcyBfbWF0ZXJpYWwge1xyXG4gIGNvbnN0cnVjdG9yKHNoZCwgdWJvKSB7XHJcbiAgICB0aGlzLnNoYWRlciA9IHNoZDtcclxuICAgIHRoaXMudWJvID0gdWJvO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgX3ByaW0ge1xyXG4gIGNvbnN0cnVjdG9yKGdsLCBuYW1lLCB0eXBlLCBzaGRfbmFtZSwgcG9zLCBWQnVmLCBJQnVmLCBWQSwgbm9vZkksIG5vb2ZWLCBzaWRlKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgKHRoaXMuVkJ1ZiA9IFZCdWYpLCAodGhpcy5JQnVmID0gSUJ1ZiksICh0aGlzLlZBID0gVkEpOyAvKiByZW5kZXIgaW5mbyAqL1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLyogcGxhdG9uIGZpZ3VyZSB0eXBlICovXHJcbiAgICB0aGlzLnBvcyA9IHBvczsgLyogcG9zaXRpb24gKi9cclxuXHJcbiAgICB0aGlzLnNpZGUgPSBzaWRlO1xyXG4gICAgbGV0IHNoZCA9IHNoYWRlcihzaGRfbmFtZSwgZ2wpO1xyXG4gICAgdGhpcy5tdGwgPSBuZXcgX21hdGVyaWFsKHNoZCwgbnVsbCk7XHJcbiAgICB0aGlzLnNoZElzTG9hZGVkID0gbnVsbDtcclxuICAgIHRoaXMubm9vZkkgPSBub29mSTtcclxuICAgIHRoaXMubm9vZlYgPSBub29mVjtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIHRoaXMubWF0cldvdXJsZCA9IG1hdDQoKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVByaW1EYXRhKHRpbWVyKSB7XHJcblxyXG4gICAgaWYgKHRoaXMubXRsLnNoYWRlci51bmlmb3Jtc1tcIm1hdHJXb3JsZFwiXSA9PSB1bmRlZmluZWQpXHJcbiAgICAgIHJldHVybjtcclxuICAgIGxldCBtciwgbTE7XHJcbiAgICBpZiAodGhpcy50eXBlID09IFwiZWFydGhcIikge1xyXG4gICAgICBtMSA9IG1hdDQoKS5tYXRyTXVsTWF0cjIobWF0NCgpLm1hdHJSb3RhdGVZKDMwICogdGltZXIuZ2xvYmFsVGltZSkpLm1hdHJNdWxNYXRyMihtYXQ0KCkubWF0clNjYWxlKHZlYzMoMywgMywgMykpKTsgIFxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIG1yID0gbWF0NCgpLm1hdHJTY2FsZSh2ZWMzKHRoaXMuc2lkZSkpO1xyXG4gICAgICBtMSA9IG1hdDQoKS5tYXRyVHJhbnNsYXRlKHRoaXMucG9zKS5tYXRyTXVsTWF0cjIobXIpLm1hdHJNdWxNYXRyMihtYXQ0KCkubWF0clJvdGF0ZVkoMzAgKiB0aW1lci5nbG9iYWxUaW1lKSk7XHJcbiAgICB9XHJcbiAgICBsZXQgYXJyMSA9IG0xLnRvQXJyYXkoKTtcclxuICAgIGxldCBtV0xvYyA9IHRoaXMubXRsLnNoYWRlci51bmlmb3Jtc1tcIm1hdHJXb3JsZFwiXS5sb2M7XHJcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobVdMb2MsIGZhbHNlLCBhcnIxKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcih0aW1lcikge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuICAgIGlmICh0aGlzLm5vb2ZJICE9IG51bGwpIHtcclxuICAgICAgaWYgKHRoaXMubXRsLnNoZElzTG9hZGVkID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByaW1EYXRhKHRpbWVyKTtcclxuICAgICAgICBpZiAodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Ob3JtYWxcIl0gPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluUG9zaXRpb25cIl0ubG9jLCAxMiwgMCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDI0LCAwKTtcclxuICAgICAgICAgIHRoaXMuVkJ1Zi5hcHBseSh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJbk5vcm1hbFwiXS5sb2MsIDI0LCAxMik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubXRsLnNoYWRlci51cGRhdGVTaGFkZXJEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuVkJ1Zi5pZCk7XHJcbiAgICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBLmlkKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5JQnVmLmlkKTtcclxuICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLm5vb2ZJLCBnbC5VTlNJR05FRF9JTlQsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMubXRsLnNoZElzTG9hZGVkID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByaW1EYXRhKHRpbWVyKTtcclxuICAgICAgICBpZiAodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Ob3JtYWxcIl0gPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluUG9zaXRpb25cIl0ubG9jLCAxMiwgMCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDI0LCAwKTtcclxuICAgICAgICAgIHRoaXMuVkJ1Zi5hcHBseSh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJbk5vcm1hbFwiXS5sb2MsIDI0LCAxMik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubXRsLnNoYWRlci51cGRhdGVTaGFkZXJEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgICAgZ2wuYmluZFZlcnRleEFycmF5KHRoaXMuVkEuaWQpO1xyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5WQnVmLmlkKTtcclxuICAgICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5ub29mVik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBfdmVydGV4IHtcclxuICBjb25zdHJ1Y3Rvcihwb3MsIG5vcm0pIHtcclxuICAgICh0aGlzLnBvcyA9IHBvcyksICh0aGlzLm5vcm0gPSBub3JtKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2cnQocG9zLCBub3JtKSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVydGV4KHBvcywgbm9ybSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcmltQ3JlYXRlKG5hbWUsIHR5cGUsIG10bCwgcG9zLCBzaWRlPTMsIGdsKSB7XHJcbiAgbGV0IHZpO1xyXG4gIGlmICh0eXBlID09IFwiY3ViZVwiKSB2aSA9IGN1YmVDcmVhdGUoKTtcclxuICBpZiAodHlwZSA9PSBcImVhcnRoXCIpIHZpID0gZWFydGhDcmVhdGUoKTtcclxuICBsZXQgdmVydCA9IHZpWzBdLFxyXG4gICAgaW5kID0gdmlbMV07XHJcblxyXG4gIGxldCB2ZXJ0ZXhBcnJheSA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgZ2wuYmluZFZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcclxuICBsZXQgdmVydGV4QnVmZmVyID0gdmVydGV4X2J1ZmZlcih2ZXJ0LCBnbCksIGluZGV4QnVmZmVyLCBpbmRsZW47XHJcblxyXG4gIGlmIChpbmQgIT0gbnVsbClcclxuICAgIGluZGV4QnVmZmVyID0gaW5kZXhfYnVmZmVyKGluZCwgZ2wpLCBpbmRsZW4gPSBpbmQubGVuZ3RoO1xyXG4gIGVsc2UgaW5kZXhCdWZmZXIgPSBudWxsLCBpbmRsZW4gPSBudWxsO1xyXG5cclxuICByZXR1cm4gbmV3IF9wcmltKFxyXG4gICAgZ2wsXHJcbiAgICBuYW1lLFxyXG4gICAgdHlwZSxcclxuICAgIG10bCxcclxuICAgIHBvcyxcclxuICAgIHZlcnRleEJ1ZmZlcixcclxuICAgIGluZGV4QnVmZmVyLFxyXG4gICAgdmVydGV4QXJyYXksXHJcbiAgICBpbmRsZW4sXHJcbiAgICB2ZXJ0Lmxlbmd0aCxcclxuICAgIHNpZGVcclxuICApO1xyXG59IiwiY2xhc3MgX3RpbWVyIHtcclxuICAvLyBUaW1lciBvYnRhaW4gY3VycmVudCB0aW1lIGluIHNlY29uZHMgbWV0aG9kXHJcbiAgZ2V0VGltZSgpIHtcclxuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgbGV0IHQgPVxyXG4gICAgICBkYXRlLmdldE1pbGxpc2Vjb25kcygpIC8gMTAwMC4wICtcclxuICAgICAgZGF0ZS5nZXRTZWNvbmRzKCkgK1xyXG4gICAgICBkYXRlLmdldE1pbnV0ZXMoKSAqIDYwO1xyXG4gICAgcmV0dXJuIHQ7XHJcbiAgfTtcclxuXHJcbiAgLy8gVGltZXIgcmVzcG9uc2UgbWV0aG9kXHJcbiAgcmVzcG9uc2UoKSB7XHJcbiAgICBsZXQgdCA9IHRoaXMuZ2V0VGltZSgpO1xyXG4gICAgLy8gR2xvYmFsIHRpbWVcclxuICAgIHRoaXMuZ2xvYmFsVGltZSA9IHQ7XHJcbiAgICB0aGlzLmdsb2JhbERlbHRhVGltZSA9IHQgLSB0aGlzLm9sZFRpbWU7XHJcbiAgICAvLyBUaW1lIHdpdGggcGF1c2VcclxuICAgIGlmICh0aGlzLmlzUGF1c2UpIHtcclxuICAgICAgdGhpcy5sb2NhbERlbHRhVGltZSA9IDA7XHJcbiAgICAgIHRoaXMucGF1c2VUaW1lICs9IHQgLSB0aGlzLm9sZFRpbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmxvY2FsRGVsdGFUaW1lID0gdGhpcy5nbG9iYWxEZWx0YVRpbWU7XHJcbiAgICAgIHRoaXMubG9jYWxUaW1lID0gdCAtIHRoaXMucGF1c2VUaW1lIC0gdGhpcy5zdGFydFRpbWU7XHJcbiAgICB9XHJcbiAgICAvLyBGUFNcclxuICAgIHRoaXMuZnJhbWVDb3VudGVyKys7XHJcbiAgICBpZiAodCAtIHRoaXMub2xkVGltZUZQUyA+IDMpIHtcclxuICAgICAgdGhpcy5GUFMgPSB0aGlzLmZyYW1lQ291bnRlciAvICh0IC0gdGhpcy5vbGRUaW1lRlBTKTtcclxuICAgICAgdGhpcy5vbGRUaW1lRlBTID0gdDtcclxuICAgICAgdGhpcy5mcmFtZUNvdW50ZXIgPSAwO1xyXG4gICAgICAvL2lmICh0YWdfaWQgIT0gbnVsbClcclxuICAgICAgLy8gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhZ19pZCkuaW5uZXJIVE1MID0gdGhpcy5nZXRGUFMoKTtcclxuICAgIH1cclxuICAgIHRoaXMub2xkVGltZSA9IHQ7XHJcbiAgfTtcclxuIFxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgLy8gRmlsbCB0aW1lciBnbG9iYWwgZGF0YVxyXG4gICAgdGhpcy5nbG9iYWxUaW1lID0gdGhpcy5sb2NhbFRpbWUgPSB0aGlzLmdldFRpbWUoKTtcclxuICAgIHRoaXMuZ2xvYmFsRGVsdGFUaW1lID0gdGhpcy5sb2NhbERlbHRhVGltZSA9IDA7XHJcbiAgXHJcbiAgICAvLyBGaWxsIHRpbWVyIHNlbWkgZ2xvYmFsIGRhdGFcclxuICAgIHRoaXMuc3RhcnRUaW1lID0gdGhpcy5vbGRUaW1lID0gdGhpcy5vbGRUaW1lRlBTID0gdGhpcy5nbG9iYWxUaW1lO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ZXIgPSAwO1xyXG4gICAgdGhpcy5pc1BhdXNlID0gZmFsc2U7XHJcbiAgICB0aGlzLkZQUyA9IDMwLjA7XHJcbiAgICB0aGlzLnBhdXNlVGltZSA9IDA7XHJcbiAgfVxyXG4gIC8vIE9idGFpbiBGUFMgYXMgc3RyaW5nIG1ldGhvZFxyXG4gIGdldEZQUyA9ICgpID0+IHRoaXMuRlBTLnRvRml4ZWQoMyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aW1lcigpIHtcclxuICByZXR1cm4gbmV3IF90aW1lcigpO1xyXG59IiwiaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuL3ZlYzMuanNcIjtcclxuaW1wb3J0IHsgbWF0NCB9IGZyb20gXCIuL21hdDQuanNcIjtcclxuXHJcbmNvbnN0IEQyUiA9IGRlZ3JlZXMgPT4gZGVncmVlcyAqIE1hdGguUEkgLyAxODA7XHJcbmNvbnN0IFIyRCA9IHJhZGlhbnMgPT4gcmFkaWFucyAqIDE4MCAvIE1hdGguUEk7XHJcbiBcclxuZnVuY3Rpb24gZGlzdGFuY2UocDEsIHAyKSB7XHJcbiAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwMS5jbGllbnRYIC0gcDIuY2xpZW50WCwgMikgKyBNYXRoLnBvdyhwMS5jbGllbnRZIC0gcDIuY2xpZW50WSwgMikpO1xyXG59XHJcbiBcclxuZXhwb3J0IGNsYXNzIGlucHV0IHtcclxuICBjb25zdHJ1Y3RvcihybmQpIHtcclxuICAgIC8vZ2wuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHRoaXMub25DbGljayhlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLm9uTW91c2VNb3ZlKGUpKTtcclxuICAgIHJuZC5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIChlKSA9PiB0aGlzLm9uTW91c2VXaGVlbChlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLm9uTW91c2VEb3duKGUpKTtcclxuICAgIHJuZC5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlKSA9PiB0aGlzLm9uTW91c2VVcChlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgKGUpID0+IGUucHJldmVudERlZmF1bHQoKSk7XHJcbiAgICBpZiAoJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XHJcbiAgICAgIHJuZC5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLm9uVG91Y2hTdGFydChlKSk7XHJcbiAgICAgIHJuZC5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMub25Ub3VjaE1vdmUoZSkpO1xyXG4gICAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMub25Ub3VjaEVuZChlKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4gdGhpcy5vbktleURvd24oZSkpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGUpID0+IHRoaXMub25LZXlVcChlKSk7XHJcbiAgICBcclxuICAgIHRoaXMubVggPSAwO1xyXG4gICAgdGhpcy5tWSA9IDA7XHJcbiAgICB0aGlzLm1aID0gMDtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuICAgIHRoaXMubUJ1dHRvbnMgPSBbMCwgMCwgMCwgMCwgMF07XHJcbiAgICB0aGlzLm1CdXR0b25zT2xkID0gWzAsIDAsIDAsIDAsIDBdO1xyXG4gICAgdGhpcy5tQnV0dG9uc0NsaWNrID0gWzAsIDAsIDAsIDAsIDBdO1xyXG4gICAgXHJcbiAgICAvLyBab29tIHNwZWNpZmljXHJcbiAgICB0aGlzLnNjYWxpbmcgPSBmYWxzZTtcclxuICAgIHRoaXMuZGlzdCA9IDA7XHJcbiAgICB0aGlzLnNjYWxlX2ZhY3RvciA9IDEuMDtcclxuICAgIHRoaXMuY3Vycl9zY2FsZSA9IDEuMDtcclxuICAgIHRoaXMubWF4X3pvb20gPSA4LjA7XHJcbiAgICB0aGlzLm1pbl96b29tID0gMC41O1xyXG4gICAgXHJcbiAgICBcclxuICAgIHRoaXMua2V5cyA9IFtdO1xyXG4gICAgdGhpcy5rZXlzT2xkID0gW107XHJcbiAgICB0aGlzLmtleXNDbGljayA9IFtdO1xyXG4gICAgW1xyXG4gICAgICBcIkVudGVyXCIsIFwiQmFja3NwYWNlXCIsXHJcbiAgICAgIFwiRGVsZXRlXCIsIFwiU3BhY2VcIiwgXCJUYWJcIiwgXCJFc2NhcGVcIiwgXCJBcnJvd0xlZnRcIiwgXCJBcnJvd1VwXCIsIFwiQXJyb3dSaWdodFwiLFxyXG4gICAgICBcIkFycm93RG93blwiLCBcIlNoaWZ0XCIsIFwiQ29udHJvbFwiLCBcIkFsdFwiLCBcIlNoaWZ0TGVmdFwiLCBcIlNoaWZ0UmlnaHRcIiwgXCJDb250cm9sTGVmdFwiLFxyXG4gICAgICBcIkNvbnRyb2xSaWdodFwiLCBcIlBhZ2VVcFwiLCBcIlBhZ2VEb3duXCIsIFwiRW5kXCIsIFwiSG9tZVwiLFxyXG4gICAgICBcIkRpZ2l0MFwiLCBcIkRpZ2l0MVwiLFxyXG4gICAgICBcIktleUFcIixcclxuICAgICAgXCJOdW1wYWQwXCIsIFwiTnVtcGFkTXVsdGlwbHlcIixcclxuICAgICAgXCJGMVwiLFxyXG4gICAgXS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHRoaXMua2V5c1trZXldID0gMDtcclxuICAgICAgdGhpcy5rZXlzT2xkW2tleV0gPSAwO1xyXG4gICAgICB0aGlzLmtleXNDbGlja1trZXldID0gMDtcclxuICAgIH0pO1xyXG4gXHJcbiAgICB0aGlzLnNoaWZ0S2V5ID0gZmFsc2U7XHJcbiAgICB0aGlzLmFsdEtleSA9IGZhbHNlO1xyXG4gICAgdGhpcy5jdHJsS2V5ID0gZmFsc2U7XHJcbiBcclxuICAgIHRoaXMuaXNGaXJzdCA9IHRydWU7XHJcbiAgfSAvLyBFbmQgb2YgJ2NvbnN0cnVjdG9yJyBmdW5jdGlvblxyXG4gXHJcbiAgLy8vIE1vdXNlIGhhbmRsZSBmdW5jdGlvbnNcclxuIFxyXG4gIG9uQ2xpY2soZSkge1xyXG4gICAgLy9jcmlhXHJcbiAgfSAvLyBFbmQgb2YgJ29uQ2xpY2snIGZ1bmN0aW9uXHJcbiAgXHJcbiAgb25Ub3VjaFN0YXJ0KGUpIHtcclxuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09IDEpXHJcbiAgICAgIHRoaXMubUJ1dHRvbnNbMF0gPSAxO1xyXG4gICAgZWxzZSBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgIHRoaXMubUJ1dHRvbnNbMF0gPSAwO1xyXG4gICAgICB0aGlzLm1CdXR0b25zWzJdID0gMTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLm1CdXR0b25zWzBdID0gMDtcclxuICAgICAgdGhpcy5tQnV0dG9uc1syXSA9IDA7XHJcbiAgICAgIHRoaXMubUJ1dHRvbnNbMV0gPSAxO1xyXG4gICAgfVxyXG4gICAgbGV0XHJcbiAgICAgIHggPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVggLSBlLnRhcmdldC5vZmZzZXRMZWZ0LFxyXG4gICAgICB5ID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZIC0gZS50YXJnZXQub2Zmc2V0VG9wO1xyXG4gICAgdGhpcy5tRHggPSAwO1xyXG4gICAgdGhpcy5tRHkgPSAwO1xyXG4gICAgdGhpcy5tRHogPSAwO1xyXG4gICAgdGhpcy5tWCA9IHg7XHJcbiAgICB0aGlzLm1ZID0geTtcclxuIFxyXG4gICAgbGV0IHR0ID0gZS50YXJnZXRUb3VjaGVzO1xyXG4gICAgaWYgKHR0Lmxlbmd0aCA+PSAyKSB7XHJcbiAgICAgIHRoaXMuZGlzdCA9IGRpc3RhbmNlKHR0WzBdLCB0dFsxXSk7XHJcbiAgICAgIHRoaXMuc2NhbGluZyA9IHRydWU7XHJcbiAgICB9IGVsc2UgeyAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgIHRoaXMuc2NhbGluZyA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0gLy8gRW5kIG9mICdvblRvdWNoU3RhcnQnIGZ1bmN0aW9uXHJcbiBcclxuICBvblRvdWNoTW92ZShlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiBcclxuICAgIGxldFxyXG4gICAgICB4ID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZS50YXJnZXQub2Zmc2V0TGVmdCxcclxuICAgICAgeSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGUudGFyZ2V0Lm9mZnNldFRvcDtcclxuIFxyXG4gICAgbGV0IHR0ID0gZS50YXJnZXRUb3VjaGVzO1xyXG5cclxuICAgIGlmICh0aGlzLnNjYWxpbmcpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgdGhpcy5tRHogPSAwO1xyXG4gICAgICB0aGlzLmN1cnJfc2NhbGUgPSAoZGlzdGFuY2UodHRbMF0sIHR0WzFdKSAvIHRoaXMuZGlzdCkgKiB0aGlzLnNjYWxlX2ZhY3RvcjtcclxuIFxyXG4gICAgICBsZXQgZCA9IGRpc3RhbmNlKHR0WzBdLCB0dFsxXSk7XHJcbiAgICAgIGlmIChNYXRoLmFicyhkIC0gdGhpcy5kaXN0KSA+IDApIHsvLzQ3KSB7XHJcbiAgICAgICAgaWYgKGQgPCB0aGlzLmRpc3QpXHJcbiAgICAgICAgICB0aGlzLm1EeiA9IDEgKiAoZCAvIHRoaXMuZGlzdCksIHRoaXMuZGlzdCA9IGQ7XHJcbiAgICAgICAgZWxzZSBpZiAoZCA+IHRoaXMuZGlzdClcclxuICAgICAgICAgIHRoaXMubUR6ID0gLTEgKiAodGhpcy5kaXN0IC8gZCksIHRoaXMuZGlzdCA9IGQ7XHJcbiAgICAgICAgdGhpcy5tWiArPSB0aGlzLm1EejtcclxuIFxyXG4gICAgICAgIHRoaXMubUR4ID0geCAtIHRoaXMubVg7XHJcbiAgICAgICAgdGhpcy5tRHkgPSB5IC0gdGhpcy5tWTtcclxuICAgICAgICB0aGlzLm1YID0geDtcclxuICAgICAgICB0aGlzLm1ZID0geTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuIFxyXG4gICAgaWYgKHRoaXMubUJ1dHRvbnNbMV0gPT0gMSkge1xyXG4gICAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICAgIHRoaXMubUR5ID0gMDtcclxuICAgICAgdGhpcy5tRHogPSB5IC0gdGhpcy5tWjtcclxuICAgICAgdGhpcy5tWCA9IHg7XHJcbiAgICAgIHRoaXMubVkgPSB5O1xyXG4gICAgICB0aGlzLm1aICs9IHRoaXMubUR6O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5tRHggPSB4IC0gdGhpcy5tWDtcclxuICAgICAgdGhpcy5tRHkgPSB5IC0gdGhpcy5tWTtcclxuICAgICAgdGhpcy5tRHogPSAwO1xyXG4gICAgICB0aGlzLm1YID0geDtcclxuICAgICAgdGhpcy5tWSA9IHk7XHJcbiAgICB9ICBcclxuICB9IC8vIEVuZCBvZiAnb25Ub3VjaE1vdmUnIGZ1bmN0aW9uXHJcbiBcclxuICBvblRvdWNoRW5kKGUpIHtcclxuICAgIHRoaXMubUJ1dHRvbnNbMF0gPSAwO1xyXG4gICAgdGhpcy5tQnV0dG9uc1sxXSA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zWzJdID0gMDtcclxuICAgIGxldFxyXG4gICAgICB4ID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZS50YXJnZXQub2Zmc2V0TGVmdCxcclxuICAgICAgeSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGUudGFyZ2V0Lm9mZnNldFRvcDtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuICAgIHRoaXMubVggPSB4O1xyXG4gICAgdGhpcy5tWSA9IHk7XHJcbiBcclxuICAgIGxldCB0dCA9IGUudGFyZ2V0VG91Y2hlcztcclxuICAgIGlmICh0dC5sZW5ndGggPCAyKSB7XHJcbiAgICAgIHRoaXMuc2NhbGluZyA9IGZhbHNlO1xyXG4gICAgICBpZiAodGhpcy5jdXJyX3NjYWxlIDwgdGhpcy5taW5fem9vbSkge1xyXG4gICAgICAgIHRoaXMuc2NhbGVfZmFjdG9yID0gdGhpcy5taW5fem9vbTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5jdXJyX3NjYWxlID4gdGhpcy5tYXhfem9vbSkge1xyXG4gICAgICAgICAgdGhpcy5zY2FsZV9mYWN0b3IgPSB0aGlzLm1heF96b29tOyBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zY2FsZV9mYWN0b3IgPSB0aGlzLmN1cnJfc2NhbGU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnNjYWxpbmcgPSB0cnVlO1xyXG4gICAgfVxyXG4gIH0gLy8gRW5kIG9mICdvblRvdWNoTW92ZScgZnVuY3Rpb25cclxuIFxyXG4gIG9uTW91c2VNb3ZlKGUpIHtcclxuICAgIGxldFxyXG4gICAgICBkeCA9IGUubW92ZW1lbnRYLFxyXG4gICAgICBkeSA9IGUubW92ZW1lbnRZO1xyXG4gICAgdGhpcy5tRHggPSBkeDtcclxuICAgIHRoaXMubUR5ID0gZHk7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1YICs9IGR4O1xyXG4gICAgdGhpcy5tWSArPSBkeTtcclxuICB9IC8vIEVuZCBvZiAnb25Nb3VzZU1vdmUnIGZ1bmN0aW9uXHJcbiBcclxuICBvbk1vdXNlV2hlZWwoZSkge1xyXG4gICAgaWYgKGUud2hlZWxEZWx0YSAhPSAwKVxyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLm1aICs9ICh0aGlzLm1EeiA9IGUud2hlZWxEZWx0YSAvIDEyMCk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uTW91c2VXaGVlbCcgZnVuY3Rpb25cclxuIFxyXG4gIG9uTW91c2VEb3duKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuIFxyXG4gICAgdGhpcy5tQnV0dG9uc09sZFtlLmJ1dHRvbl0gPSB0aGlzLm1CdXR0b25zW2UuYnV0dG9uXTtcclxuICAgIHRoaXMubUJ1dHRvbnNbZS5idXR0b25dID0gMTtcclxuICAgIHRoaXMubUJ1dHRvbnNDbGlja1tlLmJ1dHRvbl0gPSAhdGhpcy5tQnV0dG9uc09sZFtlLmJ1dHRvbl0gJiYgdGhpcy5tQnV0dG9uc1tlLmJ1dHRvbl07XHJcbiAgICBcclxuICAgIHRoaXMuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5O1xyXG4gICAgdGhpcy5hbHRLZXkgPSBlLmFsdEtleTtcclxuICAgIHRoaXMuY3RybEtleSA9IGUuY3RybEtleTtcclxuICB9IC8vIEVuZCBvZiAnb25Nb3VzZU1vdmUnIGZ1bmN0aW9uXHJcbiAgXHJcbiAgb25Nb3VzZVVwKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuIFxyXG4gICAgdGhpcy5tQnV0dG9uc09sZFtlLmJ1dHRvbl0gPSB0aGlzLm1CdXR0b25zW2UuYnV0dG9uXTtcclxuICAgIHRoaXMubUJ1dHRvbnNbZS5idXR0b25dID0gMDtcclxuICAgIHRoaXMubUJ1dHRvbnNDbGlja1tlLmJ1dHRvbl0gPSAwO1xyXG4gXHJcbiAgICB0aGlzLnNoaWZ0S2V5ID0gZS5zaGlmdEtleTtcclxuICAgIHRoaXMuYWx0S2V5ID0gZS5hbHRLZXk7XHJcbiAgICB0aGlzLmN0cmxLZXkgPSBlLmN0cmxLZXk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uTW91c2VNb3ZlJyBmdW5jdGlvblxyXG4gXHJcbiAgLy8vIEtleWJvYXJkIGhhbmRsZVxyXG4gIG9uS2V5RG93bihlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09ICd0ZXh0YXJlYScpXHJcbiAgICAgIHJldHVybjtcclxuICAgIGxldCBmb2N1c2VkX2VsZW1lbnQgPSBudWxsO1xyXG4gICAgaWYgKGRvY3VtZW50Lmhhc0ZvY3VzKCkgJiZcclxuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSBkb2N1bWVudC5ib2R5ICYmXHJcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XHJcbiAgICAgIGZvY3VzZWRfZWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XHJcbiAgICAgIGlmIChmb2N1c2VkX2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09ICd0ZXh0YXJlYScpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfSAgICAgIFxyXG4gICAgaWYgKGUuY29kZSAhPSBcIkYxMlwiICYmIGUuY29kZSAhPSBcIkYxMVwiICYmIGUuY29kZSAhPSBcIktleVJcIilcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpcy5rZXlzT2xkW2UuY29kZV0gPSB0aGlzLmtleXNbZS5jb2RlXTtcclxuICAgIHRoaXMua2V5c1tlLmNvZGVdID0gMTtcclxuICAgIHRoaXMua2V5c0NsaWNrW2UuY29kZV0gPSAhdGhpcy5rZXlzT2xkW2UuY29kZV0gJiYgdGhpcy5rZXlzW2UuY29kZV07XHJcbiAgICBcclxuICAgIHRoaXMuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5O1xyXG4gICAgdGhpcy5hbHRLZXkgPSBlLmFsdEtleTtcclxuICAgIHRoaXMuY3RybEtleSA9IGUuY3RybEtleTtcclxuICB9IC8vIEVuZCBvZiAnb25LZXlEb3duJyBmdW5jdGlvblxyXG4gIFxyXG4gIG9uS2V5VXAoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAndGV4dGFyZWEnKVxyXG4gICAgICByZXR1cm47XHJcbiAgICBsZXQgZm9jdXNlZF9lbGVtZW50ID0gbnVsbDtcclxuICAgIGlmIChkb2N1bWVudC5oYXNGb2N1cygpICYmXHJcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSAmJlxyXG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG4gICAgICBmb2N1c2VkX2VsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xyXG4gICAgICBpZiAoZm9jdXNlZF9lbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAndGV4dGFyZWEnKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH0gICAgICBcclxuICAgIGlmIChlLmNvZGUgIT0gXCJGMTJcIiAmJiBlLmNvZGUgIT0gXCJGMTFcIiAmJiBlLmNvZGUgIT0gXCJLZXlSXCIpXHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMua2V5c09sZFtlLmNvZGVdID0gdGhpcy5rZXlzW2UuY29kZV07XHJcbiAgICB0aGlzLmtleXNbZS5jb2RlXSA9IDA7XHJcbiAgICB0aGlzLmtleXNDbGlja1tlLmNvZGVdID0gMDtcclxuIFxyXG4gICAgdGhpcy5zaGlmdEtleSA9IGUuc2hpZnRLZXk7XHJcbiAgICB0aGlzLmFsdEtleSA9IGUuYWx0S2V5O1xyXG4gICAgdGhpcy5jdHJsS2V5ID0gZS5jdHJsS2V5O1xyXG4gIH0gLy8gRW5kIG9mICdvbktleVVwJyBmdW5jdGlvblxyXG4gIFxyXG4gIC8vLyBDYW1lcmEgbW92ZW1lbnQgaGFuZGxpbmdcclxuICByZXNldCgpIHtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuICAgIHRoaXMubUJ1dHRvbnNDbGljay5mb3JFYWNoKGsgPT4gdGhpcy5tQnV0dG9uc0NsaWNrW2tdID0gMCk7XHJcbiAgICB0aGlzLmtleXNDbGljay5mb3JFYWNoKGsgPT4gdGhpcy5rZXlzQ2xpY2tba10gPSAwKTtcclxuIFxyXG4gICAgdGhpcy5zaGlmdEtleSA9IHRoaXMua2V5c1tcIlNoaWZ0TGVmdFwiXSB8fCB0aGlzLmtleXNbXCJTaGlmdFJpZ2h0XCJdO1xyXG4gICAgdGhpcy5hbHRLZXkgPSB0aGlzLmtleXNbXCJBbHRMZWZ0XCJdIHx8IHRoaXMua2V5c1tcIkFsdFJpZ2h0XCJdO1xyXG4gICAgdGhpcy5jdHJsS2V5ID0gdGhpcy5rZXlzW1wiQ29udHJvbExlZnRcIl0gfHwgdGhpcy5rZXlzW1wiQ29udHJvbFJpZ2h0XCJdO1xyXG4gIH0gLy8gRW5kIG9mIHJlc2V0JyBmdW5jdGlvblxyXG4gICAgICAgICAgXHJcbiAgcmVzcG9uc2VDYW1lcmEocm5kKSB7XHJcbiAgICBpZiAodGhpcy5zaGlmdEtleSAmJiB0aGlzLmtleXNDbGlja1tcIktleUZcIl0pIHtcclxuICAgICAgcm5kLmNhbSA9IHJuZC5jYW0uY2FtU2V0KHZlYzMoNiksIHZlYzMoMCksIHZlYzMoMCwgMSwgMCkpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5jdHJsS2V5KSB7XHJcbiAgICAgIC8vIEhhbmRsZSBjYW1lcmEgb3JpZW50YXRpb25cclxuICAgICAgbGV0XHJcbiAgICAgICAgRGlzdCA9IHJuZC5jYW0uYXQuc3ViKHJuZC5jYW0ubG9jKS5sZW4oKSxcclxuICAgICAgICBjb3NUID0gKHJuZC5jYW0ubG9jLnkgLSBybmQuY2FtLmF0LnkpIC8gRGlzdCxcclxuICAgICAgICBzaW5UID0gTWF0aC5zcXJ0KDEgLSBjb3NUICogY29zVCksXHJcbiAgICAgICAgcGxlbiA9IERpc3QgKiBzaW5ULFxyXG4gICAgICAgIGNvc1AgPSAocm5kLmNhbS5sb2MueiAtIHJuZC5jYW0uYXQueikgLyBwbGVuLFxyXG4gICAgICAgIHNpblAgPSAocm5kLmNhbS5sb2MueCAtIHJuZC5jYW0uYXQueCkgLyBwbGVuLFxyXG4gICAgICAgIGF6aW11dGggPSBSMkQoTWF0aC5hdGFuMihzaW5QLCBjb3NQKSksXHJcbiAgICAgICAgZWxldmF0b3IgPSBSMkQoTWF0aC5hdGFuMihzaW5ULCBjb3NUKSk7XHJcbiBcclxuICAgICAgYXppbXV0aCArPSBybmQudGltZXIuZ2xvYmFsRGVsdGFUaW1lICogMyAqXHJcbiAgICAgICAgKC0zMCAqIHRoaXMubUJ1dHRvbnNbMF0gKiB0aGlzLm1EeCArXHJcbiAgICAgICAgIDQ3ICogKHRoaXMua2V5c1tcIkFycm93TGVmdFwiXSAtIHRoaXMua2V5c1tcIkFycm93UmlnaHRcIl0pKTtcclxuIFxyXG4gICAgICBlbGV2YXRvciArPSBybmQudGltZXIuZ2xvYmFsRGVsdGFUaW1lICogMiAqXHJcbiAgICAgICAgKC0zMCAqIHRoaXMubUJ1dHRvbnNbMF0gKiB0aGlzLm1EeSArXHJcbiAgICAgICAgIDQ3ICogKHRoaXMua2V5c1tcIkFycm93VXBcIl0gLSB0aGlzLmtleXNbXCJBcnJvd0Rvd25cIl0pKTtcclxuICAgICAgaWYgKGVsZXZhdG9yIDwgMC4wOClcclxuICAgICAgICBlbGV2YXRvciA9IDAuMDg7XHJcbiAgICAgIGVsc2UgaWYgKGVsZXZhdG9yID4gMTc4LjkwKVxyXG4gICAgICAgIGVsZXZhdG9yID0gMTc4LjkwO1xyXG4gXHJcbiAgICAgIERpc3QgKz0gcm5kLnRpbWVyLmdsb2JhbERlbHRhVGltZSAqICgxICsgdGhpcy5zaGlmdEtleSAqIDE4KSAqXHJcbiAgICAgICAgKDggKiB0aGlzLm1EeiArXHJcbiAgICAgICAgIDggKiAodGhpcy5rZXlzW1wiUGFnZVVwXCJdIC0gdGhpcy5rZXlzW1wiUGFnZURvd25cIl0pKTtcclxuICAgICAgaWYgKERpc3QgPCAwLjEpXHJcbiAgICAgICAgRGlzdCA9IDAuMTtcclxuIFxyXG4gICAgICAvKiBIYW5kbGUgY2FtZXJhIHBvc2l0aW9uICovXHJcbiAgICAgIGlmICh0aGlzLm1CdXR0b25zWzJdKSB7XHJcbiAgICAgICAgbGV0IFdwID0gcm5kLmNhbS5wcm9qU2l6ZTtcclxuICAgICAgICBsZXQgSHAgPSBybmQuY2FtLnByb2pTaXplO1xyXG4gICAgICAgIGlmIChybmQuY2FtLmZyYW1lVyA+IHJuZC5jYW0uZnJhbWVIKVxyXG4gICAgICAgICAgV3AgKj0gcm5kLmNhbS5mcmFtZVcgLyBybmQuY2FtLmZyYW1lSDtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBIcCAqPSBybmQuY2FtLmZyYW1lSCAvIHJuZC5jYW0uZnJhbWVXO1xyXG4gICAgICAgIGxldCBzeCA9IC10aGlzLm1EeCAqIFdwIC8gcm5kLmNhbS5mcmFtZVcgKiBEaXN0IC8gcm5kLmNhbS5wcm9qRGlzdDtcclxuICAgICAgICBsZXQgc3kgPSB0aGlzLm1EeSAqIEhwIC8gcm5kLmNhbS5mcmFtZUggKiBEaXN0IC8gcm5kLmNhbS5wcm9qRGlzdDtcclxuIFxyXG4gICAgICAgIGxldCBkdiA9IHJuZC5jYW0ucmlnaHQubXVsTnVtKHN4KS5hZGQocm5kLmNhbS51cC5tdWxOdW0oc3kpKTtcclxuICAgICAgICBybmQuY2FtLmF0ID0gcm5kLmNhbS5hdC5hZGQoZHYpO1xyXG4gICAgICAgIHJuZC5jYW0ubG9jID0gcm5kLmNhbS5sb2MuYWRkKGR2KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IGxvYyA9IG1hdDQoKS5tYXRyUm90YXRlKGVsZXZhdG9yLCB2ZWMzKDEsIDAsIDApKS5tYXRyTXVsTWF0cjIoXHJcbiAgICAgICAgICAgICAgICAgICAgICBtYXQ0KCkubWF0clJvdGF0ZShhemltdXRoLCB2ZWMzKDAsIDEsIDApKS5tYXRyTXVsTWF0cjIoIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXQ0KCkubWF0clRyYW5zbGF0ZShybmQuY2FtLmF0KSkpLnRyYW5zZm9ybVBvaW50KHZlYzMoMCwgRGlzdCwgMCkpXHJcbiAgICAgIC8qIFNldHVwIHJlc3VsdCBjYW1lcmEgKi9cclxuICAgICAgcm5kLmNhbSA9IHJuZC5jYW0uY2FtU2V0KGxvYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBybmQuY2FtLmF0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZlYzMoMCwgMSwgMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICBtYXRyUm90YXRlKGF6aW11dGgsIHZlYzMoMCwgMSwgMCkpLm1hdHJNdWxNYXRyMiggXHJcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgIG1hdHJUcmFuc2xhdGUocm5kLmNhbS5hdCkpKS50cmFuc2Zvcm1Qb2ludCh2ZWMzKDAsIERpc3QsIDApKSxcclxuICAgICAgLy8gICAgICAgICAgIHJuZC5jYW0uYXQsXHJcbiAgICAgIC8vICAgICAgICAgICB2ZWMzKDAsIDEsIDApXHJcbiAgICAgIC8vICAgICAgICAgICApO1xyXG4gICAgfVxyXG4gIH0gLy8gRW5kIG9mICdyZXNwb25zZdGBQ2FtZXJhJyBmdW5jdGlvblxyXG59IC8vIEVuZCBvZiAnaW5wdXQnIGNsYXNzXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5wdXRfaW5pdChybmQpIHtcclxuICAgIHJldHVybiBuZXcgaW5wdXQocm5kKTtcclxufSIsImltcG9ydCB7IHByaW1DcmVhdGUgfSBmcm9tIFwiLi4vcHJpbXMvcHJpbS5qc1wiO1xyXG5pbXBvcnQgeyBtYXQ0IH0gZnJvbSBcIi4uL210aC9tYXQ0LmpzXCI7XHJcbmltcG9ydCB7IHZlYzMgfSBmcm9tIFwiLi4vbXRoL3ZlYzMuanNcIjtcclxuaW1wb3J0IHsgdGltZXIgfSBmcm9tIFwiLi4vdGltZS90aW1lci5qc1wiO1xyXG5pbXBvcnQgeyBpbnB1dF9pbml0IH0gZnJvbSBcIi4uL210aC9pbnB1dC5qc1wiO1xyXG5cclxuY2xhc3MgX3JlbmRlciB7XHJcbiAgY29uc3RydWN0b3IoY2FudmFzLCBuYW1lLCBjYW1lcmEpIHtcclxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMuZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiKTtcclxuICAgIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuREVQVEhfVEVTVCk7XHJcbiAgICB0aGlzLmdsLmNsZWFyQ29sb3IoMC45LCAwLjcsIDAuNywgMSk7XHJcbiAgICB0aGlzLnByZyA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgdGhpcy50aW1lciA9IHRpbWVyKCk7XHJcbiAgICB0aGlzLnByaW1zID0gW107XHJcbiAgICB0aGlzLmlucHV0ID0gaW5wdXRfaW5pdCh0aGlzKTtcclxuICAgIHRoaXMuY2FtID0gY2FtZXJhO1xyXG4gIH1cclxuXHJcbiAgcHJpbUF0dGFjaChuYW1lLCB0eXBlLCBzaGRfbmFtZSwgcG9zLCBzaWRlPTMpIHtcclxuICAgIGxldCBwID0gcHJpbUNyZWF0ZShuYW1lLCB0eXBlLCBzaGRfbmFtZSwgcG9zLCBzaWRlLCB0aGlzLmdsKTtcclxuICAgIHRoaXMucHJpbXNbdGhpcy5wcmltcy5sZW5ndGhdID0gcDtcclxuICB9XHJcblxyXG4gIHByb2dyYW1Vbmlmb3JtcyhzaGQpIHtcclxuICAgIGlmIChzaGQudW5pZm9ybXNbXCJtYXRyVmlld1wiXSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgLy9sZXQgbSA9IG1hdDQoKS5tYXRyVmlldyh2ZWMzKDUsIDMsIDUpLCB2ZWMzKDAsIDAsIDApLCB2ZWMzKDAsIDEsIDApKTtcclxuICAgICAgbGV0IGFyciA9IHRoaXMuY2FtLm1hdHJWaWV3LnRvQXJyYXkoKTtcclxuICAgICAgbGV0IG1WTG9jID0gc2hkLnVuaWZvcm1zW1wibWF0clZpZXdcIl0ubG9jO1xyXG4gICAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobVZMb2MsIGZhbHNlLCBhcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzaGQudW5pZm9ybXNbXCJtYXRyVmlld1wiXSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgLy9sZXQgbTEgPSBtYXQ0KCkubWF0ckZydXN0dW0oLTAuMDgsIDAuMDgsIC0wLjA4LCAwLjA4LCAwLjEsIDIwMCk7XHJcbiAgICAgIGxldCBhcnIxID0gdGhpcy5jYW0ubWF0clByb2oudG9BcnJheSgpO1xyXG4gICAgICBsZXQgbVBMb2MgPSBzaGQudW5pZm9ybXNbXCJtYXRyUHJvalwiXS5sb2M7XHJcbiAgICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihtUExvYywgZmFsc2UsIGFycjEpO1xyXG4gICAgfSAgICBcclxuICB9XHJcblxyXG4gIHRyYW5zZm9ybVByb2dyYW1Vbmlmb3JtcyhzaGQpIHtcclxuICAgIGlmIChzaGQudW5pZm9ybXNbXCJUaW1lXCJdID09IHVuZGVmaW5lZClcclxuICAgICAgcmV0dXJuO1xyXG4gICAgbGV0IHRpbWVMb2MgPSBzaGQudW5pZm9ybXNbXCJUaW1lXCJdLmxvYztcclxuXHJcbiAgICB0aGlzLmdsLnVuaWZvcm0xZih0aW1lTG9jLCB0aGlzLnRpbWVyLmdsb2JhbFRpbWUpO1xyXG4gICAgfVxyXG4gIFxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICB0aGlzLmdsLmNsZWFyKHRoaXMuZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XHJcbiAgICB0aGlzLnRpbWVyLnJlc3BvbnNlKCk7XHJcbiAgICB0aGlzLmlucHV0LnJlc3BvbnNlQ2FtZXJhKHRoaXMpO1xyXG4gICAgZm9yIChjb25zdCBwIG9mIHRoaXMucHJpbXMpIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHAubXRsLnNoYWRlci5pZCAhPSBudWxsICYmXHJcbiAgICAgICAgcC5tdGwuc2hhZGVyLnNoYWRlcnNbMF0uaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgIHAubXRsLnNoYWRlci5zaGFkZXJzWzFdLmlkICE9IG51bGwgJiZcclxuICAgICAgICBwLnNoZElzTG9hZGVkID09IG51bGxcclxuICAgICAgKSB7XHJcbiAgICAgICAgdGhpcy5pbnB1dC5yZXNldCgpO1xyXG4gICAgICAgIHAubXRsLnNoYWRlci5hcHBseSgpO1xyXG4gICAgICAgIHRoaXMucHJvZ3JhbVVuaWZvcm1zKHAubXRsLnNoYWRlcik7XHJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Qcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hhZGVyKTtcclxuICAgICAgICBwLnJlbmRlcih0aGlzLnRpbWVyKTtcclxuICAgICAgICBwLnNoZElzTG9hZGVkID0gMTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHAuc2hkSXNMb2FkZWQgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICBwLm10bC5zaGFkZXIuYXBwbHkoKTtcclxuICAgICAgdGhpcy50cmFuc2Zvcm1Qcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hhZGVyKTtcclxuICAgICAgcC5yZW5kZXIodGhpcy50aW1lcik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ3JlYXRlKGNhbnZhcywgbmFtZSwgY2FtZXJhKSB7XHJcbiAgcmV0dXJuIG5ldyBfcmVuZGVyKGNhbnZhcywgbmFtZSwgY2FtZXJhKTtcclxufVxyXG4iLCJpbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4vdmVjM1wiO1xyXG5pbXBvcnQgeyBtYXQ0IH0gZnJvbSBcIi4vbWF0NFwiO1xyXG5cclxuY2xhc3MgX2NhbWVyYSB7XHJcbiAgICBjb25zdHJ1Y3Rvcih3LCBoKSB7XHJcbiAgICAgICAgdGhpcy5hdCA9IHZlYzMoMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5sb2MgPSB2ZWMzKDUsIDUsIDUpO1xyXG4gICAgICAgIHRoaXMudXAgPSB2ZWMzKDAsIDEsIDApO1xyXG4gICAgICAgIHRoaXMubWF0clZpZXcgPSBudWxsLCB0aGlzLm1hdHJWUCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5kaXIgPSBudWxsLCB0aGlzLnJpZ2h0ID0gbnVsbDtcclxuICAgICAgICBpZiAoaCA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGggPSB3O1xyXG4gICAgICAgIHRoaXMuZnJhbWVXID0gdywgdGhpcy5mcmFtZUggPSBoOyBcclxuICAgIH1cclxuXHJcbiAgICBjYW1TZXQobG9jLCBhdCwgdXApIHtcclxuICAgICAgICBpZiAobG9jID09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgbG9jID0gdGhpcy5sb2M7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9jID0gbG9jO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYXQgPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBhdCA9IHRoaXMuYXQ7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXQgPSBhdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHVwID09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdXAgPSB0aGlzLnVwO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnVwID0gdXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1hdHJWaWV3ID0gbWF0NCgpLm1hdHJWaWV3KGxvYywgYXQsIHVwKTtcclxuXHJcbiAgICAgICAgdGhpcy5yaWdodCA9IHZlYzModGhpcy5tYXRyVmlldy5hWzBdWzBdLFxyXG4gICAgICAgICAgICB0aGlzLm1hdHJWaWV3LmFbMV1bMF0sXHJcbiAgICAgICAgICAgIHRoaXMubWF0clZpZXcuYVsyXVswXSk7XHJcbiAgICAgICAgdGhpcy51cCA9IHZlYzModGhpcy5tYXRyVmlldy5hWzBdWzFdLFxyXG4gICAgICAgICAgICB0aGlzLm1hdHJWaWV3LmFbMV1bMV0sXHJcbiAgICAgICAgICAgIHRoaXMubWF0clZpZXcuYVsyXVsxXSk7XHJcbiAgICAgICAgdGhpcy5kaXIgPSB2ZWMzKC10aGlzLm1hdHJWaWV3LmFbMF1bMl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtdGhpcy5tYXRyVmlldy5hWzFdWzJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLXRoaXMubWF0clZpZXcuYVsyXVsyXSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY2FtU2V0UHJvaihwcm9qU2l6ZSwgUHJvakRpc3QsIFByb2pGYXJDbGlwKSB7XHJcbiAgICAgICAgbGV0IHJ4LCByeTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9qRGlzdCA9IFByb2pEaXN0O1xyXG4gICAgICAgIHRoaXMucHJvakZhckNsaXAgPSBQcm9qRmFyQ2xpcDtcclxuICAgICAgICByeCA9IHJ5ID0gdGhpcy5wcm9qU2l6ZSA9IHByb2pTaXplO1xyXG4gICAgICBcclxuICAgICAgICAvKiBDb3JyZWN0IGFzcGVjdCByYXRpbyAqL1xyXG4gICAgICAgIGlmICh0aGlzLmZyYW1lVyA+PSB0aGlzLmZyYW1lSClcclxuICAgICAgICAgIHJ4ICo9IHRoaXMuZnJhbWVXIC8gdGhpcy5mcmFtZUg7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgcnkgKj0gdGhpcy5mcmFtZUggLyB0aGlzLmZyYW1lVztcclxuICAgICAgXHJcbiAgICAgICAgdGhpcy53cCA9IHJ4O1xyXG4gICAgICAgIHRoaXMuaHAgPSByeTtcclxuICAgICAgICB0aGlzLm1hdHJQcm9qID1cclxuICAgICAgICAgIG1hdDQoKS5tYXRyRnJ1c3R1bSgtcnggLyAyLCByeCAvIDIsIC1yeSAvIDIsIHJ5IC8gMixcclxuICAgICAgICAgICAgdGhpcy5wcm9qRGlzdCwgdGhpcy5wcm9qRmFyQ2xpcCk7XHJcbiAgICAgICAgdGhpcy5tYXRyVlAgPSB0aGlzLm1hdHJWaWV3Lm1hdHJNdWxNYXRyMih0aGlzLm1hdHJQcm9qKTsgICAgICBcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYW1lcmEodywgaCkge1xyXG4gICAgcmV0dXJuIG5ldyBfY2FtZXJhKHcsIGgpOyBcclxufSIsImltcG9ydCB7IHJlbmRlckNyZWF0ZSB9IGZyb20gXCIuL3JlbmRlci9yZW5kZXJcIjtcclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuL210aC92ZWMzXCI7XHJcbmltcG9ydCB7IGNhbWVyYSB9IGZyb20gXCIuL210aC9jYW1lcmFcIjtcclxubGV0IHJuZDEsIHJuZDI7XHJcblxyXG4vL0NvbW1vbiB1bmlmb3JtIHZhcmlhYmxlc1xyXG4vL2xldCBtYXRyVmlldyA9IG1hdDQoKS5tYXRyVmlldyh2ZWMzKDUsIDUsIDUpLCB2ZWMzKDAsIDAsIDApLCB2ZWMzKDAsIDEsIDApKTtcclxuLy9sZXQgbWF0clByb2ogPSBtYXQ0KCkubWF0ck9ydGhvKC0zLCAzLCAtMywgMywgLTMsIDMpO1xyXG5cclxuLy8gT3BlbkdMIGluaXRpYWxpemF0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0R0woKSB7XHJcbiAgbGV0IGNhbnZhczEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhczFcIik7XHJcbiAgbGV0IGNhbWVyYTEgPSBjYW1lcmEoY2FudmFzMS5jbGllbnRXaWR0aCwgY2FudmFzMS5jbGllbnRIZWlnaHQpLmNhbVNldCgpLmNhbVNldFByb2ooMC4xLCAwLjEsIDMwMCk7XHJcblxyXG4gIGxldCBjYW52YXMyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXMyXCIpO1xyXG4gIGxldCBjYW1lcmEyID0gY2FtZXJhKGNhbnZhczIuY2xpZW50V2lkdGgsIGNhbnZhczIuY2xpZW50SGVpZ2h0KS5jYW1TZXQoKS5jYW1TZXRQcm9qKDAuMSwgMC4xLCAzMDApO1xyXG5cclxuICBybmQxID0gcmVuZGVyQ3JlYXRlKGNhbnZhczEsIFwiZWFydGhcIiwgY2FtZXJhMSk7XHJcblxyXG4gIHJuZDIgPSByZW5kZXJDcmVhdGUoY2FudmFzMiwgXCJkZWZhdWx0XCIsIGNhbWVyYTIpO1xyXG4gIHJuZDIucHJpbUF0dGFjaChcImN1YmVQcmltXCIsIFwiY3ViZVwiLCBcImRlZmF1bHRcIiwgdmVjMygwLCAwLCAwKSk7XHJcbiAgcm5kMS5wcmltQXR0YWNoKFwiRWFydGhcIiwgXCJlYXJ0aFwiLCBcImVhcnRoXCIsIHZlYzMoMCwgMiwgMCksIDMpO1xyXG4gIC8vZm9yIChjb25zdCBwIG9mIHJuZC5wcmltcykgcm5kLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGQpO1xyXG59IC8vIEVuZCBvZiAnaW5pdEdMJyBmdW5jdGlvblxyXG5cclxuLy8gUmVuZGVyIGZ1bmN0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgcm5kMS5nbC5jbGVhcihybmQxLmdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICBybmQxLnJlbmRlcigpO1xyXG5cclxuICBybmQyLmdsLmNsZWFyKHJuZDIuZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XHJcblxyXG4gIHJuZDIucmVuZGVyKCk7XHJcbn1cclxuXHJcbmNvbnNvbGUubG9nKFwibGlicmFyeS5qcyB3YXMgaW1wb3J0ZWRcIik7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xyXG4gIGluaXRHTCgpO1xyXG5cclxuICBjb25zdCBkcmF3ID0gKCkgPT4ge1xyXG4gICAgcmVuZGVyKCk7XHJcblxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3KTtcclxuICB9O1xyXG4gIGRyYXcoKTtcclxufSk7XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7RUFBQSxNQUFNLE9BQU8sQ0FBQztFQUNkLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFO0VBQzlCLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0VBQ25CLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDakIsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRSxPQUFPO0VBQy9DLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7RUFDaEMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDakMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0VBQzlDLEdBQUc7RUFDSCxF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SUFBSSxRQUFRLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUU7RUFDckMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDO0VBQ3pDLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNCO0VBQ0EsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO0VBQzlELFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7RUFDbEUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ25ELFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3ZDLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDdkQsU0FBUztFQUNULFFBQVEsUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN6QyxLQUFLO0FBQ0w7RUFDQSxJ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QUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDaEQsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUU7RUFDVCxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdEQsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLEdBQUcsR0FBRztFQUNSLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUM3QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0VBQ3pDLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxTQUFTLEdBQUc7RUFDZCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0I7RUFDQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQzFDLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN2QyxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRTtFQUNmLElBQUksT0FBTyxJQUFJLEtBQUs7RUFDcEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEUsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEUsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEUsS0FBSyxDQUFDO0VBQ04sR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUU7RUFDakIsSUFBSSxJQUFJLENBQUM7RUFDVCxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0U7RUFDQSxJQUFJLE9BQU8sSUFBSSxLQUFLO0VBQ3BCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDOUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUM5RSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQzlFLEtBQUssQ0FBQztFQUNOLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0VBQ1gsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDakMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNqQyxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtFQUNwQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSztFQUNyQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDM0UsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRSxLQUFLLENBQUM7QUFDTjtFQUNBLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ08sU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDOUIsRUFBRSxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDNUI7O0VDckdBLE1BQU0sS0FBSyxDQUFDO0VBQ1osRUFBRSxXQUFXLEdBQUc7RUFDaEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHO0VBQ2IsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQSxFQUFFLE9BQU8sR0FBRztFQUNaLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNuQixJQUFJLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsYUFBYSxDQUFDLENBQUMsRUFBRTtFQUNuQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7RUFDeEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0VBQ1YsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN4QixLQUFLLENBQUM7RUFDTixJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUU7RUFDbEIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3hCO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRTtFQUN2QixJQUFJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDbEQsR0FBRztBQUNIO0VBQ0EsRUFBRSxXQUFXLEdBQUc7RUFDaEIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0VBQ3hCLElBQUksSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCO0VBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDM0I7RUFDQTtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFO0VBQ3ZCLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLGtCQUFrQixHQUFHLEdBQUc7RUFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QjtFQUNBLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNO0VBQ04sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDL0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNO0VBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMvQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNO0VBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdB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LGFBQWEsR0FBRztFQUNsQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdkQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFF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Q0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUM5QixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM1QixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM1QixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDckUsS0FBSyxDQUFDO0VBQ04sSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7RUFDSDtFQUNBLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtFQUNwQixJQUFJLElBQUksRUFBRSxHQUFHLElBQUk7RUFDakIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqRixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pGLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakYsS0FBSyxDQUFDO0FBQ047RUFDQSxJQUFJLE9BQU8sRUFBRSxDQUFDO0VBQ2QsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0VBQ3BFLEVBQUU7RUFDRixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJO0VBQ0osQ0FBQztBQUNEO0VBQ0EsU0FBUyxVQUFVLENBQUMsQ0FBQyxFQUFFO0VBQ3ZCLEVBQUUsSUFBSSxDQUFDO0VBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixPQUFPO0VBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2QsTUFBTSxhQUFhO0VBQ25CLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLE9BQU87RUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDZCxNQUFNLGFBQWE7RUFDbkIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsT0FBTztFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7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QUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUQsTUFBTSxJQUFJLElBQUksR0FBRyxHQUFHO0VBQ3BCLFFBQVEsSUFBSSxHQUFHLEdBQUcsQ0FBQztFQUNuQjtFQUNBO0VBQ0EsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7RUFDNUIsUUFBUSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztFQUNsQyxRQUFRLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQ2xDLFFBQVEsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU07RUFDM0MsVUFBVSxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7RUFDaEQ7RUFDQSxVQUFVLEVBQUUsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztFQUNoRCxRQUFRLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQzNFLFFBQVEsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQzFFO0VBQ0EsUUFBUSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxD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QUMzQztFQUNBLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7RUFDdEQsS0FBSztFQUNMO0FBQ0E7RUFDQSxFQUFFLE1BQU0sR0FBRztFQUNYLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0VBQzVDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztFQUMxQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ3BDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0VBQ2hDLE1BQU07RUFDTixRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxJQUFJO0VBQy9CLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFJO0VBQzFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFJO0VBQzFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsSUFBSSxJQUFJO0VBQzdCLFFBQVE7RUFDUixRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDM0IsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUM3QixRQUFRLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUMzQyxRQUFRLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ3BELFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FB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
