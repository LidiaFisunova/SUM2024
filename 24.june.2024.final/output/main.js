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
    let vertexes = [],
      w = 100,
      h = 100,
      i,
      j,
      theta,
      phi,
      G = [],
      ind = [],
      x,
      y;
    let pi = Math.acos(-1);

    for (i = 0, theta = 0; i < h; i++, theta += pi / (h - 1)) {
      for (j = 0, phi = 0; j < w; j++, phi += (2 * pi) / (w - 1)) {
        G[0] = Math.sin(theta) * Math.sin(phi);
        G[1] = Math.cos(theta);
        G[2] = Math.sin(theta) * Math.cos(phi);
        vertexes = vertexes.concat(...G);
      }
    }

    for (i = 0, y = 0; y < h - 1; i += 4, y++) {
      for (j = 0, x = 0; j < (2 + w * 2) * 2 - 4; j += 4) {
        //j - count of ind in one row, x - defining a sequence of ind
        ind[i * h + j] = y * h + x;
        if (x == w - 1) {
          ind[i * h + j + 1] = y * h;
        } else ind[i * h + j + 1] = y * h + x + 1;
        ind[i * h + j + 2] = (y + 1) * h + x;
        if (x == w - 1) ind[i * h + j + 3] = (y + 1) * h;
        else ind[i * h + j + 3] = (y + 1) * h + x + 1;

        x++;
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

  class _prim {
    constructor(gl, name, type, mtl, pos, VBuf, IBuf, VA, noofI, noofV, side) {
      this.name = name;
      (this.VBuf = VBuf), (this.IBuf = IBuf), (this.VA = VA); /* render info */
      this.type = type; /* platon figure type */
      this.pos = pos; /* position */

      this.side = side;
      //let shd = shader(shd_name, gl);
      this.mtl = mtl;
      this.shdIsLoaded = null;
      this.noofI = noofI;
      this.noofV = noofV;
      this.gl = gl;
      this.matrWourld = mat4();
    }

    texAttach(url, gl, type = "2d") {
      this.mtl.textureAttach(url, type, gl);
    }

    updatePrimData(timer) {
      if (this.mtl.shader.uniforms["matrWorld"] == undefined) return;
      let mr, m1;
      if (this.type == "earth") {
        m1 = mat4()
          .matrMulMatr2(mat4().matrRotateY(30 * timer.globalTime))
          .matrMulMatr2(mat4().matrScale(vec3(3, 3, 3)));
      } else {
        mr = mat4().matrScale(vec3(this.side));
        m1 = mat4()
          .matrTranslate(this.pos)
          .matrMulMatr2(mr)
          .matrMulMatr2(mat4().matrRotateY(30 * timer.globalTime));
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
        gl.drawArrays(gl.LINE_STRIP, 0, this.noofV);
      }
    }
  }

  function primCreate(name, type, mtl, pos, side = 3, gl) {
    let vi;
    if (type == "cube") vi = cubeCreate();
    if (type == "earth") vi = earthCreate();
    let vert = vi[0],
      ind = vi[1];

    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let vertexBuffer = vertex_buffer(vert, gl),
      indexBuffer,
      indlen;

    if (ind != null) (indexBuffer = index_buffer(ind, gl)), (indlen = ind.length);
    else (indexBuffer = null), (indlen = null);

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
      this.gl.clearColor(0.0, 0.0, 0.1, 1);
      this.prg = this.gl.createProgram();
      this.timer = timer();
      this.prims = [];
      this.input = input_init(this);
      this.cam = camera;
    }

    primAttach(name, type, mtl, pos, side = 3) {
      let p = primCreate(name, type, mtl, pos, side, this.gl);
      this.prims[this.prims.length] = p;
    }

    programUniforms(shd) {
      if (shd.uniforms["matrView"] != undefined) {
        //let m = mat4().matrView(vec3(5, 3, 5), vec3(0, 0, 0), vec3(0, 1, 0));
        let arr = this.cam.matrView.toArray();
        let mVLoc = shd.uniforms["matrView"].loc;
        this.gl.uniformMatrix4fv(mVLoc, false, arr);
      }

      if (shd.uniforms["matrProj"] != undefined) {
        //let m1 = mat4().matrFrustum(-0.08, 0.08, -0.08, 0.08, 0.1, 200);
        let arr1 = this.cam.matrProj.toArray();
        let mPLoc = shd.uniforms["matrProj"].loc;
        this.gl.uniformMatrix4fv(mPLoc, false, arr1);
      }
    }

    transformProgramUniforms(shd) {
      if (shd.uniforms["Time"] == undefined) return;
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
          p.mtl.apply();
          this.programUniforms(p.mtl.shader);
          this.transformProgramUniforms(p.mtl.shader);
          p.render(this.timer);
          p.shdIsLoaded = 1;
          return;
        }
        if (p.shdIsLoaded == null) return;
        p.mtl.apply();
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
      (this.matrView = null), (this.matrVP = null);
      (this.dir = null), (this.right = null);
      if (h == undefined) h = w;
      (this.frameW = w), (this.frameH = h);
    }

    camSet(loc, at, up) {
      if (loc == undefined) loc = this.loc;
      else {
        this.loc = loc;
      }
      if (at == undefined) at = this.at;
      else {
        this.at = at;
      }
      if (up == undefined) up = this.up;
      else {
        this.up = up;
      }

      this.matrView = mat4().matrView(loc, at, up);

      this.right = vec3(
        this.matrView.a[0][0],
        this.matrView.a[1][0],
        this.matrView.a[2][0]
      );
      this.up = vec3(
        this.matrView.a[0][1],
        this.matrView.a[1][1],
        this.matrView.a[2][1]
      );
      this.dir = vec3(
        -this.matrView.a[0][2],
        -this.matrView.a[1][2],
        -this.matrView.a[2][2]
      );
      return this;
    }

    camSetProj(projSize, ProjDist, ProjFarClip) {
      let rx, ry;

      this.projDist = ProjDist;
      this.projFarClip = ProjFarClip;
      rx = ry = this.projSize = projSize;

      /* Correct aspect ratio */
      if (this.frameW >= this.frameH) rx *= this.frameW / this.frameH;
      else ry *= this.frameH / this.frameW;

      this.wp = rx;
      this.hp = ry;
      this.matrProj = mat4().matrFrustum(
        -rx / 2,
        rx / 2,
        -ry / 2,
        ry / 2,
        this.projDist,
        this.projFarClip
      );
      this.matrVP = this.matrView.matrMulMatr2(this.matrProj);

      return this;
    }
  }

  function camera(w, h) {
    return new _camera(w, h);
  }

  class _image {
    constructor(img, name) {
      this.img = img;
      this.name = name;
    }
  }

  function imageCreate(img, name) {
    return new _image(img, name);
  }

  class _texture {
    constructor(nameURL, textureType, gl) {
      this.name = nameURL.name;
      this.gl = gl;
      if (textureType == "2d") this.type = gl.TEXTURE_2D;
      else (this.type = null), console.log("texture type is not 2d");
      this.id = gl.createTexture();
      gl.bindTexture(this.type, this.id);
      if (nameURL.img) {
        gl.texImage2D(
          this.type,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array([255, 255, 255, 0])
        );
        nameURL.img.onload = () => {
          gl.bindTexture(this.type, this.id);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(
            this.type,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            nameURL.img
          );
          gl.generateMipmap(this.type);
          gl.texParameteri(this.type, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(this.type, gl.TEXTURE_WRAP_T, gl.REPEAT);
          gl.texParameteri(
            this.type,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
          );
          gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
      }
    }

    apply(i, shd, tex) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(tex.type, tex.id);

      if (shd.uniforms["earthTex"] == undefined) return;
      let texLoc = shd.uniforms["earthTex"].loc;
      this.gl.uniform1i(texLoc, i);
    }
  }

  function texture(url, type, gl) {
    return new _texture(url, type, gl);
  }

  class _material {
    constructor(shd_name, ubo, gl) {
      this.shader = shader(shd_name, gl);
      this.ubo = ubo;
      this.textures = [];
      this.gl = gl;
    }

    textureAttach(url, type = "2d") {
      this.textures[this.textures.length] = texture(url, type, this.gl);
    }

    apply() {
      if (this.shader.id == null) return;
      this.shader.apply();

      for (let t = 0; t < this.textures.length; t++)
        if (this.textures[t] != null)
          this.textures[t].apply(t, this.shader, this.textures[t]);
    }
  }

  function mtl(shd, ubo, gl) {
    return new _material(shd, ubo, gl);
  }

  let rnd1, rnd2;

  // OpenGL initialization
  function initGL() {
    let canvas1 = document.getElementById("canvas1");
    let camera1 = camera(canvas1.clientWidth, canvas1.clientHeight)
      .camSet(vec3(5, 6, 5))
      .camSetProj(0.1, 0.1, 300);

    let canvas2 = document.getElementById("canvas2");
    let camera2 = camera(canvas2.clientWidth, canvas2.clientHeight)
      .camSet()
      .camSetProj(0.1, 0.1, 300);

    rnd1 = renderCreate(canvas1, "earth", camera1);
    rnd2 = renderCreate(canvas2, "default", camera2);

    let mtl2 = mtl("default", null, rnd2.gl);
    let mtl1 = mtl("earth", null, rnd1.gl);

    let img = new Image();
    img.src = "earth0.jpg";
    let nameURL = imageCreate(img, "earth");

    mtl1.textureAttach(nameURL);

    rnd2.primAttach("cubePrim", "cube", mtl2, vec3(0, 0, 0));
    rnd1.primAttach("Earth", "earth", mtl1, vec3(0, 2, 0), 3);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vVUJPL3Viby5qcyIsIi4uL3ByaW1zL2N1YmUuanMiLCIuLi9wcmltcy9lYXJ0aC5qcyIsIi4uL3NoZC9zaGFkZXIuanMiLCIuLi9tdGgvdmVjMy5qcyIsIi4uL210aC9tYXQ0LmpzIiwiLi4vcHJpbXMvcHJpbS5qcyIsIi4uL3RpbWUvdGltZXIuanMiLCIuLi9tdGgvaW5wdXQuanMiLCIuLi9yZW5kZXIvcmVuZGVyLmpzIiwiLi4vbXRoL2NhbWVyYS5qcyIsIi4uL3RleHR1cmUvdGV4LmpzIiwiLi4vbWF0ZXJpYWwvbXRsLmpzIiwiLi4vbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih0eXBlLCBzaXplLCBnbCkge1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLy8gQnVmZmVyIHR5cGUgKGdsLioqKl9CVUZGRVIpXHJcbiAgICB0aGlzLnNpemUgPSBzaXplOyAvLyBCdWZmZXIgc2l6ZSBpbiBieXRlc1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICBpZiAoc2l6ZSA9PSAwIHx8IHR5cGUgPT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKHR5cGUsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YSh0eXBlLCBzaXplLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgfVxyXG4gIHVwZGF0ZShkYXRhKSB7fVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBidWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ2J1ZmZlcicgZnVuY3Rpb25cclxuXHJcbmNsYXNzIF91Ym9fYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IobmFtZSwgc2l6ZSwgYmluZFBvaW50KSB7XHJcbiAgICBzdXBlcih0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCBzaXplKTtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmJpbmRQb2ludCA9IGJpbmRQb2ludDsgLy8gQnVmZmVyIEdQVSBiaW5kaW5nIHBvaW50XHJcbiAgfVxyXG4gIGFwcGx5KHNoZCkge1xyXG4gICAgaWYgKFxyXG4gICAgICBzaGQgPT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgIHNoZC5pZCA9PSB1bmRlZmluZWQgfHxcclxuICAgICAgc2hkLnVuaWZvcm1CbG9ja3NbdGhpcy5uYW1lXSA9PSB1bmRlZmluZWRcclxuICAgIClcclxuICAgICAgcmV0dXJuO1xyXG4gICAgZ2wudW5pZm9ybUJsb2NrQmluZGluZyhcclxuICAgICAgc2hkLmlkLFxyXG4gICAgICBzaGQudW5pZm9ybUJsb2Nrc1t0aGlzLm5hbWVdLmluZGV4LFxyXG4gICAgICB0aGlzLmJpbmRQb2ludFxyXG4gICAgKTtcclxuICAgIGdsLmJpbmRCdWZmZXJCYXNlKHRoaXMuZ2wuVU5JRk9STV9CVUZGRVIsIHRoaXMuYmluZFBvaW50LCB0aGlzLmlkKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHVib19idWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3Vib19idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG5cclxuY2xhc3MgX3ZlcnRleF9idWZmZXIgZXh0ZW5kcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih2QXJyYXksIGdsKSB7XHJcbiAgICBjb25zdCBuID0gdkFycmF5Lmxlbmd0aDtcclxuICAgIHN1cGVyKGdsLkFSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgdGhpcy5nbC5BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkodkFycmF5KSxcclxuICAgICAgdGhpcy5nbC5TVEFUSUNfRFJBV1xyXG4gICAgKTtcclxuICB9XHJcbiAgYXBwbHkoTG9jLCBzaXplLCBvZmZzZXQpIHtcclxuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihMb2MsIDMsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCBzaXplLCBvZmZzZXQpO1xyXG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShMb2MpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gdmVydGV4X2J1ZmZlciguLi5hcmdzKSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVydGV4X2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ3ZlcnRleF9idWZmZXInIGZ1bmN0aW9uXHJcblxyXG5jbGFzcyBfaW5kZXhfYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IoaUFycmF5LCBnbCkge1xyXG4gICAgY29uc3QgbiA9IGlBcnJheS5sZW5ndGg7XHJcbiAgICBzdXBlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBVaW50MzJBcnJheShpQXJyYXkpLFxyXG4gICAgICB0aGlzLmdsLlNUQVRJQ19EUkFXXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhfYnVmZmVyKC4uLmFyZ3MpIHtcclxuICByZXR1cm4gbmV3IF9pbmRleF9idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG4iLCJleHBvcnQgZnVuY3Rpb24gY3ViZUNyZWF0ZSgpIHtcclxuICAvKiBsZXQgc3ggPSAwICsgc2lkZSxcclxuICAgIHN5ID0gcG9zLnkgKyBzaWRlLFxyXG4gICAgc3ogPSBwb3MueiAtIHNpZGU7ICovXHJcbiAgbGV0IHAgPSBbXHJcbiAgICBbLTAuNSwgLTAuNSwgMC41XSxcclxuICAgIFswLjUsIC0wLjUsIDAuNV0sXHJcbiAgICBbMC41LCAwLjUsIDAuNV0sXHJcbiAgICBbLTAuNSwgMC41LCAwLjVdLFxyXG4gICAgWy0wLjUsIDAuNSwgLTAuNV0sXHJcbiAgICBbMC41LCAwLjUsIC0wLjVdLFxyXG4gICAgWzAuNSwgLTAuNSwgLTAuNV0sXHJcbiAgICBbLTAuNSwgLTAuNSwgLTAuNV0sXHJcbiAgXTtcclxuXHJcbiAgbGV0IG4gPSBbXHJcbiAgICBbLTEsIC0xLCAxXSxcclxuICAgIFsxLCAtMSwgMV0sXHJcbiAgICBbMSwgMSwgMV0sXHJcbiAgICBbLTEsIDEsIDFdLFxyXG4gICAgWy0xLCAxLCAtMV0sXHJcbiAgICBbMSwgMSwgLTFdLFxyXG4gICAgWzEsIC0xLCAtMV0sXHJcbiAgICBbLTEsIC0xLCAtMV0sXHJcbiAgXTtcclxuICBsZXQgdmVydGV4ZXMgPSBbXSxcclxuICAgIGogPSAwO1xyXG4gIHdoaWxlIChqIDwgOCkge1xyXG4gICAgdmVydGV4ZXNbal0gPSBbXHJcbiAgICAgIC4uLnBbal0sXHJcbiAgICAgIG5bal1bMF0sXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIC4uLnBbal0sXHJcbiAgICAgIDAsXHJcbiAgICAgIG5bal1bMV0sXHJcbiAgICAgIDAsXHJcbiAgICAgIC4uLnBbal0sXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIG5bal1bMl0sXHJcbiAgICBdO1xyXG4gICAgaisrO1xyXG4gIH1cclxuICBsZXQgaW5kID0gW1xyXG4gICAgMiwgMTEsIDUsIDgsIDYsIDMsIDE1LCAxOCwgMTksIDIyLCA0LCAxLCAwLCA5LCAyMSwgMTIsIDE0LCAxNywgMjMsIDIwLCAyMyxcclxuICAgIDE0LCAxNywgMTYsIDEzLCA3LCAxMCxcclxuICBdO1xyXG5cclxuICB2ZXJ0ZXhlcyA9IFtcclxuICAgIC4uLnZlcnRleGVzWzBdLFxyXG4gICAgLi4udmVydGV4ZXNbMV0sXHJcbiAgICAuLi52ZXJ0ZXhlc1syXSxcclxuICAgIC4uLnZlcnRleGVzWzNdLFxyXG4gICAgLi4udmVydGV4ZXNbNF0sXHJcbiAgICAuLi52ZXJ0ZXhlc1s1XSxcclxuICAgIC4uLnZlcnRleGVzWzZdLFxyXG4gICAgLi4udmVydGV4ZXNbN10sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIFt2ZXJ0ZXhlcywgaW5kXTtcclxufSIsImV4cG9ydCBmdW5jdGlvbiBlYXJ0aENyZWF0ZSgpIHtcclxuICBsZXQgdmVydGV4ZXMgPSBbXSxcclxuICAgIHcgPSAxMDAsXHJcbiAgICBoID0gMTAwLFxyXG4gICAgaSxcclxuICAgIGosXHJcbiAgICB0aGV0YSxcclxuICAgIHBoaSxcclxuICAgIEcgPSBbXSxcclxuICAgIGluZCA9IFtdLFxyXG4gICAgeCxcclxuICAgIHk7XHJcbiAgbGV0IHBpID0gTWF0aC5hY29zKC0xKTtcclxuXHJcbiAgZm9yIChpID0gMCwgdGhldGEgPSAwOyBpIDwgaDsgaSsrLCB0aGV0YSArPSBwaSAvIChoIC0gMSkpIHtcclxuICAgIGZvciAoaiA9IDAsIHBoaSA9IDA7IGogPCB3OyBqKyssIHBoaSArPSAoMiAqIHBpKSAvICh3IC0gMSkpIHtcclxuICAgICAgR1swXSA9IE1hdGguc2luKHRoZXRhKSAqIE1hdGguc2luKHBoaSk7XHJcbiAgICAgIEdbMV0gPSBNYXRoLmNvcyh0aGV0YSk7XHJcbiAgICAgIEdbMl0gPSBNYXRoLnNpbih0aGV0YSkgKiBNYXRoLmNvcyhwaGkpO1xyXG4gICAgICB2ZXJ0ZXhlcyA9IHZlcnRleGVzLmNvbmNhdCguLi5HKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvciAoaSA9IDAsIHkgPSAwOyB5IDwgaCAtIDE7IGkgKz0gNCwgeSsrKSB7XHJcbiAgICBmb3IgKGogPSAwLCB4ID0gMDsgaiA8ICgyICsgdyAqIDIpICogMiAtIDQ7IGogKz0gNCkge1xyXG4gICAgICAvL2ogLSBjb3VudCBvZiBpbmQgaW4gb25lIHJvdywgeCAtIGRlZmluaW5nIGEgc2VxdWVuY2Ugb2YgaW5kXHJcbiAgICAgIGluZFtpICogaCArIGpdID0geSAqIGggKyB4O1xyXG4gICAgICBpZiAoeCA9PSB3IC0gMSkge1xyXG4gICAgICAgIGluZFtpICogaCArIGogKyAxXSA9IHkgKiBoO1xyXG4gICAgICB9IGVsc2UgaW5kW2kgKiBoICsgaiArIDFdID0geSAqIGggKyB4ICsgMTtcclxuICAgICAgaW5kW2kgKiBoICsgaiArIDJdID0gKHkgKyAxKSAqIGggKyB4O1xyXG4gICAgICBpZiAoeCA9PSB3IC0gMSkgaW5kW2kgKiBoICsgaiArIDNdID0gKHkgKyAxKSAqIGg7XHJcbiAgICAgIGVsc2UgaW5kW2kgKiBoICsgaiArIDNdID0gKHkgKyAxKSAqIGggKyB4ICsgMTtcclxuXHJcbiAgICAgIHgrKztcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIFt2ZXJ0ZXhlcywgaW5kXTtcclxufVxyXG4iLCJjbGFzcyBfc2hhZGVyIHtcclxuICBhc3luYyBfaW5pdChuYW1lLCBnbCkge1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgdGhpcy5zaGFkZXJzID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgdHlwZTogdGhpcy5nbC5WRVJURVhfU0hBREVSLFxyXG4gICAgICAgIG5hbWU6IFwidmVydFwiLFxyXG4gICAgICAgIHNyYzogXCJcIixcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIHR5cGU6IHRoaXMuZ2wuRlJBR01FTlRfU0hBREVSLFxyXG4gICAgICAgIG5hbWU6IFwiZnJhZ1wiLFxyXG4gICAgICAgIHNyYzogXCJcIixcclxuICAgICAgfSxcclxuICAgIF07XHJcbiAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zaGFkZXJzKSB7XHJcbiAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBiaW4vc2hhZGVycy8ke25hbWV9LyR7cy5uYW1lfS5nbHNsYCk7XHJcbiAgICAgIGxldCBzcmMgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgIGlmICh0eXBlb2Ygc3JjID09IFwic3RyaW5nXCIgJiYgc3JjICE9IFwiXCIpIHMuc3JjID0gc3JjO1xyXG4gICAgfVxyXG4gICAgLy8gcmVjb21waWxlIHNoYWRlcnNcclxuICAgIHRoaXMudXBkYXRlU2hhZGVyc1NvdXJjZSgpO1xyXG4gIH1cclxuICB1cGRhdGVTaGFkZXJzU291cmNlKCkge1xyXG4gICAgdGhpcy5zaGFkZXJzWzBdLmlkID0gbnVsbDtcclxuICAgIHRoaXMuc2hhZGVyc1sxXS5pZCA9IG51bGw7XHJcbiAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgIGlmICh0aGlzLnNoYWRlcnNbMF0uc3JjID09IFwiXCIgfHwgdGhpcy5zaGFkZXJzWzFdLnNyYyA9PSBcIlwiKSByZXR1cm47XHJcbiAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zaGFkZXJzKSB7XHJcbiAgICAgIHMuaWQgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcihzLnR5cGUpO1xyXG4gICAgICB0aGlzLmdsLnNoYWRlclNvdXJjZShzLmlkLCBzLnNyYyk7XHJcbiAgICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcihzLmlkKTtcclxuICAgICAgaWYgKCF0aGlzLmdsLmdldFNoYWRlclBhcmFtZXRlcihzLmlkLCB0aGlzLmdsLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgIGxldCBidWYgPSB0aGlzLmdsLmdldFNoYWRlckluZm9Mb2cocy5pZCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFNoYWRlciAke3RoaXMubmFtZX0vJHtzLm5hbWV9IGNvbXBpbGUgZmFpbDogJHtidWZ9YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuaWQgPSB0aGlzLmdsLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zaGFkZXJzKSB7XHJcbiAgICAgIGlmIChzLmlkICE9IG51bGwpIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKHRoaXMuaWQsIHMuaWQpO1xyXG4gICAgfVxyXG4gICAgbGV0IHByZyA9IHRoaXMuaWQ7XHJcbiAgICB0aGlzLmdsLmxpbmtQcm9ncmFtKHByZyk7XHJcbiAgICBpZiAoIXRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcmcsIHRoaXMuZ2wuTElOS19TVEFUVVMpKSB7XHJcbiAgICAgIGxldCBidWYgPSB0aGlzLmdsLmdldFByb2dyYW1JbmZvTG9nKHByZyk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBTaGFkZXIgcHJvZ3JhbSAke3RoaXMubmFtZX0gbGluayBmYWlsOiAke2J1Zn1gKTtcclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlU2hhZGVyRGF0YSgpO1xyXG4gIH1cclxuICB1cGRhdGVTaGFkZXJEYXRhKCkge1xyXG4gICAgLy8gU2hhZGVyIGF0dHJpYnV0ZXNcclxuICAgIHRoaXMuYXR0cnMgPSB7fTtcclxuICAgIGNvbnN0IGNvdW50QXR0cnMgPSB0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIoXHJcbiAgICAgIHRoaXMuaWQsXHJcbiAgICAgIHRoaXMuZ2wuQUNUSVZFX0FUVFJJQlVURVNcclxuICAgICk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50QXR0cnM7IGkrKykge1xyXG4gICAgICBjb25zdCBpbmZvID0gdGhpcy5nbC5nZXRBY3RpdmVBdHRyaWIodGhpcy5pZCwgaSk7XHJcbiAgICAgIHRoaXMuYXR0cnNbaW5mby5uYW1lXSA9IHtcclxuICAgICAgICBuYW1lOiBpbmZvLm5hbWUsXHJcbiAgICAgICAgdHlwZTogaW5mby50eXBlLFxyXG4gICAgICAgIHNpemU6IGluZm8uc2l6ZSxcclxuICAgICAgICBsb2M6IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5pZCwgaW5mby5uYW1lKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTaGFkZXIgdW5pZm9ybXNcclxuICAgIHRoaXMudW5pZm9ybXMgPSB7fTtcclxuICAgIGNvbnN0IGNvdW50VW5pZm9ybXMgPSB0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIoXHJcbiAgICAgIHRoaXMuaWQsXHJcbiAgICAgIHRoaXMuZ2wuQUNUSVZFX1VOSUZPUk1TXHJcbiAgICApO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudFVuaWZvcm1zOyBpKyspIHtcclxuICAgICAgY29uc3QgaW5mbyA9IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybSh0aGlzLmlkLCBpKTtcclxuICAgICAgdGhpcy51bmlmb3Jtc1tpbmZvLm5hbWVdID0ge1xyXG4gICAgICAgIG5hbWU6IGluZm8ubmFtZSxcclxuICAgICAgICB0eXBlOiBpbmZvLnR5cGUsXHJcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxyXG4gICAgICAgIGxvYzogdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5pZCwgaW5mby5uYW1lKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTaGFkZXIgdW5pZm9ybSBibG9ja3NcclxuICAgIHRoaXMudW5pZm9ybUJsb2NrcyA9IHt9O1xyXG4gICAgY29uc3QgY291bnRVbmlmb3JtQmxvY2tzID0gdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKFxyXG4gICAgICB0aGlzLmlkLFxyXG4gICAgICB0aGlzLmdsLkFDVElWRV9VTklGT1JNX0JMT0NLU1xyXG4gICAgKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnRVbmlmb3JtQmxvY2tzOyBpKyspIHtcclxuICAgICAgY29uc3QgYmxvY2tfbmFtZSA9IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrTmFtZSh0aGlzLmlkLCBpKTtcclxuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja0luZGV4KHRoaXMuaWQsIGJsb2NrX25hbWUpO1xyXG4gICAgICB0aGlzLnVuaWZvcm1CbG9ja3NbYmxvY2tfbmFtZV0gPSB7XHJcbiAgICAgICAgbmFtZTogYmxvY2tfbmFtZSxcclxuICAgICAgICBpbmRleDogaW5kZXgsXHJcbiAgICAgICAgc2l6ZTogdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtQmxvY2tQYXJhbWV0ZXIoXHJcbiAgICAgICAgICB0aGlzLmlkLFxyXG4gICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgdGhpcy5nbC5VTklGT1JNX0JMT0NLX0RBVEFfU0laRVxyXG4gICAgICAgICksXHJcbiAgICAgICAgYmluZDogdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtQmxvY2tQYXJhbWV0ZXIoXHJcbiAgICAgICAgICB0aGlzLmlkLFxyXG4gICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgdGhpcy5nbC5VTklGT1JNX0JMT0NLX0JJTkRJTkdcclxuICAgICAgICApLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdHJ1Y3RvcihuYW1lLCBnbCkge1xyXG4gICAgdGhpcy5faW5pdChuYW1lLCBnbCk7XHJcbiAgfVxyXG4gIGFwcGx5KCkge1xyXG4gICAgaWYgKHRoaXMuaWQgIT0gbnVsbCkgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMuaWQpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gc2hhZGVyKG5hbWUsIGdsKSB7XHJcbiAgcmV0dXJuIG5ldyBfc2hhZGVyKG5hbWUsIGdsKTtcclxufVxyXG4vKlxyXG5sZXQgc3JjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaGRWZXJ0U3JjXCIpLnZhbHVlO1xyXG5zaGQuc2hhZGVyc1swXS5zcmMgPSBzcmM7XHJcbnNoZC51cGRhdGVTaGFkZXJzU291cmNlKCk7XHJcbiovXHJcbiIsImNsYXNzIF92ZWMzIHtcclxuICBjb25zdHJ1Y3Rvcih4LCB5LCB6KSB7XHJcbiAgICBpZiAodHlwZW9mKHgpICE9IFwibnVtYmVyXCIpIHtcclxuICAgICAgaWYgKHggPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgICh0aGlzLnggPSB4LngpLCAodGhpcy55ID0geC55KSwgKHRoaXMueiA9IHgueik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh5ICE9IHVuZGVmaW5lZCAmJiB6ICE9IHVuZGVmaW5lZClcclxuICAgICAgKHRoaXMueCA9IHgpLCAodGhpcy55ID0geSksICh0aGlzLnogPSB6KTtcclxuICAgIGVsc2UgKHRoaXMueCA9IHgpLCAodGhpcy55ID0geCksICh0aGlzLnogPSB4KTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBhZGQgYW5vdGhlclxyXG4gIGFkZCh2KSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55LCB0aGlzLnogKyB2LnopO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIHN1YnN0cmFjdCBhbm90aGVyXHJcbiAgc3ViKHYpIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54IC0gdi54LCB0aGlzLnkgLSB2LnksIHRoaXMueiAtIHYueik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgbXVsdGlwbGljYXRlZCBieSBudW1iZXJcclxuICBtdWxOdW0obikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyh0aGlzLnggKiBuLCB0aGlzLnkgKiBuLCB0aGlzLnogKiBuKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBkZXZpZGVkIGJ5IG51bWJlclxyXG4gIGRpdk51bShuKSB7XHJcbiAgICBpZiAobiA9PSAwKSByZXR1cm47XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCAvIG4sIHRoaXMueSAvIG4sIHRoaXMueiAvIG4pO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIE5lZ2F0aXZlXHJcbiAgbmVnKCkge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMygtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56KTtcclxuICB9XHJcblxyXG4gIC8vVHdvIHZlY3RvcnMzIGRvdCBwcm9kdWN0XHJcbiAgZG90KHYpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2Lno7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgTGVuZ2h0IGV2YWx1YXRpb25cclxuICBsZW4oKSB7XHJcbiAgICBsZXQgbGVuID0gdGhpcy5kb3QodGhpcyk7XHJcbiAgICBpZiAobGVuID09IDAgfHwgbGVuID09IDEpIHJldHVybiBsZW47XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGxlbik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgTm9ybWFsaXplXHJcbiAgbm9ybWFsaXplKCkge1xyXG4gICAgbGV0IGxlbiA9IHRoaXMuZG90KHRoaXMpO1xyXG5cclxuICAgIGlmIChsZW4gPT0gMSB8fCBsZW4gPT0gMCkgcmV0dXJuIHRoaXM7XHJcbiAgICByZXR1cm4gdGhpcy5kaXZOdW0oTWF0aC5zcXJ0KGxlbikpO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIHRyYW5zZm9tYXRpb25cclxuICB0cmFuc2Zvcm0obSkge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyhcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzBdICsgdGhpcy55ICogbS5hWzFdWzBdICsgdGhpcy56ICogbS5hWzJdWzBdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMV0gKyB0aGlzLnkgKiBtLmFbMV1bMV0gKyB0aGlzLnogKiBtLmFbMl1bMV0sXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVsyXSArIHRoaXMueSAqIG0uYVsxXVsyXSArIHRoaXMueiAqIG0uYVsyXVsyXVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBieSBtYXRyaXggbXVsdGlwbGljYXRpb24gKHdpdGggaG9tb2dlbmlvdXMgZGV2aWRlKVxyXG4gIHZlYzNNdWxNYXRyKG0pIHtcclxuICAgIGxldCB3ID1cclxuICAgICAgdGhpcy54ICogbS5hWzBdWzNdICsgdGhpcy55ICogbS5hWzFdWzNdICsgdGhpcy56ICogbS5hWzJdWzNdICsgbS5hWzNdWzNdO1xyXG5cclxuICAgIHJldHVybiBuZXcgX3ZlYzMoXHJcbiAgICAgIChWLlggKiBtLmFbMF1bMF0gKyB0aGlzLnkgKiBtLmFbMV1bMF0gKyBWLlogKiBtLmFbMl1bMF0gKyBtLmFbM11bMF0pIC8gdyxcclxuICAgICAgKFYuWCAqIG0uYVswXVsxXSArIHRoaXMueSAqIG0uYVsxXVsxXSArIFYuWiAqIG0uYVsyXVsxXSArIG0uYVszXVsxXSkgLyB3LFxyXG4gICAgICAoVi5YICogbS5hWzBdWzJdICsgdGhpcy55ICogbS5hWzFdWzJdICsgVi5aICogbS5hWzJdWzJdICsgbS5hWzNdWzJdKSAvIHdcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvL0Nyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlY3RvcnNcclxuICBjcm9zcyh2KSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKFxyXG4gICAgICB0aGlzLnkgKiB2LnogLSB0aGlzLnogKiB2LnksXHJcbiAgICAgIHRoaXMueiAqIHYueCAtIHRoaXMueCAqIHYueixcclxuICAgICAgdGhpcy54ICogdi55IC0gdGhpcy55ICogdi54XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy9Qb2ludCBieSBtYXRyaXggdHJhbnNmb3JtYXRpb25cclxuICBwb2ludFRyYW5zZm9ybShtKSB7XHJcbiAgICBsZXQgdiA9IG5ldyBfdmVjMyhcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzBdICsgdGhpcy55ICogbS5hWzFdWzBdICsgdi56ICogbS5hWzJdWzBdICsgbS5hWzNdWzBdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMV0gKyB0aGlzLnkgKiBtLmFbMV1bMV0gKyB2LnogKiBtLmFbMl1bMV0gKyBtLmFbM11bMV0sXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVsyXSArIHRoaXMueSAqIG0uYVsxXVsyXSArIHYueiAqIG0uYVsyXVsyXSArIG0uYVszXVsyXVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gdjtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2ZWMzKHgsIHksIHopIHtcclxuICByZXR1cm4gbmV3IF92ZWMzKHgsIHksIHopO1xyXG59XHJcbiIsImltcG9ydCB7dmVjM30gZnJvbSBcIi4vdmVjM1wiXHJcblxyXG5jbGFzcyBfbWF0NCB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmEgPSBbXHJcbiAgICAgIFsxLCAwLCAwLCAwXSxcclxuICAgICAgWzAsIDEsIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICB0b0FycmF5KCkge1xyXG4gICAgbGV0IHQgPSB0aGlzLmE7XHJcbiAgICByZXR1cm4gW10uY29uY2F0KHRbMF0pLmNvbmNhdCh0WzFdKS5jb25jYXQodFsyXSkuY29uY2F0KHRbM10pO1xyXG4gIH1cclxuXHJcbiAgLy9UcmFuc2xhdGUgbWF0cml4XHJcbiAgbWF0clRyYW5zbGF0ZSh2KSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbS5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbdi54LCB2LnksIHYueiwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL011bHRpcGx5aW5nIHR3byBtYXRyaXhlc1xyXG4gIG1hdHJNdWxNYXRyMihtKSB7XHJcbiAgICBsZXQgciA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIHIuYVswXVswXSA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqIG0uYVswXVswXSArXHJcbiAgICAgIHRoaXMuYVswXVsxXSAqIG0uYVsxXVswXSArXHJcbiAgICAgIHRoaXMuYVswXVsyXSAqIG0uYVsyXVswXSArXHJcbiAgICAgIHRoaXMuYVswXVszXSAqIG0uYVszXVswXTtcclxuXHJcbiAgICByLmFbMF1bMV0gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bMV0gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bMV0gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bMV0gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bMV07XHJcblxyXG4gICAgci5hWzBdWzJdID1cclxuICAgICAgdGhpcy5hWzBdWzBdICogbS5hWzBdWzJdICtcclxuICAgICAgdGhpcy5hWzBdWzFdICogbS5hWzFdWzJdICtcclxuICAgICAgdGhpcy5hWzBdWzJdICogbS5hWzJdWzJdICtcclxuICAgICAgdGhpcy5hWzBdWzNdICogbS5hWzNdWzJdO1xyXG5cclxuICAgIHIuYVswXVszXSA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqIG0uYVswXVszXSArXHJcbiAgICAgIHRoaXMuYVswXVsxXSAqIG0uYVsxXVszXSArXHJcbiAgICAgIHRoaXMuYVswXVsyXSAqIG0uYVsyXVszXSArXHJcbiAgICAgIHRoaXMuYVswXVszXSAqIG0uYVszXVszXTtcclxuXHJcbiAgICByLmFbMV1bMF0gPVxyXG4gICAgICB0aGlzLmFbMV1bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbMV1bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbMV1bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbMV1bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzFdWzFdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVsxXVsyXSA9XHJcbiAgICAgIHRoaXMuYVsxXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVsxXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVsxXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVsxXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbMV1bM10gPVxyXG4gICAgICB0aGlzLmFbMV1bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbMV1bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbMV1bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbMV1bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgci5hWzJdWzBdID1cclxuICAgICAgdGhpcy5hWzJdWzBdICogbS5hWzBdWzBdICtcclxuICAgICAgdGhpcy5hWzJdWzFdICogbS5hWzFdWzBdICtcclxuICAgICAgdGhpcy5hWzJdWzJdICogbS5hWzJdWzBdICtcclxuICAgICAgdGhpcy5hWzJdWzNdICogbS5hWzNdWzBdO1xyXG5cclxuICAgIHIuYVsyXVsxXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVsxXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVsxXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVsxXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVsxXTtcclxuXHJcbiAgICByLmFbMl1bMl0gPVxyXG4gICAgICB0aGlzLmFbMl1bMF0gKiBtLmFbMF1bMl0gK1xyXG4gICAgICB0aGlzLmFbMl1bMV0gKiBtLmFbMV1bMl0gK1xyXG4gICAgICB0aGlzLmFbMl1bMl0gKiBtLmFbMl1bMl0gK1xyXG4gICAgICB0aGlzLmFbMl1bM10gKiBtLmFbM11bMl07XHJcblxyXG4gICAgci5hWzJdWzNdID1cclxuICAgICAgdGhpcy5hWzJdWzBdICogbS5hWzBdWzNdICtcclxuICAgICAgdGhpcy5hWzJdWzFdICogbS5hWzFdWzNdICtcclxuICAgICAgdGhpcy5hWzJdWzJdICogbS5hWzJdWzNdICtcclxuICAgICAgdGhpcy5hWzJdWzNdICogbS5hWzNdWzNdO1xyXG5cclxuICAgIHIuYVszXVswXSA9XHJcbiAgICAgIHRoaXMuYVszXVswXSAqIG0uYVswXVswXSArXHJcbiAgICAgIHRoaXMuYVszXVsxXSAqIG0uYVsxXVswXSArXHJcbiAgICAgIHRoaXMuYVszXVsyXSAqIG0uYVsyXVswXSArXHJcbiAgICAgIHRoaXMuYVszXVszXSAqIG0uYVszXVswXTtcclxuXHJcbiAgICByLmFbM11bMV0gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bMV0gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bMV0gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bMV0gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bMV07XHJcblxyXG4gICAgci5hWzNdWzJdID1cclxuICAgICAgdGhpcy5hWzNdWzBdICogbS5hWzBdWzJdICtcclxuICAgICAgdGhpcy5hWzNdWzFdICogbS5hWzFdWzJdICtcclxuICAgICAgdGhpcy5hWzNdWzJdICogbS5hWzJdWzJdICtcclxuICAgICAgdGhpcy5hWzNdWzNdICogbS5hWzNdWzJdO1xyXG5cclxuICAgIHIuYVszXVszXSA9XHJcbiAgICAgIHRoaXMuYVszXVswXSAqIG0uYVswXVszXSArXHJcbiAgICAgIHRoaXMuYVszXVsxXSAqIG0uYVsxXVszXSArXHJcbiAgICAgIHRoaXMuYVszXVsyXSAqIG0uYVsyXVszXSArXHJcbiAgICAgIHRoaXMuYVszXVszXSAqIG0uYVszXVszXTtcclxuXHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIC8vTXVsdGlwbHlpbmcgdGhyZWUgbWF0cml4ZXNcclxuICBtYXRyTXVsTWF0cjMobTEsIG0yKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tYXRyTXVsTWF0cjIobTEubWF0ck11bE1hdHIyKG0yKSk7XHJcbiAgfVxyXG5cclxuICBNYXRySW52ZXJzZSgpIHtcclxuICAgIGxldCByID0gbmV3IF9tYXQ0KCk7XHJcbiAgICBsZXQgZGV0ID0gbWF0ckRldGVybShNKTtcclxuXHJcbiAgICBpZiAoZGV0ID09IDApIHJldHVybiByO1xyXG5cclxuICAgIC8qIGJ1aWxkIGFkam9pbnQgbWF0cml4ICovXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVswXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzBdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVswXVsxXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzFdWzFdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVszXVsxXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzBdWzJdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVsyXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzJdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVszXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzNdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBtYXRyaXhcclxuICBtYXRyUm90YXRlKGFuZ2xlLCB2KSB7XHJcbiAgICBsZXQgYSA9IGFuZ2xlICogMy4xNDE1OTI2NTM1ODk3OTMyIC8gMTgwLFxyXG4gICAgICBzID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGMgPSBNYXRoLmNvcyhhKTtcclxuXHJcbiAgICBsZXQgciA9IG5ldyBfbWF0NCgpO1xyXG4gICAgci5hID0gW1xyXG4gICAgICBbXHJcbiAgICAgICAgYyArIHYueCAqIHYueCAqICgxIC0gYyksXHJcbiAgICAgICAgdi55ICogdi54ICogKDEgLSBjKSAtIHYueiAqIHMsXHJcbiAgICAgICAgdi56ICogdi54ICogKDEgLSBjKSArIHYueSAqIHMsXHJcbiAgICAgICAgMCxcclxuICAgICAgXSxcclxuICAgICAgW1xyXG4gICAgICAgIHYueCAqIHYueSAqICgxIC0gYykgKyB2LnogKiBzLFxyXG4gICAgICAgIGMgKyB2LnkgKiB2LnkgKiAoMSAtIGMpLFxyXG4gICAgICAgIHYueiAqIHYueSAqICgxIC0gYykgLSB2LnggKiBzLFxyXG4gICAgICAgIDAsXHJcbiAgICAgIF0sXHJcbiAgICAgIFtcclxuICAgICAgICB2LnggKiB2LnogKiAoMSAtIGMpIC0gdi55ICogcyxcclxuICAgICAgICB2LnkgKiB2LnogKiAoMSAtIGMpICsgdi54ICogcyxcclxuICAgICAgICBjICsgdi56ICogdi56ICogKDEgLSBjKSxcclxuICAgICAgICAwLFxyXG4gICAgICBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICAvL1ZpZXcgbWF0cml4XHJcbiAgbWF0clZpZXcobG9jLCBhdCwgdXAxKSB7XHJcbiAgICBsZXQgZGlyID0gYXQuc3ViKGxvYykubm9ybWFsaXplKCksXHJcbiAgICAgIHJpZ2h0ID0gZGlyLmNyb3NzKHVwMSkubm9ybWFsaXplKCksXHJcbiAgICAgIHVwID0gcmlnaHQuY3Jvc3MoZGlyKS5ub3JtYWxpemUoKTtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFtyaWdodC54LCB1cC54LCAtZGlyLngsIDBdLFxyXG4gICAgICBbcmlnaHQueSwgdXAueSwgLWRpci55LCAwXSxcclxuICAgICAgW3JpZ2h0LnosIHVwLnosIC1kaXIueiwgMF0sXHJcbiAgICAgIFstbG9jLmRvdChyaWdodCksIC1sb2MuZG90KHVwKSwgbG9jLmRvdChkaXIpLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vRnJ1c3R1bSBtYXRyaXhcclxuICBtYXRyRnJ1c3R1bShsLCByLCBiLCB0LCBuLCBmKSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbS5hID0gW1xyXG4gICAgICBbKDIgKiBuKSAvIChyIC0gbCksIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgKDIgKiBuKSAvICh0IC0gYiksIDAsIDBdLFxyXG4gICAgICBbKHIgKyBsKSAvIChyIC0gbCksICh0ICsgYikgLyAodCAtIGIpLCAtKChmICsgbikgLyAoZiAtIG4pKSwgLTFdLFxyXG4gICAgICBbMCwgMCwgLSgoMiAqIG4gKiBmKSAvIChmIC0gbikpLCAwXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vVHJhbnNwb3NlIG1hdHJpeFxyXG4gIG1hdHJUcmFuc3Bvc2UoKSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIChtLmEgPSBbbS5hWzBdWzBdLCBtLmFbMV1bMF0sIG0uYVsyXVswXSwgbS5hWzNdWzBdXSksXHJcbiAgICAgIFttLmFbMF1bMV0sIG0uYVsxXVsxXSwgbS5hWzJdWzFdLCBtLmFbM11bMV1dLFxyXG4gICAgICBbbS5hWzBdWzJdLCBtLmFbMV1bMl0sIG0uYVsyXVsyXSwgbS5hWzNdWzJdXSxcclxuICAgICAgW20uYVswXVszXSwgbS5hWzFdWzNdLCBtLmFbMl1bM10sIG0uYVszXVszXV07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vUmF0YXRpb24gYnkgWCBtYXRyaXhcclxuICBtYXRyUm90YXRlWChhbmdsZUluRGVncmVlKSB7XHJcbiAgICBsZXQgYSA9IGFuZ2xlSW5EZWdyZWUgKiAzLjE0MTU5MjY1MzU4OTc5MzIgLyAxODAsXHJcbiAgICAgIHNpID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGNvID0gTWF0aC5jb3MoYSksXHJcbiAgICAgIG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsxLCAwLCAwLCAwXSxcclxuICAgICAgWzAsIGNvLCBzaSwgMF0sXHJcbiAgICAgIFswLCAtc2ksIGNvLCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBieSBZIG1hdHJpeFxyXG4gIG1hdHJSb3RhdGVZKGFuZ2xlSW5EZWdyZWUpIHtcclxuICAgIGxldCBhID0gYW5nbGVJbkRlZ3JlZSAqIDMuMTQxNTkyNjUzNTg5NzkzMiAvIDE4MCxcclxuICAgICAgc2kgPSBNYXRoLnNpbihhKSxcclxuICAgICAgY28gPSBNYXRoLmNvcyhhKSxcclxuICAgICAgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIG0uYSA9IFtcclxuICAgICAgW2NvLCAwLCAtc2ksIDBdLFxyXG4gICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgIFtzaSwgMCwgY28sIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1JvdGF0aW9uIGJ5IFogbWF0cml4XHJcbiAgbWF0clJvdGF0ZVooYW5nbGVJbkRlZ3JlZSkge1xyXG4gICAgbGV0IGEgPSBhbmdsZUluRGVncmVlICogMy4xNDE1OTI2NTM1ODk3OTMyIC8gMTgwLFxyXG4gICAgICBzaSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjbyA9IE1hdGguY29zKGEpLFxyXG4gICAgICBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbY28sIHNpLCAwLCAwXSxcclxuICAgICAgWy1zaSwgY28sIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vU2NhbGUgbWF0cml4XHJcbiAgbWF0clNjYWxlKHYpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbdi54LCAwLCAwLCAwXSxcclxuICAgICAgWzAsIHYueSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCB2LnosIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICBtYXRyT3J0aG8obCwgciwgYiwgdCwgbiwgZikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsyIC8gKHIgLSBsKSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAyIC8gKHQgLSBiKSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAtMiAvIChmIC0gbiksIDBdLFxyXG4gICAgICBbLShyICsgbCkgLyAociAtIGwpLCAtKHQgKyBiKSAvICh0IC0gYiksIC0oZiArIG4pIC8gKGYgLSBuKSwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG4gIC8vUG9pbnQgYnkgbWF0cml4IHRyYW5zZm9ybWF0aW9uXHJcbiAgdHJhbnNmb3JtUG9pbnQodikge1xyXG4gICAgbGV0IHZlID0gdmVjMyhcclxuICAgICAgdi54ICogdGhpcy5hWzBdWzBdICsgdi55ICogdGhpcy5hWzFdWzBdICsgdi56ICogdGhpcy5hWzJdWzBdICsgdGhpcy5hWzNdWzBdLFxyXG4gICAgICB2LnggKiB0aGlzLmFbMF1bMV0gKyB2LnkgKiB0aGlzLmFbMV1bMV0gKyB2LnogKiB0aGlzLmFbMl1bMV0gKyB0aGlzLmFbM11bMV0sXHJcbiAgICAgIHYueCAqIHRoaXMuYVswXVsyXSArIHYueSAqIHRoaXMuYVsxXVsyXSArIHYueiAqIHRoaXMuYVsyXVsyXSArIHRoaXMuYVszXVsyXVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gdmU7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRyRGV0ZXJtM3gzKGExMSwgYTEyLCBhMTMsIGEyMSwgYTIyLCBhMjMsIGEzMSwgYTMyLCBhMzMpIHtcclxuICByZXR1cm4gKFxyXG4gICAgYTExICogYTIyICogYTMzICtcclxuICAgIGExMiAqIGEyMyAqIGEzMSArXHJcbiAgICBhMTMgKiBhMjEgKiBhMzIgLVxyXG4gICAgYTExICogYTIzICogYTMyIC1cclxuICAgIGExMiAqIGEyMSAqIGEzMyAtXHJcbiAgICBhMTMgKiBhMjIgKiBhMzFcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRyRGV0ZXJtKG0pIHtcclxuICBsZXQgZCA9XHJcbiAgICArdGhpcy5hWzBdWzBdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMV0sXHJcbiAgICAgICAgbS5hWzFdWzJdLFxyXG4gICAgICAgIG0uYVsxXVszXSxcclxuICAgICAgICBtLmFbMl1bMV0sXHJcbiAgICAgICAgbS5hWzJdWzJdLFxyXG4gICAgICAgIG0uYVsyXVszXSxcclxuICAgICAgICBtLmFbM11bMV0sXHJcbiAgICAgICAgbS5hWzNdWzJdLFxyXG4gICAgICAgIG0uYVszXVszXVxyXG4gICAgICApICtcclxuICAgIC1tLmFbMF1bMV0gKlxyXG4gICAgICBtYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIG0uYVsxXVswXSxcclxuICAgICAgICBtLmFbMV1bMl0sXHJcbiAgICAgICAgbS5hWzFdWzNdLFxyXG4gICAgICAgIG0uYVsyXVswXSxcclxuICAgICAgICBtLmFbMl1bMl0sXHJcbiAgICAgICAgbS5hWzJdWzNdLFxyXG4gICAgICAgIG0uYVszXVswXSxcclxuICAgICAgICBtLmFbM11bMl0sXHJcbiAgICAgICAgbS5hWzNdWzNdXHJcbiAgICAgICkgK1xyXG4gICAgK20uYVswXVsyXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzBdLFxyXG4gICAgICAgIG0uYVsxXVsxXSxcclxuICAgICAgICBtLmFbMV1bM10sXHJcbiAgICAgICAgbS5hWzJdWzBdLFxyXG4gICAgICAgIG0uYVsyXVsxXSxcclxuICAgICAgICBtLmFbMl1bM10sXHJcbiAgICAgICAgbS5hWzNdWzBdLFxyXG4gICAgICAgIG0uYVszXVsxXSxcclxuICAgICAgICBtLmFbM11bM11cclxuICAgICAgKSArXHJcbiAgICAtbS5hWzBdWzNdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMF0sXHJcbiAgICAgICAgbS5hWzFdWzFdLFxyXG4gICAgICAgIG0uYVsxXVsyXSxcclxuICAgICAgICBtLmFbMl1bMF0sXHJcbiAgICAgICAgbS5hWzJdWzFdLFxyXG4gICAgICAgIG0uYVsyXVsyXSxcclxuICAgICAgICBtLmFbM11bMF0sXHJcbiAgICAgICAgbS5hWzNdWzFdLFxyXG4gICAgICAgIG0uYVszXVsyXVxyXG4gICAgICApO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF0NCgpIHtcclxuICByZXR1cm4gbmV3IF9tYXQ0KCk7XHJcbn1cclxuIiwiaW1wb3J0IHsgaW5kZXhfYnVmZmVyLCB2ZXJ0ZXhfYnVmZmVyIH0gZnJvbSBcIi4uL1VCTy91Ym8uanNcIjtcclxuaW1wb3J0IHsgY3ViZUNyZWF0ZSB9IGZyb20gXCIuL2N1YmUuanNcIjtcclxuaW1wb3J0IHsgZWFydGhDcmVhdGUgfSBmcm9tIFwiLi9lYXJ0aC5qc1wiO1xyXG5pbXBvcnQgeyBzaGFkZXIgfSBmcm9tIFwiLi4vc2hkL3NoYWRlci5qc1wiO1xyXG5pbXBvcnQgeyBtYXQ0IH0gZnJvbSBcIi4uL210aC9tYXQ0LmpzXCI7XHJcbmltcG9ydCB7IHZlYzMgfSBmcm9tIFwiLi4vbXRoL3ZlYzMuanNcIjtcclxuXHJcbmNsYXNzIF9wcmltIHtcclxuICBjb25zdHJ1Y3RvcihnbCwgbmFtZSwgdHlwZSwgbXRsLCBwb3MsIFZCdWYsIElCdWYsIFZBLCBub29mSSwgbm9vZlYsIHNpZGUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAodGhpcy5WQnVmID0gVkJ1ZiksICh0aGlzLklCdWYgPSBJQnVmKSwgKHRoaXMuVkEgPSBWQSk7IC8qIHJlbmRlciBpbmZvICovXHJcbiAgICB0aGlzLnR5cGUgPSB0eXBlOyAvKiBwbGF0b24gZmlndXJlIHR5cGUgKi9cclxuICAgIHRoaXMucG9zID0gcG9zOyAvKiBwb3NpdGlvbiAqL1xyXG5cclxuICAgIHRoaXMuc2lkZSA9IHNpZGU7XHJcbiAgICAvL2xldCBzaGQgPSBzaGFkZXIoc2hkX25hbWUsIGdsKTtcclxuICAgIHRoaXMubXRsID0gbXRsO1xyXG4gICAgdGhpcy5zaGRJc0xvYWRlZCA9IG51bGw7XHJcbiAgICB0aGlzLm5vb2ZJID0gbm9vZkk7XHJcbiAgICB0aGlzLm5vb2ZWID0gbm9vZlY7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLm1hdHJXb3VybGQgPSBtYXQ0KCk7XHJcbiAgfVxyXG5cclxuICB0ZXhBdHRhY2godXJsLCBnbCwgdHlwZSA9IFwiMmRcIikge1xyXG4gICAgdGhpcy5tdGwudGV4dHVyZUF0dGFjaCh1cmwsIHR5cGUsIGdsKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVByaW1EYXRhKHRpbWVyKSB7XHJcbiAgICBpZiAodGhpcy5tdGwuc2hhZGVyLnVuaWZvcm1zW1wibWF0cldvcmxkXCJdID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgbGV0IG1yLCBtMTtcclxuICAgIGlmICh0aGlzLnR5cGUgPT0gXCJlYXJ0aFwiKSB7XHJcbiAgICAgIG0xID0gbWF0NCgpXHJcbiAgICAgICAgLm1hdHJNdWxNYXRyMihtYXQ0KCkubWF0clJvdGF0ZVkoMzAgKiB0aW1lci5nbG9iYWxUaW1lKSlcclxuICAgICAgICAubWF0ck11bE1hdHIyKG1hdDQoKS5tYXRyU2NhbGUodmVjMygzLCAzLCAzKSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbXIgPSBtYXQ0KCkubWF0clNjYWxlKHZlYzModGhpcy5zaWRlKSk7XHJcbiAgICAgIG0xID0gbWF0NCgpXHJcbiAgICAgICAgLm1hdHJUcmFuc2xhdGUodGhpcy5wb3MpXHJcbiAgICAgICAgLm1hdHJNdWxNYXRyMihtcilcclxuICAgICAgICAubWF0ck11bE1hdHIyKG1hdDQoKS5tYXRyUm90YXRlWSgzMCAqIHRpbWVyLmdsb2JhbFRpbWUpKTtcclxuICAgIH1cclxuICAgIGxldCBhcnIxID0gbTEudG9BcnJheSgpO1xyXG4gICAgbGV0IG1XTG9jID0gdGhpcy5tdGwuc2hhZGVyLnVuaWZvcm1zW1wibWF0cldvcmxkXCJdLmxvYztcclxuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihtV0xvYywgZmFsc2UsIGFycjEpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKHRpbWVyKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgaWYgKHRoaXMubm9vZkkgIT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5tdGwuc2hkSXNMb2FkZWQgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJpbURhdGEodGltZXIpO1xyXG4gICAgICAgIGlmICh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJbk5vcm1hbFwiXSA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDEyLCAwKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuVkJ1Zi5hcHBseSh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJblBvc2l0aW9uXCJdLmxvYywgMjQsIDApO1xyXG4gICAgICAgICAgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluTm9ybWFsXCJdLmxvYywgMjQsIDEyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tdGwuc2hhZGVyLnVwZGF0ZVNoYWRlckRhdGEoKTtcclxuICAgICAgfVxyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5WQnVmLmlkKTtcclxuICAgICAgZ2wuYmluZFZlcnRleEFycmF5KHRoaXMuVkEuaWQpO1xyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLklCdWYuaWQpO1xyXG4gICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVfU1RSSVAsIHRoaXMubm9vZkksIGdsLlVOU0lHTkVEX0lOVCwgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodGhpcy5tdGwuc2hkSXNMb2FkZWQgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJpbURhdGEodGltZXIpO1xyXG4gICAgICAgIGlmICh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJbk5vcm1hbFwiXSA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDEyLCAwKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuVkJ1Zi5hcHBseSh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJblBvc2l0aW9uXCJdLmxvYywgMjQsIDApO1xyXG4gICAgICAgICAgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluTm9ybWFsXCJdLmxvYywgMjQsIDEyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tdGwuc2hhZGVyLnVwZGF0ZVNoYWRlckRhdGEoKTtcclxuICAgICAgfVxyXG4gICAgICBnbC5iaW5kVmVydGV4QXJyYXkodGhpcy5WQS5pZCk7XHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLlZCdWYuaWQpO1xyXG4gICAgICBnbC5kcmF3QXJyYXlzKGdsLkxJTkVfU1RSSVAsIDAsIHRoaXMubm9vZlYpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgX3ZlcnRleCB7XHJcbiAgY29uc3RydWN0b3IocG9zLCBub3JtKSB7XHJcbiAgICAodGhpcy5wb3MgPSBwb3MpLCAodGhpcy5ub3JtID0gbm9ybSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdnJ0KHBvcywgbm9ybSkge1xyXG4gIHJldHVybiBuZXcgX3ZlcnRleChwb3MsIG5vcm0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJpbUNyZWF0ZShuYW1lLCB0eXBlLCBtdGwsIHBvcywgc2lkZSA9IDMsIGdsKSB7XHJcbiAgbGV0IHZpO1xyXG4gIGlmICh0eXBlID09IFwiY3ViZVwiKSB2aSA9IGN1YmVDcmVhdGUoKTtcclxuICBpZiAodHlwZSA9PSBcImVhcnRoXCIpIHZpID0gZWFydGhDcmVhdGUoKTtcclxuICBsZXQgdmVydCA9IHZpWzBdLFxyXG4gICAgaW5kID0gdmlbMV07XHJcblxyXG4gIGxldCB2ZXJ0ZXhBcnJheSA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgZ2wuYmluZFZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcclxuICBsZXQgdmVydGV4QnVmZmVyID0gdmVydGV4X2J1ZmZlcih2ZXJ0LCBnbCksXHJcbiAgICBpbmRleEJ1ZmZlcixcclxuICAgIGluZGxlbjtcclxuXHJcbiAgaWYgKGluZCAhPSBudWxsKSAoaW5kZXhCdWZmZXIgPSBpbmRleF9idWZmZXIoaW5kLCBnbCkpLCAoaW5kbGVuID0gaW5kLmxlbmd0aCk7XHJcbiAgZWxzZSAoaW5kZXhCdWZmZXIgPSBudWxsKSwgKGluZGxlbiA9IG51bGwpO1xyXG5cclxuICByZXR1cm4gbmV3IF9wcmltKFxyXG4gICAgZ2wsXHJcbiAgICBuYW1lLFxyXG4gICAgdHlwZSxcclxuICAgIG10bCxcclxuICAgIHBvcyxcclxuICAgIHZlcnRleEJ1ZmZlcixcclxuICAgIGluZGV4QnVmZmVyLFxyXG4gICAgdmVydGV4QXJyYXksXHJcbiAgICBpbmRsZW4sXHJcbiAgICB2ZXJ0Lmxlbmd0aCxcclxuICAgIHNpZGVcclxuICApO1xyXG59XHJcbiIsImNsYXNzIF90aW1lciB7XHJcbiAgLy8gVGltZXIgb2J0YWluIGN1cnJlbnQgdGltZSBpbiBzZWNvbmRzIG1ldGhvZFxyXG4gIGdldFRpbWUoKSB7XHJcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgIGxldCB0ID1cclxuICAgICAgZGF0ZS5nZXRNaWxsaXNlY29uZHMoKSAvIDEwMDAuMCArXHJcbiAgICAgIGRhdGUuZ2V0U2Vjb25kcygpICtcclxuICAgICAgZGF0ZS5nZXRNaW51dGVzKCkgKiA2MDtcclxuICAgIHJldHVybiB0O1xyXG4gIH07XHJcblxyXG4gIC8vIFRpbWVyIHJlc3BvbnNlIG1ldGhvZFxyXG4gIHJlc3BvbnNlKCkge1xyXG4gICAgbGV0IHQgPSB0aGlzLmdldFRpbWUoKTtcclxuICAgIC8vIEdsb2JhbCB0aW1lXHJcbiAgICB0aGlzLmdsb2JhbFRpbWUgPSB0O1xyXG4gICAgdGhpcy5nbG9iYWxEZWx0YVRpbWUgPSB0IC0gdGhpcy5vbGRUaW1lO1xyXG4gICAgLy8gVGltZSB3aXRoIHBhdXNlXHJcbiAgICBpZiAodGhpcy5pc1BhdXNlKSB7XHJcbiAgICAgIHRoaXMubG9jYWxEZWx0YVRpbWUgPSAwO1xyXG4gICAgICB0aGlzLnBhdXNlVGltZSArPSB0IC0gdGhpcy5vbGRUaW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5sb2NhbERlbHRhVGltZSA9IHRoaXMuZ2xvYmFsRGVsdGFUaW1lO1xyXG4gICAgICB0aGlzLmxvY2FsVGltZSA9IHQgLSB0aGlzLnBhdXNlVGltZSAtIHRoaXMuc3RhcnRUaW1lO1xyXG4gICAgfVxyXG4gICAgLy8gRlBTXHJcbiAgICB0aGlzLmZyYW1lQ291bnRlcisrO1xyXG4gICAgaWYgKHQgLSB0aGlzLm9sZFRpbWVGUFMgPiAzKSB7XHJcbiAgICAgIHRoaXMuRlBTID0gdGhpcy5mcmFtZUNvdW50ZXIgLyAodCAtIHRoaXMub2xkVGltZUZQUyk7XHJcbiAgICAgIHRoaXMub2xkVGltZUZQUyA9IHQ7XHJcbiAgICAgIHRoaXMuZnJhbWVDb3VudGVyID0gMDtcclxuICAgICAgLy9pZiAodGFnX2lkICE9IG51bGwpXHJcbiAgICAgIC8vICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWdfaWQpLmlubmVySFRNTCA9IHRoaXMuZ2V0RlBTKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9sZFRpbWUgPSB0O1xyXG4gIH07XHJcbiBcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIC8vIEZpbGwgdGltZXIgZ2xvYmFsIGRhdGFcclxuICAgIHRoaXMuZ2xvYmFsVGltZSA9IHRoaXMubG9jYWxUaW1lID0gdGhpcy5nZXRUaW1lKCk7XHJcbiAgICB0aGlzLmdsb2JhbERlbHRhVGltZSA9IHRoaXMubG9jYWxEZWx0YVRpbWUgPSAwO1xyXG4gIFxyXG4gICAgLy8gRmlsbCB0aW1lciBzZW1pIGdsb2JhbCBkYXRhXHJcbiAgICB0aGlzLnN0YXJ0VGltZSA9IHRoaXMub2xkVGltZSA9IHRoaXMub2xkVGltZUZQUyA9IHRoaXMuZ2xvYmFsVGltZTtcclxuICAgIHRoaXMuZnJhbWVDb3VudGVyID0gMDtcclxuICAgIHRoaXMuaXNQYXVzZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5GUFMgPSAzMC4wO1xyXG4gICAgdGhpcy5wYXVzZVRpbWUgPSAwO1xyXG4gIH1cclxuICAvLyBPYnRhaW4gRlBTIGFzIHN0cmluZyBtZXRob2RcclxuICBnZXRGUFMgPSAoKSA9PiB0aGlzLkZQUy50b0ZpeGVkKDMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXIoKSB7XHJcbiAgcmV0dXJuIG5ldyBfdGltZXIoKTtcclxufSIsImltcG9ydCB7IHZlYzMgfSBmcm9tIFwiLi92ZWMzLmpzXCI7XHJcbmltcG9ydCB7IG1hdDQgfSBmcm9tIFwiLi9tYXQ0LmpzXCI7XHJcblxyXG5jb25zdCBEMlIgPSBkZWdyZWVzID0+IGRlZ3JlZXMgKiBNYXRoLlBJIC8gMTgwO1xyXG5jb25zdCBSMkQgPSByYWRpYW5zID0+IHJhZGlhbnMgKiAxODAgLyBNYXRoLlBJO1xyXG4gXHJcbmZ1bmN0aW9uIGRpc3RhbmNlKHAxLCBwMikge1xyXG4gIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDEuY2xpZW50WCAtIHAyLmNsaWVudFgsIDIpICsgTWF0aC5wb3cocDEuY2xpZW50WSAtIHAyLmNsaWVudFksIDIpKTtcclxufVxyXG4gXHJcbmV4cG9ydCBjbGFzcyBpbnB1dCB7XHJcbiAgY29uc3RydWN0b3Iocm5kKSB7XHJcbiAgICAvL2dsLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB0aGlzLm9uQ2xpY2soZSkpO1xyXG4gICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5vbk1vdXNlTW92ZShlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCAoZSkgPT4gdGhpcy5vbk1vdXNlV2hlZWwoZSkpO1xyXG4gICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5vbk1vdXNlRG93bihlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5vbk1vdXNlVXAoZSkpO1xyXG4gICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiBlLnByZXZlbnREZWZhdWx0KCkpO1xyXG4gICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG4gICAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5vblRvdWNoU3RhcnQoZSkpO1xyXG4gICAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLm9uVG91Y2hNb3ZlKGUpKTtcclxuICAgICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLm9uVG91Y2hFbmQoZSkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHRoaXMub25LZXlEb3duKGUpKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlKSA9PiB0aGlzLm9uS2V5VXAoZSkpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1YID0gMDtcclxuICAgIHRoaXMubVkgPSAwO1xyXG4gICAgdGhpcy5tWiA9IDA7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zID0gWzAsIDAsIDAsIDAsIDBdO1xyXG4gICAgdGhpcy5tQnV0dG9uc09sZCA9IFswLCAwLCAwLCAwLCAwXTtcclxuICAgIHRoaXMubUJ1dHRvbnNDbGljayA9IFswLCAwLCAwLCAwLCAwXTtcclxuICAgIFxyXG4gICAgLy8gWm9vbSBzcGVjaWZpY1xyXG4gICAgdGhpcy5zY2FsaW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLmRpc3QgPSAwO1xyXG4gICAgdGhpcy5zY2FsZV9mYWN0b3IgPSAxLjA7XHJcbiAgICB0aGlzLmN1cnJfc2NhbGUgPSAxLjA7XHJcbiAgICB0aGlzLm1heF96b29tID0gOC4wO1xyXG4gICAgdGhpcy5taW5fem9vbSA9IDAuNTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB0aGlzLmtleXMgPSBbXTtcclxuICAgIHRoaXMua2V5c09sZCA9IFtdO1xyXG4gICAgdGhpcy5rZXlzQ2xpY2sgPSBbXTtcclxuICAgIFtcclxuICAgICAgXCJFbnRlclwiLCBcIkJhY2tzcGFjZVwiLFxyXG4gICAgICBcIkRlbGV0ZVwiLCBcIlNwYWNlXCIsIFwiVGFiXCIsIFwiRXNjYXBlXCIsIFwiQXJyb3dMZWZ0XCIsIFwiQXJyb3dVcFwiLCBcIkFycm93UmlnaHRcIixcclxuICAgICAgXCJBcnJvd0Rvd25cIiwgXCJTaGlmdFwiLCBcIkNvbnRyb2xcIiwgXCJBbHRcIiwgXCJTaGlmdExlZnRcIiwgXCJTaGlmdFJpZ2h0XCIsIFwiQ29udHJvbExlZnRcIixcclxuICAgICAgXCJDb250cm9sUmlnaHRcIiwgXCJQYWdlVXBcIiwgXCJQYWdlRG93blwiLCBcIkVuZFwiLCBcIkhvbWVcIixcclxuICAgICAgXCJEaWdpdDBcIiwgXCJEaWdpdDFcIixcclxuICAgICAgXCJLZXlBXCIsXHJcbiAgICAgIFwiTnVtcGFkMFwiLCBcIk51bXBhZE11bHRpcGx5XCIsXHJcbiAgICAgIFwiRjFcIixcclxuICAgIF0uZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmtleXNba2V5XSA9IDA7XHJcbiAgICAgIHRoaXMua2V5c09sZFtrZXldID0gMDtcclxuICAgICAgdGhpcy5rZXlzQ2xpY2tba2V5XSA9IDA7XHJcbiAgICB9KTtcclxuIFxyXG4gICAgdGhpcy5zaGlmdEtleSA9IGZhbHNlO1xyXG4gICAgdGhpcy5hbHRLZXkgPSBmYWxzZTtcclxuICAgIHRoaXMuY3RybEtleSA9IGZhbHNlO1xyXG4gXHJcbiAgICB0aGlzLmlzRmlyc3QgPSB0cnVlO1xyXG4gIH0gLy8gRW5kIG9mICdjb25zdHJ1Y3RvcicgZnVuY3Rpb25cclxuIFxyXG4gIC8vLyBNb3VzZSBoYW5kbGUgZnVuY3Rpb25zXHJcbiBcclxuICBvbkNsaWNrKGUpIHtcclxuICAgIC8vY3JpYVxyXG4gIH0gLy8gRW5kIG9mICdvbkNsaWNrJyBmdW5jdGlvblxyXG4gIFxyXG4gIG9uVG91Y2hTdGFydChlKSB7XHJcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAxKVxyXG4gICAgICB0aGlzLm1CdXR0b25zWzBdID0gMTtcclxuICAgIGVsc2UgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMikge1xyXG4gICAgICB0aGlzLm1CdXR0b25zWzBdID0gMDtcclxuICAgICAgdGhpcy5tQnV0dG9uc1syXSA9IDE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5tQnV0dG9uc1swXSA9IDA7XHJcbiAgICAgIHRoaXMubUJ1dHRvbnNbMl0gPSAwO1xyXG4gICAgICB0aGlzLm1CdXR0b25zWzFdID0gMTtcclxuICAgIH1cclxuICAgIGxldFxyXG4gICAgICB4ID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZS50YXJnZXQub2Zmc2V0TGVmdCxcclxuICAgICAgeSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGUudGFyZ2V0Lm9mZnNldFRvcDtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuICAgIHRoaXMubVggPSB4O1xyXG4gICAgdGhpcy5tWSA9IHk7XHJcbiBcclxuICAgIGxldCB0dCA9IGUudGFyZ2V0VG91Y2hlcztcclxuICAgIGlmICh0dC5sZW5ndGggPj0gMikge1xyXG4gICAgICB0aGlzLmRpc3QgPSBkaXN0YW5jZSh0dFswXSwgdHRbMV0pO1xyXG4gICAgICB0aGlzLnNjYWxpbmcgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHsgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICB0aGlzLnNjYWxpbmcgPSBmYWxzZTtcclxuICAgIH1cclxuICB9IC8vIEVuZCBvZiAnb25Ub3VjaFN0YXJ0JyBmdW5jdGlvblxyXG4gXHJcbiAgb25Ub3VjaE1vdmUoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gXHJcbiAgICBsZXRcclxuICAgICAgeCA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWCAtIGUudGFyZ2V0Lm9mZnNldExlZnQsXHJcbiAgICAgIHkgPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3A7XHJcbiBcclxuICAgIGxldCB0dCA9IGUudGFyZ2V0VG91Y2hlcztcclxuXHJcbiAgICBpZiAodGhpcy5zY2FsaW5nKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgIHRoaXMubUR6ID0gMDtcclxuICAgICAgdGhpcy5jdXJyX3NjYWxlID0gKGRpc3RhbmNlKHR0WzBdLCB0dFsxXSkgLyB0aGlzLmRpc3QpICogdGhpcy5zY2FsZV9mYWN0b3I7XHJcbiBcclxuICAgICAgbGV0IGQgPSBkaXN0YW5jZSh0dFswXSwgdHRbMV0pO1xyXG4gICAgICBpZiAoTWF0aC5hYnMoZCAtIHRoaXMuZGlzdCkgPiAwKSB7Ly80Nykge1xyXG4gICAgICAgIGlmIChkIDwgdGhpcy5kaXN0KVxyXG4gICAgICAgICAgdGhpcy5tRHogPSAxICogKGQgLyB0aGlzLmRpc3QpLCB0aGlzLmRpc3QgPSBkO1xyXG4gICAgICAgIGVsc2UgaWYgKGQgPiB0aGlzLmRpc3QpXHJcbiAgICAgICAgICB0aGlzLm1EeiA9IC0xICogKHRoaXMuZGlzdCAvIGQpLCB0aGlzLmRpc3QgPSBkO1xyXG4gICAgICAgIHRoaXMubVogKz0gdGhpcy5tRHo7XHJcbiBcclxuICAgICAgICB0aGlzLm1EeCA9IHggLSB0aGlzLm1YO1xyXG4gICAgICAgIHRoaXMubUR5ID0geSAtIHRoaXMubVk7XHJcbiAgICAgICAgdGhpcy5tWCA9IHg7XHJcbiAgICAgICAgdGhpcy5tWSA9IHk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiBcclxuICAgIGlmICh0aGlzLm1CdXR0b25zWzFdID09IDEpIHtcclxuICAgICAgdGhpcy5tRHggPSAwO1xyXG4gICAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICAgIHRoaXMubUR6ID0geSAtIHRoaXMubVo7XHJcbiAgICAgIHRoaXMubVggPSB4O1xyXG4gICAgICB0aGlzLm1ZID0geTtcclxuICAgICAgdGhpcy5tWiArPSB0aGlzLm1EejtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubUR4ID0geCAtIHRoaXMubVg7XHJcbiAgICAgIHRoaXMubUR5ID0geSAtIHRoaXMubVk7XHJcbiAgICAgIHRoaXMubUR6ID0gMDtcclxuICAgICAgdGhpcy5tWCA9IHg7XHJcbiAgICAgIHRoaXMubVkgPSB5O1xyXG4gICAgfSAgXHJcbiAgfSAvLyBFbmQgb2YgJ29uVG91Y2hNb3ZlJyBmdW5jdGlvblxyXG4gXHJcbiAgb25Ub3VjaEVuZChlKSB7XHJcbiAgICB0aGlzLm1CdXR0b25zWzBdID0gMDtcclxuICAgIHRoaXMubUJ1dHRvbnNbMV0gPSAwO1xyXG4gICAgdGhpcy5tQnV0dG9uc1syXSA9IDA7XHJcbiAgICBsZXRcclxuICAgICAgeCA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWCAtIGUudGFyZ2V0Lm9mZnNldExlZnQsXHJcbiAgICAgIHkgPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3A7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1YID0geDtcclxuICAgIHRoaXMubVkgPSB5O1xyXG4gXHJcbiAgICBsZXQgdHQgPSBlLnRhcmdldFRvdWNoZXM7XHJcbiAgICBpZiAodHQubGVuZ3RoIDwgMikge1xyXG4gICAgICB0aGlzLnNjYWxpbmcgPSBmYWxzZTtcclxuICAgICAgaWYgKHRoaXMuY3Vycl9zY2FsZSA8IHRoaXMubWluX3pvb20pIHtcclxuICAgICAgICB0aGlzLnNjYWxlX2ZhY3RvciA9IHRoaXMubWluX3pvb207XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY3Vycl9zY2FsZSA+IHRoaXMubWF4X3pvb20pIHtcclxuICAgICAgICAgIHRoaXMuc2NhbGVfZmFjdG9yID0gdGhpcy5tYXhfem9vbTsgXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuc2NhbGVfZmFjdG9yID0gdGhpcy5jdXJyX3NjYWxlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zY2FsaW5nID0gdHJ1ZTtcclxuICAgIH1cclxuICB9IC8vIEVuZCBvZiAnb25Ub3VjaE1vdmUnIGZ1bmN0aW9uXHJcbiBcclxuICBvbk1vdXNlTW92ZShlKSB7XHJcbiAgICBsZXRcclxuICAgICAgZHggPSBlLm1vdmVtZW50WCxcclxuICAgICAgZHkgPSBlLm1vdmVtZW50WTtcclxuICAgIHRoaXMubUR4ID0gZHg7XHJcbiAgICB0aGlzLm1EeSA9IGR5O1xyXG4gICAgdGhpcy5tRHogPSAwO1xyXG4gICAgdGhpcy5tWCArPSBkeDtcclxuICAgIHRoaXMubVkgKz0gZHk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uTW91c2VNb3ZlJyBmdW5jdGlvblxyXG4gXHJcbiAgb25Nb3VzZVdoZWVsKGUpIHtcclxuICAgIGlmIChlLndoZWVsRGVsdGEgIT0gMClcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpcy5tWiArPSAodGhpcy5tRHogPSBlLndoZWVsRGVsdGEgLyAxMjApO1xyXG4gIH0gLy8gRW5kIG9mICdvbk1vdXNlV2hlZWwnIGZ1bmN0aW9uXHJcbiBcclxuICBvbk1vdXNlRG93bihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiBcclxuICAgIHRoaXMubUJ1dHRvbnNPbGRbZS5idXR0b25dID0gdGhpcy5tQnV0dG9uc1tlLmJ1dHRvbl07XHJcbiAgICB0aGlzLm1CdXR0b25zW2UuYnV0dG9uXSA9IDE7XHJcbiAgICB0aGlzLm1CdXR0b25zQ2xpY2tbZS5idXR0b25dID0gIXRoaXMubUJ1dHRvbnNPbGRbZS5idXR0b25dICYmIHRoaXMubUJ1dHRvbnNbZS5idXR0b25dO1xyXG4gICAgXHJcbiAgICB0aGlzLnNoaWZ0S2V5ID0gZS5zaGlmdEtleTtcclxuICAgIHRoaXMuYWx0S2V5ID0gZS5hbHRLZXk7XHJcbiAgICB0aGlzLmN0cmxLZXkgPSBlLmN0cmxLZXk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uTW91c2VNb3ZlJyBmdW5jdGlvblxyXG4gIFxyXG4gIG9uTW91c2VVcChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiBcclxuICAgIHRoaXMubUJ1dHRvbnNPbGRbZS5idXR0b25dID0gdGhpcy5tQnV0dG9uc1tlLmJ1dHRvbl07XHJcbiAgICB0aGlzLm1CdXR0b25zW2UuYnV0dG9uXSA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zQ2xpY2tbZS5idXR0b25dID0gMDtcclxuIFxyXG4gICAgdGhpcy5zaGlmdEtleSA9IGUuc2hpZnRLZXk7XHJcbiAgICB0aGlzLmFsdEtleSA9IGUuYWx0S2V5O1xyXG4gICAgdGhpcy5jdHJsS2V5ID0gZS5jdHJsS2V5O1xyXG4gIH0gLy8gRW5kIG9mICdvbk1vdXNlTW92ZScgZnVuY3Rpb25cclxuIFxyXG4gIC8vLyBLZXlib2FyZCBoYW5kbGVcclxuICBvbktleURvd24oZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAndGV4dGFyZWEnKVxyXG4gICAgICByZXR1cm47XHJcbiAgICBsZXQgZm9jdXNlZF9lbGVtZW50ID0gbnVsbDtcclxuICAgIGlmIChkb2N1bWVudC5oYXNGb2N1cygpICYmXHJcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSAmJlxyXG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG4gICAgICBmb2N1c2VkX2VsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xyXG4gICAgICBpZiAoZm9jdXNlZF9lbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAndGV4dGFyZWEnKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH0gICAgICBcclxuICAgIGlmIChlLmNvZGUgIT0gXCJGMTJcIiAmJiBlLmNvZGUgIT0gXCJGMTFcIiAmJiBlLmNvZGUgIT0gXCJLZXlSXCIpXHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMua2V5c09sZFtlLmNvZGVdID0gdGhpcy5rZXlzW2UuY29kZV07XHJcbiAgICB0aGlzLmtleXNbZS5jb2RlXSA9IDE7XHJcbiAgICB0aGlzLmtleXNDbGlja1tlLmNvZGVdID0gIXRoaXMua2V5c09sZFtlLmNvZGVdICYmIHRoaXMua2V5c1tlLmNvZGVdO1xyXG4gICAgXHJcbiAgICB0aGlzLnNoaWZ0S2V5ID0gZS5zaGlmdEtleTtcclxuICAgIHRoaXMuYWx0S2V5ID0gZS5hbHRLZXk7XHJcbiAgICB0aGlzLmN0cmxLZXkgPSBlLmN0cmxLZXk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uS2V5RG93bicgZnVuY3Rpb25cclxuICBcclxuICBvbktleVVwKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3RleHRhcmVhJylcclxuICAgICAgcmV0dXJuO1xyXG4gICAgbGV0IGZvY3VzZWRfZWxlbWVudCA9IG51bGw7XHJcbiAgICBpZiAoZG9jdW1lbnQuaGFzRm9jdXMoKSAmJlxyXG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmJvZHkgJiZcclxuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpIHtcclxuICAgICAgZm9jdXNlZF9lbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgaWYgKGZvY3VzZWRfZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3RleHRhcmVhJylcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9ICAgICAgXHJcbiAgICBpZiAoZS5jb2RlICE9IFwiRjEyXCIgJiYgZS5jb2RlICE9IFwiRjExXCIgJiYgZS5jb2RlICE9IFwiS2V5UlwiKVxyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLmtleXNPbGRbZS5jb2RlXSA9IHRoaXMua2V5c1tlLmNvZGVdO1xyXG4gICAgdGhpcy5rZXlzW2UuY29kZV0gPSAwO1xyXG4gICAgdGhpcy5rZXlzQ2xpY2tbZS5jb2RlXSA9IDA7XHJcbiBcclxuICAgIHRoaXMuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5O1xyXG4gICAgdGhpcy5hbHRLZXkgPSBlLmFsdEtleTtcclxuICAgIHRoaXMuY3RybEtleSA9IGUuY3RybEtleTtcclxuICB9IC8vIEVuZCBvZiAnb25LZXlVcCcgZnVuY3Rpb25cclxuICBcclxuICAvLy8gQ2FtZXJhIG1vdmVtZW50IGhhbmRsaW5nXHJcbiAgcmVzZXQoKSB7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zQ2xpY2suZm9yRWFjaChrID0+IHRoaXMubUJ1dHRvbnNDbGlja1trXSA9IDApO1xyXG4gICAgdGhpcy5rZXlzQ2xpY2suZm9yRWFjaChrID0+IHRoaXMua2V5c0NsaWNrW2tdID0gMCk7XHJcbiBcclxuICAgIHRoaXMuc2hpZnRLZXkgPSB0aGlzLmtleXNbXCJTaGlmdExlZnRcIl0gfHwgdGhpcy5rZXlzW1wiU2hpZnRSaWdodFwiXTtcclxuICAgIHRoaXMuYWx0S2V5ID0gdGhpcy5rZXlzW1wiQWx0TGVmdFwiXSB8fCB0aGlzLmtleXNbXCJBbHRSaWdodFwiXTtcclxuICAgIHRoaXMuY3RybEtleSA9IHRoaXMua2V5c1tcIkNvbnRyb2xMZWZ0XCJdIHx8IHRoaXMua2V5c1tcIkNvbnRyb2xSaWdodFwiXTtcclxuICB9IC8vIEVuZCBvZiByZXNldCcgZnVuY3Rpb25cclxuICAgICAgICAgIFxyXG4gIHJlc3BvbnNlQ2FtZXJhKHJuZCkge1xyXG4gICAgaWYgKHRoaXMuc2hpZnRLZXkgJiYgdGhpcy5rZXlzQ2xpY2tbXCJLZXlGXCJdKSB7XHJcbiAgICAgIHJuZC5jYW0gPSBybmQuY2FtLmNhbVNldCh2ZWMzKDYpLCB2ZWMzKDApLCB2ZWMzKDAsIDEsIDApKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuY3RybEtleSkge1xyXG4gICAgICAvLyBIYW5kbGUgY2FtZXJhIG9yaWVudGF0aW9uXHJcbiAgICAgIGxldFxyXG4gICAgICAgIERpc3QgPSBybmQuY2FtLmF0LnN1YihybmQuY2FtLmxvYykubGVuKCksXHJcbiAgICAgICAgY29zVCA9IChybmQuY2FtLmxvYy55IC0gcm5kLmNhbS5hdC55KSAvIERpc3QsXHJcbiAgICAgICAgc2luVCA9IE1hdGguc3FydCgxIC0gY29zVCAqIGNvc1QpLFxyXG4gICAgICAgIHBsZW4gPSBEaXN0ICogc2luVCxcclxuICAgICAgICBjb3NQID0gKHJuZC5jYW0ubG9jLnogLSBybmQuY2FtLmF0LnopIC8gcGxlbixcclxuICAgICAgICBzaW5QID0gKHJuZC5jYW0ubG9jLnggLSBybmQuY2FtLmF0LngpIC8gcGxlbixcclxuICAgICAgICBhemltdXRoID0gUjJEKE1hdGguYXRhbjIoc2luUCwgY29zUCkpLFxyXG4gICAgICAgIGVsZXZhdG9yID0gUjJEKE1hdGguYXRhbjIoc2luVCwgY29zVCkpO1xyXG4gXHJcbiAgICAgIGF6aW11dGggKz0gcm5kLnRpbWVyLmdsb2JhbERlbHRhVGltZSAqIDMgKlxyXG4gICAgICAgICgtMzAgKiB0aGlzLm1CdXR0b25zWzBdICogdGhpcy5tRHggK1xyXG4gICAgICAgICA0NyAqICh0aGlzLmtleXNbXCJBcnJvd0xlZnRcIl0gLSB0aGlzLmtleXNbXCJBcnJvd1JpZ2h0XCJdKSk7XHJcbiBcclxuICAgICAgZWxldmF0b3IgKz0gcm5kLnRpbWVyLmdsb2JhbERlbHRhVGltZSAqIDIgKlxyXG4gICAgICAgICgtMzAgKiB0aGlzLm1CdXR0b25zWzBdICogdGhpcy5tRHkgK1xyXG4gICAgICAgICA0NyAqICh0aGlzLmtleXNbXCJBcnJvd1VwXCJdIC0gdGhpcy5rZXlzW1wiQXJyb3dEb3duXCJdKSk7XHJcbiAgICAgIGlmIChlbGV2YXRvciA8IDAuMDgpXHJcbiAgICAgICAgZWxldmF0b3IgPSAwLjA4O1xyXG4gICAgICBlbHNlIGlmIChlbGV2YXRvciA+IDE3OC45MClcclxuICAgICAgICBlbGV2YXRvciA9IDE3OC45MDtcclxuIFxyXG4gICAgICBEaXN0ICs9IHJuZC50aW1lci5nbG9iYWxEZWx0YVRpbWUgKiAoMSArIHRoaXMuc2hpZnRLZXkgKiAxOCkgKlxyXG4gICAgICAgICg4ICogdGhpcy5tRHogK1xyXG4gICAgICAgICA4ICogKHRoaXMua2V5c1tcIlBhZ2VVcFwiXSAtIHRoaXMua2V5c1tcIlBhZ2VEb3duXCJdKSk7XHJcbiAgICAgIGlmIChEaXN0IDwgMC4xKVxyXG4gICAgICAgIERpc3QgPSAwLjE7XHJcbiBcclxuICAgICAgLyogSGFuZGxlIGNhbWVyYSBwb3NpdGlvbiAqL1xyXG4gICAgICBpZiAodGhpcy5tQnV0dG9uc1syXSkge1xyXG4gICAgICAgIGxldCBXcCA9IHJuZC5jYW0ucHJvalNpemU7XHJcbiAgICAgICAgbGV0IEhwID0gcm5kLmNhbS5wcm9qU2l6ZTtcclxuICAgICAgICBpZiAocm5kLmNhbS5mcmFtZVcgPiBybmQuY2FtLmZyYW1lSClcclxuICAgICAgICAgIFdwICo9IHJuZC5jYW0uZnJhbWVXIC8gcm5kLmNhbS5mcmFtZUg7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgSHAgKj0gcm5kLmNhbS5mcmFtZUggLyBybmQuY2FtLmZyYW1lVztcclxuICAgICAgICBsZXQgc3ggPSAtdGhpcy5tRHggKiBXcCAvIHJuZC5jYW0uZnJhbWVXICogRGlzdCAvIHJuZC5jYW0ucHJvakRpc3Q7XHJcbiAgICAgICAgbGV0IHN5ID0gdGhpcy5tRHkgKiBIcCAvIHJuZC5jYW0uZnJhbWVIICogRGlzdCAvIHJuZC5jYW0ucHJvakRpc3Q7XHJcbiBcclxuICAgICAgICBsZXQgZHYgPSBybmQuY2FtLnJpZ2h0Lm11bE51bShzeCkuYWRkKHJuZC5jYW0udXAubXVsTnVtKHN5KSk7XHJcbiAgICAgICAgcm5kLmNhbS5hdCA9IHJuZC5jYW0uYXQuYWRkKGR2KTtcclxuICAgICAgICBybmQuY2FtLmxvYyA9IHJuZC5jYW0ubG9jLmFkZChkdik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBsb2MgPSBtYXQ0KCkubWF0clJvdGF0ZShlbGV2YXRvciwgdmVjMygxLCAwLCAwKSkubWF0ck11bE1hdHIyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgbWF0NCgpLm1hdHJSb3RhdGUoYXppbXV0aCwgdmVjMygwLCAxLCAwKSkubWF0ck11bE1hdHIyKCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0NCgpLm1hdHJUcmFuc2xhdGUocm5kLmNhbS5hdCkpKS50cmFuc2Zvcm1Qb2ludCh2ZWMzKDAsIERpc3QsIDApKVxyXG4gICAgICAvKiBTZXR1cCByZXN1bHQgY2FtZXJhICovXHJcbiAgICAgIHJuZC5jYW0gPSBybmQuY2FtLmNhbVNldChsb2MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcm5kLmNhbS5hdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWMzKDAsIDEsIDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgbWF0clJvdGF0ZShhemltdXRoLCB2ZWMzKDAsIDEsIDApKS5tYXRyTXVsTWF0cjIoIFxyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICBtYXRyVHJhbnNsYXRlKHJuZC5jYW0uYXQpKSkudHJhbnNmb3JtUG9pbnQodmVjMygwLCBEaXN0LCAwKSksXHJcbiAgICAgIC8vICAgICAgICAgICBybmQuY2FtLmF0LFxyXG4gICAgICAvLyAgICAgICAgICAgdmVjMygwLCAxLCAwKVxyXG4gICAgICAvLyAgICAgICAgICAgKTtcclxuICAgIH1cclxuICB9IC8vIEVuZCBvZiAncmVzcG9uc2XRgUNhbWVyYScgZnVuY3Rpb25cclxufSAvLyBFbmQgb2YgJ2lucHV0JyBjbGFzc1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlucHV0X2luaXQocm5kKSB7XHJcbiAgICByZXR1cm4gbmV3IGlucHV0KHJuZCk7XHJcbn0iLCJpbXBvcnQgeyBwcmltQ3JlYXRlIH0gZnJvbSBcIi4uL3ByaW1zL3ByaW0uanNcIjtcclxuaW1wb3J0IHsgbWF0NCB9IGZyb20gXCIuLi9tdGgvbWF0NC5qc1wiO1xyXG5pbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4uL210aC92ZWMzLmpzXCI7XHJcbmltcG9ydCB7IHRpbWVyIH0gZnJvbSBcIi4uL3RpbWUvdGltZXIuanNcIjtcclxuaW1wb3J0IHsgaW5wdXRfaW5pdCB9IGZyb20gXCIuLi9tdGgvaW5wdXQuanNcIjtcclxuXHJcbmNsYXNzIF9yZW5kZXIge1xyXG4gIGNvbnN0cnVjdG9yKGNhbnZhcywgbmFtZSwgY2FtZXJhKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XHJcbiAgICB0aGlzLmdsLmVuYWJsZSh0aGlzLmdsLkRFUFRIX1RFU1QpO1xyXG4gICAgdGhpcy5nbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjEsIDEpO1xyXG4gICAgdGhpcy5wcmcgPSB0aGlzLmdsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgIHRoaXMudGltZXIgPSB0aW1lcigpO1xyXG4gICAgdGhpcy5wcmltcyA9IFtdO1xyXG4gICAgdGhpcy5pbnB1dCA9IGlucHV0X2luaXQodGhpcyk7XHJcbiAgICB0aGlzLmNhbSA9IGNhbWVyYTtcclxuICB9XHJcblxyXG4gIHByaW1BdHRhY2gobmFtZSwgdHlwZSwgbXRsLCBwb3MsIHNpZGUgPSAzKSB7XHJcbiAgICBsZXQgcCA9IHByaW1DcmVhdGUobmFtZSwgdHlwZSwgbXRsLCBwb3MsIHNpZGUsIHRoaXMuZ2wpO1xyXG4gICAgdGhpcy5wcmltc1t0aGlzLnByaW1zLmxlbmd0aF0gPSBwO1xyXG4gIH1cclxuXHJcbiAgcHJvZ3JhbVVuaWZvcm1zKHNoZCkge1xyXG4gICAgaWYgKHNoZC51bmlmb3Jtc1tcIm1hdHJWaWV3XCJdICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAvL2xldCBtID0gbWF0NCgpLm1hdHJWaWV3KHZlYzMoNSwgMywgNSksIHZlYzMoMCwgMCwgMCksIHZlYzMoMCwgMSwgMCkpO1xyXG4gICAgICBsZXQgYXJyID0gdGhpcy5jYW0ubWF0clZpZXcudG9BcnJheSgpO1xyXG4gICAgICBsZXQgbVZMb2MgPSBzaGQudW5pZm9ybXNbXCJtYXRyVmlld1wiXS5sb2M7XHJcbiAgICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihtVkxvYywgZmFsc2UsIGFycik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNoZC51bmlmb3Jtc1tcIm1hdHJQcm9qXCJdICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAvL2xldCBtMSA9IG1hdDQoKS5tYXRyRnJ1c3R1bSgtMC4wOCwgMC4wOCwgLTAuMDgsIDAuMDgsIDAuMSwgMjAwKTtcclxuICAgICAgbGV0IGFycjEgPSB0aGlzLmNhbS5tYXRyUHJvai50b0FycmF5KCk7XHJcbiAgICAgIGxldCBtUExvYyA9IHNoZC51bmlmb3Jtc1tcIm1hdHJQcm9qXCJdLmxvYztcclxuICAgICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KG1QTG9jLCBmYWxzZSwgYXJyMSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0cmFuc2Zvcm1Qcm9ncmFtVW5pZm9ybXMoc2hkKSB7XHJcbiAgICBpZiAoc2hkLnVuaWZvcm1zW1wiVGltZVwiXSA9PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIGxldCB0aW1lTG9jID0gc2hkLnVuaWZvcm1zW1wiVGltZVwiXS5sb2M7XHJcblxyXG4gICAgdGhpcy5nbC51bmlmb3JtMWYodGltZUxvYywgdGhpcy50aW1lci5nbG9iYWxUaW1lKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcigpIHtcclxuICAgIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuICAgIHRoaXMudGltZXIucmVzcG9uc2UoKTtcclxuICAgIHRoaXMuaW5wdXQucmVzcG9uc2VDYW1lcmEodGhpcyk7XHJcbiAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5wcmltcykge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgcC5tdGwuc2hhZGVyLmlkICE9IG51bGwgJiZcclxuICAgICAgICBwLm10bC5zaGFkZXIuc2hhZGVyc1swXS5pZCAhPSBudWxsICYmXHJcbiAgICAgICAgcC5tdGwuc2hhZGVyLnNoYWRlcnNbMV0uaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgIHAuc2hkSXNMb2FkZWQgPT0gbnVsbFxyXG4gICAgICApIHtcclxuICAgICAgICB0aGlzLmlucHV0LnJlc2V0KCk7XHJcbiAgICAgICAgcC5tdGwuYXBwbHkoKTtcclxuICAgICAgICB0aGlzLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGFkZXIpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtUHJvZ3JhbVVuaWZvcm1zKHAubXRsLnNoYWRlcik7XHJcbiAgICAgICAgcC5yZW5kZXIodGhpcy50aW1lcik7XHJcbiAgICAgICAgcC5zaGRJc0xvYWRlZCA9IDE7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwLnNoZElzTG9hZGVkID09IG51bGwpIHJldHVybjtcclxuICAgICAgcC5tdGwuYXBwbHkoKTtcclxuICAgICAgdGhpcy50cmFuc2Zvcm1Qcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hhZGVyKTtcclxuICAgICAgcC5yZW5kZXIodGhpcy50aW1lcik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ3JlYXRlKGNhbnZhcywgbmFtZSwgY2FtZXJhKSB7XHJcbiAgcmV0dXJuIG5ldyBfcmVuZGVyKGNhbnZhcywgbmFtZSwgY2FtZXJhKTtcclxufVxyXG4iLCJpbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4vdmVjM1wiO1xyXG5pbXBvcnQgeyBtYXQ0IH0gZnJvbSBcIi4vbWF0NFwiO1xyXG5cclxuY2xhc3MgX2NhbWVyYSB7XHJcbiAgY29uc3RydWN0b3IodywgaCkge1xyXG4gICAgdGhpcy5hdCA9IHZlYzMoMCwgMCwgMCk7XHJcbiAgICB0aGlzLmxvYyA9IHZlYzMoNSwgNSwgNSk7XHJcbiAgICB0aGlzLnVwID0gdmVjMygwLCAxLCAwKTtcclxuICAgICh0aGlzLm1hdHJWaWV3ID0gbnVsbCksICh0aGlzLm1hdHJWUCA9IG51bGwpO1xyXG4gICAgKHRoaXMuZGlyID0gbnVsbCksICh0aGlzLnJpZ2h0ID0gbnVsbCk7XHJcbiAgICBpZiAoaCA9PSB1bmRlZmluZWQpIGggPSB3O1xyXG4gICAgKHRoaXMuZnJhbWVXID0gdyksICh0aGlzLmZyYW1lSCA9IGgpO1xyXG4gIH1cclxuXHJcbiAgY2FtU2V0KGxvYywgYXQsIHVwKSB7XHJcbiAgICBpZiAobG9jID09IHVuZGVmaW5lZCkgbG9jID0gdGhpcy5sb2M7XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5sb2MgPSBsb2M7XHJcbiAgICB9XHJcbiAgICBpZiAoYXQgPT0gdW5kZWZpbmVkKSBhdCA9IHRoaXMuYXQ7XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5hdCA9IGF0O1xyXG4gICAgfVxyXG4gICAgaWYgKHVwID09IHVuZGVmaW5lZCkgdXAgPSB0aGlzLnVwO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMudXAgPSB1cDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1hdHJWaWV3ID0gbWF0NCgpLm1hdHJWaWV3KGxvYywgYXQsIHVwKTtcclxuXHJcbiAgICB0aGlzLnJpZ2h0ID0gdmVjMyhcclxuICAgICAgdGhpcy5tYXRyVmlldy5hWzBdWzBdLFxyXG4gICAgICB0aGlzLm1hdHJWaWV3LmFbMV1bMF0sXHJcbiAgICAgIHRoaXMubWF0clZpZXcuYVsyXVswXVxyXG4gICAgKTtcclxuICAgIHRoaXMudXAgPSB2ZWMzKFxyXG4gICAgICB0aGlzLm1hdHJWaWV3LmFbMF1bMV0sXHJcbiAgICAgIHRoaXMubWF0clZpZXcuYVsxXVsxXSxcclxuICAgICAgdGhpcy5tYXRyVmlldy5hWzJdWzFdXHJcbiAgICApO1xyXG4gICAgdGhpcy5kaXIgPSB2ZWMzKFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzBdWzJdLFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzFdWzJdLFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzJdWzJdXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBjYW1TZXRQcm9qKHByb2pTaXplLCBQcm9qRGlzdCwgUHJvakZhckNsaXApIHtcclxuICAgIGxldCByeCwgcnk7XHJcblxyXG4gICAgdGhpcy5wcm9qRGlzdCA9IFByb2pEaXN0O1xyXG4gICAgdGhpcy5wcm9qRmFyQ2xpcCA9IFByb2pGYXJDbGlwO1xyXG4gICAgcnggPSByeSA9IHRoaXMucHJvalNpemUgPSBwcm9qU2l6ZTtcclxuXHJcbiAgICAvKiBDb3JyZWN0IGFzcGVjdCByYXRpbyAqL1xyXG4gICAgaWYgKHRoaXMuZnJhbWVXID49IHRoaXMuZnJhbWVIKSByeCAqPSB0aGlzLmZyYW1lVyAvIHRoaXMuZnJhbWVIO1xyXG4gICAgZWxzZSByeSAqPSB0aGlzLmZyYW1lSCAvIHRoaXMuZnJhbWVXO1xyXG5cclxuICAgIHRoaXMud3AgPSByeDtcclxuICAgIHRoaXMuaHAgPSByeTtcclxuICAgIHRoaXMubWF0clByb2ogPSBtYXQ0KCkubWF0ckZydXN0dW0oXHJcbiAgICAgIC1yeCAvIDIsXHJcbiAgICAgIHJ4IC8gMixcclxuICAgICAgLXJ5IC8gMixcclxuICAgICAgcnkgLyAyLFxyXG4gICAgICB0aGlzLnByb2pEaXN0LFxyXG4gICAgICB0aGlzLnByb2pGYXJDbGlwXHJcbiAgICApO1xyXG4gICAgdGhpcy5tYXRyVlAgPSB0aGlzLm1hdHJWaWV3Lm1hdHJNdWxNYXRyMih0aGlzLm1hdHJQcm9qKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYW1lcmEodywgaCkge1xyXG4gIHJldHVybiBuZXcgX2NhbWVyYSh3LCBoKTtcclxufVxyXG4iLCJjbGFzcyBfaW1hZ2Uge1xyXG4gIGNvbnN0cnVjdG9yKGltZywgbmFtZSkge1xyXG4gICAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGltYWdlQ3JlYXRlKGltZywgbmFtZSkge1xyXG4gIHJldHVybiBuZXcgX2ltYWdlKGltZywgbmFtZSk7XHJcbn1cclxuXHJcbmNsYXNzIF90ZXh0dXJlIHtcclxuICBjb25zdHJ1Y3RvcihuYW1lVVJMLCB0ZXh0dXJlVHlwZSwgZ2wpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWVVUkwubmFtZTtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIGlmICh0ZXh0dXJlVHlwZSA9PSBcIjJkXCIpIHRoaXMudHlwZSA9IGdsLlRFWFRVUkVfMkQ7XHJcbiAgICBlbHNlICh0aGlzLnR5cGUgPSBudWxsKSwgY29uc29sZS5sb2coXCJ0ZXh0dXJlIHR5cGUgaXMgbm90IDJkXCIpO1xyXG4gICAgdGhpcy5pZCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudHlwZSwgdGhpcy5pZCk7XHJcbiAgICBpZiAobmFtZVVSTC5pbWcpIHtcclxuICAgICAgZ2wudGV4SW1hZ2UyRChcclxuICAgICAgICB0aGlzLnR5cGUsXHJcbiAgICAgICAgMCxcclxuICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgIDEsXHJcbiAgICAgICAgMSxcclxuICAgICAgICAwLFxyXG4gICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgZ2wuVU5TSUdORURfQllURSxcclxuICAgICAgICBuZXcgVWludDhBcnJheShbMjU1LCAyNTUsIDI1NSwgMF0pXHJcbiAgICAgICk7XHJcbiAgICAgIG5hbWVVUkwuaW1nLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnR5cGUsIHRoaXMuaWQpO1xyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xyXG4gICAgICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgICAgICB0aGlzLnR5cGUsXHJcbiAgICAgICAgICAwLFxyXG4gICAgICAgICAgZ2wuUkdCQSxcclxuICAgICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgICBnbC5VTlNJR05FRF9CWVRFLFxyXG4gICAgICAgICAgbmFtZVVSTC5pbWdcclxuICAgICAgICApO1xyXG4gICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKHRoaXMudHlwZSk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnR5cGUsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5SRVBFQVQpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50eXBlLCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuUkVQRUFUKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgdGhpcy50eXBlLFxyXG4gICAgICAgICAgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLFxyXG4gICAgICAgICAgZ2wuTElORUFSX01JUE1BUF9MSU5FQVJcclxuICAgICAgICApO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50eXBlLCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhcHBseShpLCBzaGQsIHRleCkge1xyXG4gICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRTAgKyBpKTtcclxuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGV4LnR5cGUsIHRleC5pZCk7XHJcblxyXG4gICAgaWYgKHNoZC51bmlmb3Jtc1tcImVhcnRoVGV4XCJdID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgbGV0IHRleExvYyA9IHNoZC51bmlmb3Jtc1tcImVhcnRoVGV4XCJdLmxvYztcclxuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHRleExvYywgaSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGV4dHVyZSh1cmwsIHR5cGUsIGdsKSB7XHJcbiAgcmV0dXJuIG5ldyBfdGV4dHVyZSh1cmwsIHR5cGUsIGdsKTtcclxufVxyXG4iLCJpbXBvcnQgeyBzaGFkZXIgfSBmcm9tIFwiLi4vc2hkL3NoYWRlclwiO1xyXG5pbXBvcnQgeyB0ZXh0dXJlIH0gZnJvbSBcIi4uL3RleHR1cmUvdGV4XCI7XHJcblxyXG5jbGFzcyBfbWF0ZXJpYWwge1xyXG4gIGNvbnN0cnVjdG9yKHNoZF9uYW1lLCB1Ym8sIGdsKSB7XHJcbiAgICB0aGlzLnNoYWRlciA9IHNoYWRlcihzaGRfbmFtZSwgZ2wpO1xyXG4gICAgdGhpcy51Ym8gPSB1Ym87XHJcbiAgICB0aGlzLnRleHR1cmVzID0gW107XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgfVxyXG5cclxuICB0ZXh0dXJlQXR0YWNoKHVybCwgdHlwZSA9IFwiMmRcIikge1xyXG4gICAgdGhpcy50ZXh0dXJlc1t0aGlzLnRleHR1cmVzLmxlbmd0aF0gPSB0ZXh0dXJlKHVybCwgdHlwZSwgdGhpcy5nbCk7XHJcbiAgfVxyXG5cclxuICBhcHBseSgpIHtcclxuICAgIGlmICh0aGlzLnNoYWRlci5pZCA9PSBudWxsKSByZXR1cm47XHJcbiAgICB0aGlzLnNoYWRlci5hcHBseSgpO1xyXG5cclxuICAgIGZvciAobGV0IHQgPSAwOyB0IDwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7IHQrKylcclxuICAgICAgaWYgKHRoaXMudGV4dHVyZXNbdF0gIT0gbnVsbClcclxuICAgICAgICB0aGlzLnRleHR1cmVzW3RdLmFwcGx5KHQsIHRoaXMuc2hhZGVyLCB0aGlzLnRleHR1cmVzW3RdKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtdGwoc2hkLCB1Ym8sIGdsKSB7XHJcbiAgcmV0dXJuIG5ldyBfbWF0ZXJpYWwoc2hkLCB1Ym8sIGdsKTtcclxufVxyXG4iLCJpbXBvcnQgeyByZW5kZXJDcmVhdGUgfSBmcm9tIFwiLi9yZW5kZXIvcmVuZGVyXCI7XHJcbmltcG9ydCB7IHZlYzMgfSBmcm9tIFwiLi9tdGgvdmVjM1wiO1xyXG5pbXBvcnQgeyBjYW1lcmEgfSBmcm9tIFwiLi9tdGgvY2FtZXJhXCI7XHJcbmltcG9ydCB7IG10bCB9IGZyb20gXCIuL21hdGVyaWFsL210bFwiO1xyXG5pbXBvcnQgeyBpbWFnZUNyZWF0ZSB9IGZyb20gXCIuL3RleHR1cmUvdGV4XCI7XHJcblxyXG5sZXQgcm5kMSwgcm5kMjtcclxuXHJcbi8vIE9wZW5HTCBpbml0aWFsaXphdGlvblxyXG5leHBvcnQgZnVuY3Rpb24gaW5pdEdMKCkge1xyXG4gIGxldCBjYW52YXMxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXMxXCIpO1xyXG4gIGxldCBjYW1lcmExID0gY2FtZXJhKGNhbnZhczEuY2xpZW50V2lkdGgsIGNhbnZhczEuY2xpZW50SGVpZ2h0KVxyXG4gICAgLmNhbVNldCh2ZWMzKDUsIDYsIDUpKVxyXG4gICAgLmNhbVNldFByb2ooMC4xLCAwLjEsIDMwMCk7XHJcblxyXG4gIGxldCBjYW52YXMyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXMyXCIpO1xyXG4gIGxldCBjYW1lcmEyID0gY2FtZXJhKGNhbnZhczIuY2xpZW50V2lkdGgsIGNhbnZhczIuY2xpZW50SGVpZ2h0KVxyXG4gICAgLmNhbVNldCgpXHJcbiAgICAuY2FtU2V0UHJvaigwLjEsIDAuMSwgMzAwKTtcclxuXHJcbiAgcm5kMSA9IHJlbmRlckNyZWF0ZShjYW52YXMxLCBcImVhcnRoXCIsIGNhbWVyYTEpO1xyXG4gIHJuZDIgPSByZW5kZXJDcmVhdGUoY2FudmFzMiwgXCJkZWZhdWx0XCIsIGNhbWVyYTIpO1xyXG5cclxuICBsZXQgbXRsMiA9IG10bChcImRlZmF1bHRcIiwgbnVsbCwgcm5kMi5nbCk7XHJcbiAgbGV0IG10bDEgPSBtdGwoXCJlYXJ0aFwiLCBudWxsLCBybmQxLmdsKTtcclxuXHJcbiAgbGV0IGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gIGltZy5zcmMgPSBcImVhcnRoMC5qcGdcIjtcclxuICBsZXQgbmFtZVVSTCA9IGltYWdlQ3JlYXRlKGltZywgXCJlYXJ0aFwiKTtcclxuXHJcbiAgbXRsMS50ZXh0dXJlQXR0YWNoKG5hbWVVUkwpO1xyXG5cclxuICBybmQyLnByaW1BdHRhY2goXCJjdWJlUHJpbVwiLCBcImN1YmVcIiwgbXRsMiwgdmVjMygwLCAwLCAwKSk7XHJcbiAgcm5kMS5wcmltQXR0YWNoKFwiRWFydGhcIiwgXCJlYXJ0aFwiLCBtdGwxLCB2ZWMzKDAsIDIsIDApLCAzKTtcclxuICAvL2ZvciAoY29uc3QgcCBvZiBybmQucHJpbXMpIHJuZC5wcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hkKTtcclxufSAvLyBFbmQgb2YgJ2luaXRHTCcgZnVuY3Rpb25cclxuXHJcbi8vIFJlbmRlciBmdW5jdGlvblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gIHJuZDEuZ2wuY2xlYXIocm5kMS5nbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuXHJcbiAgcm5kMS5yZW5kZXIoKTtcclxuXHJcbiAgcm5kMi5nbC5jbGVhcihybmQyLmdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICBybmQyLnJlbmRlcigpO1xyXG59XHJcblxyXG5jb25zb2xlLmxvZyhcImxpYnJhcnkuanMgd2FzIGltcG9ydGVkXCIpO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcclxuICBpbml0R0woKTtcclxuXHJcbiAgY29uc3QgZHJhdyA9ICgpID0+IHtcclxuICAgIHJlbmRlcigpO1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhdyk7XHJcbiAgfTtcclxuICBkcmF3KCk7XHJcbn0pO1xyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0VBQUEsTUFBTSxPQUFPLENBQUM7RUFDZCxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtFQUM5QixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0VBQ3JCLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztFQUNuQixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2pCLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxTQUFTLEVB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QUc7RUFDbEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUM7RUFDUCxNQUFNLENBQUM7RUFDUCxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQztFQUNQLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQztFQUNQLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDO0VBQ1AsTUFBTSxDQUFDO0VBQ1AsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsS0FBSyxDQUFDO0VBQ04sSUFBSSxDQUFDLEVBQUUsQ0FBQztFQUNSLEdBQUc7RUFDSCxFQUFFLElBQUksR0FBRyxHQUFHO0VBQ1osSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7RUFDN0UsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDekIsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLFFBQVEsR0FBRztFQUNiLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLEdBQUcsQ0FBQztBQUNKO0VBQ0EsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQ3pCOztFQzdETyxTQUFTLFdBQVcsR0FBRztFQUM5QixFQUFFLElBQUksUUFBUSxHQUFHLEVBQUU7RUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRztFQUNYLElBQUksQ0FBQyxHQUFHLEdBQUc7RUFDWCxJQUFJLENBQUM7RUFDTCxJQUFJLENBQUM7RUFDTCxJQUFJLEtBQUs7RUFDVCxJQUFJLEdBQUc7RUFDUCxJQUFJLENBQUMsR0FBRyxFQUFFO0VBQ1YsSUFBSSxHQUFHLEdBQUcsRUFBRTtFQUNaLElBQUksQ0FBQztFQUNMLElBQUksQ0FBQyxDQUFDO0VBQ04sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekI7RUFDQSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7RUFDNUQsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO0VBQ2hFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM3QyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQzdCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM3QyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdkMsS0FBSztFQUNMLEdBQUc7QUFDSDtFQUNBLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUM3QyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUN4RDtFQUNBLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDakMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0VBQ3RCLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDbkMsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDaEQsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FB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QUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3RELEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxHQUFHLEdBQUc7RUFDUixJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxPQUFPLEdBQUcsQ0FBQztFQUN6QyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMxQixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsU0FBUyxHQUFHO0VBQ2QsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdCO0VBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQztFQUMxQyxJQUFJLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdkMsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUU7RUFDZixJQUFJLE9BQU8sSUFBSSxLQUFLO0VBQ3BCLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xFLEtBQUssQ0FBQztFQUNOLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxXQUFXLENBQUMsQ0FBQyxFQUFFO0VBQ2pCLElBQUksSUFBSSxDQUFDO0VBQ1QsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9FO0VBQ0EsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQzlFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDOUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUM5RSxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtFQUNYLElBQUksT0FBTyxJQUFJLEtBQUs7RUFDcEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNqQyxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDakMsS0FBSyxDQUFDO0VBQ04sR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLGNBQWMsQ0FBQyxDQUFDLEVBQUU7RUFDcEIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUs7RUFDckIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxD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QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQjtFQUNBLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsWUFBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7RUFDdkIsSUFBSSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2xELEdBQUc7QUFDSDtFQUNBLEVBQUUsV0FBVyxHQUFHO0VBQ2hCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLElBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QjtFQUNBLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzNCO0VBQ0E7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFB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RyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDckMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUM7RUFDVCxPQUFPO0VBQ1AsTUFBTTtFQUNOLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDckMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDL0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUM7RUFDVCxPQUFPO0VBQ1AsTUFBTTtFQUNOLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDckMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMvQixRQUFRLENBQUM7RUFDVCxPQUFPO0VBQ1AsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixLQUFLLENBQUM7RUFDTixJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTtFQUN6QixJQUFJLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFO0VBQ3JDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFO0VBQ3hDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7RUFDeEMsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0VBQ3hCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztFQUNWLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNoQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2hDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3RELEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ2hDLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3RFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDekMsS0FBSyxDQUFDO0VBQ04sSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxhQUFhLEdBQUc7RUFDbEIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3hCO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3ZELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbkQsSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxXQUFXLENBQUMsYUFBYSxFQUFFO0VBQzdCLElBQUksSUFBSSxDQUFDLEdBQUcsYUFBYSxHQUFHLGtCQUFrQixHQUFHLEdBQUc7RUFDcEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFD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QUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakYsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqRixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pGLEtBQUssQ0FBQztBQUNOO0VBQ0EsSUFBSSxPQUFPLEVBQUUsQ0FBQztFQUNkLEdBQUc7RUFDSCxDQUFDO0FBQ0Q7RUFDQSxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNwRSxFQUFFO0VBQ0YsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDbkIsSUFBSTtFQUNKLENBQUM7QUFDRDtFQUNBLFNBQVMsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUN2QixFQUFFLElBQUksQ0FBQztFQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixNQUFNLGFBQWE7RUFDbkIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsT0FBTztFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixPQUFPO0VBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2QsTUFBTSxhQUFhO0VBQ25CLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLE9BQU87RUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDZCxNQUFNLGFBQWE7RUFDbkIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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QUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQ2xDLFFBQVEsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU07RUFDM0MsVUFBVSxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7RUFDaEQ7RUFDQSxVQUFVLEVBQUUsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztFQUNoRCxRQUFRLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQzNFLFFBQVEsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQzFFO0VBQ0EsUUFBUSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3JFLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3hDLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzFDLE9BQU87QUFDUDtFQUNBLE1B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U0FBUztFQUNULE1BQU0sSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7RUFDckIsS0FBSztFQUNMLElBQUksSUFBSSxFQUFFLElBQUksU0FBUyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0VBQ3RDLFNBQVM7RUFDVCxNQUFNLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ25CLEtBQUs7RUFDTCxJQUFJLElBQUksRUFBRSxJQUFJLFNBQVMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztFQUN0QyxTQUFTO0VBQ1QsTUFBTSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztFQUNuQixLQUFLO0FBQ0w7RUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakQ7RUFDQSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSTtFQUNyQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixLQUFLLENBQUM7RUFDTixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSTtFQUNsQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixL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
