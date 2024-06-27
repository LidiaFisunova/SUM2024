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
      this.gl.vertexAttribPointer(Loc, size / 4, this.gl.FLOAT, false, size, offset);
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
      2, 11, 5, 8, -1,
      6, 3, 15, 18, -1,
      19, 22, 4, 1, -1,
      0, 9, 21, 12, -1,
      14, 17, 23, 20, -1,
      23, 14, 17, -1,
      16, 13, 7, 10,
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

  function earthCreate(name) {
    let vertexes = [],
      w = name == "Earth" ? 30 : 200,
      h = name == "Earth" ? 18 : 100,
      i,
      j,
      theta,
      phi,
      G = [],
      ind = [],
      x,
      y,
      R;
    let pi = Math.acos(-1),
      z;

    R = name == "Earth" ? 1 : 1.1;

    for (i = 0, theta = 0; i < h; i++, theta += pi / (h - 1)) {
      for (j = 0, phi = 0; j < w; j++, phi += (2 * pi) / (w - 1)) {
        //G[0] = Math.sin(theta) * Math.sin(phi);
        //G[1] = Math.cos(theta);
        //G[2] = Math.sin(theta) * Math.cos(phi);
        G[0] = j / (w - 1);
        G[1] = i / (h - 1);
        if (name == "Earth") z = 0;
        else {
          z = 0; // 50 + 30 * Math.sin((i * w + j) / 2.0); // getGeoData((Math.sin(theta) * Math.sin(phi)) * 180 / pi - Math.acos(-1) * 180 / pi, Math.cos(theta) * 180 / pi);
        }
        G[2] = R;
        G[3] = z;
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

    ind = [];
    for (let i = 0, k = 0; i < h - 1; i++)
    {
      for (let j = 0; j < w; j++)
      {
        ind.push((i + 1) * w + j);
        ind.push(i * w + j);
      }
      if (i != h - 2)
        ind.push(-1);
    }



    return [vertexes, ind, w, h];
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
        let response = await fetch(`bin/shaders/${name}/${s.name}.glsl?${Math.random()}`);
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
      if (this.type == "earth" || this.type == "clouds") {
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
      gl.bindVertexArray(this.VA);
      if (this.shdIsLoaded == null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
        if (this.mtl.shader.attrs["InNormal"] != undefined) {
          this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 12, 0);
          this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
        }
        else this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 16, 0);
        // this.mtl.shader.updateShaderData();
      }
      this.updatePrimData(timer);

      if (this.noofI != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
        gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
      } else {
        gl.drawArrays(gl.LINE_STRIP, 0, this.noofV);
      }
    }
  }

  function primCreate(name, type, mtl, pos, side = 3, gl) {
    let vi;
    if (type == "cube") vi = cubeCreate();
    if (type == "earth") vi = earthCreate(name);
    let vert = vi[0],
      ind = vi[1],
      w = vi[2],
      h = vi[3];

    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let vertexBuffer = vertex_buffer(vert, gl),
      indexBuffer,
      indlen;

    if (ind != null) (indexBuffer = index_buffer(ind, gl)), (indlen = ind.length);
    else (indexBuffer = null), (indlen = null);

    let pr = new _prim(
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
    pr.w = w;
    pr.h = h;
    return pr;
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
      //this.prg = this.gl.createProgram();
      this.timer = timer();
      this.prims = [];
      this.input = input_init(this);
      this.cam = camera;
    
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    primAttach(name, type, mtl, pos, side = 3) {
      let p = primCreate(name, type, mtl, pos, side, this.gl);
      this.prims[this.prims.length] = p;
      return p;
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
      this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
      this.timer.response();
      this.input.responseCamera(this);
      this.input.reset();
      for (const p of this.prims) {
        if (p.mtl.shader.id != null &&
            p.mtl.shader.shaders[0].id != null &&
            p.mtl.shader.shaders[1].id != null &&
            p.shdIsLoaded == null) {
          p.mtl.apply();
          this.programUniforms(p.mtl.shader);
          this.transformProgramUniforms(p.mtl.shader);

          if (p.mtl.shader.uniforms["IsEarth"] == undefined) return;
          let k = 0;
          if (p.name == "Earth") k = 1;
          let mWLoc = p.mtl.shader.uniforms["IsEarth"].loc;
          this.gl.uniform1f(mWLoc, k);

          //if (p.name == "Clouds") setInterval(() => {}, 10000);
          p.render(this.timer);
          p.shdIsLoaded = 1;
          return;
        }
        if (p.shdIsLoaded == null) return;
        p.mtl.apply();
        this.programUniforms(p.mtl.shader);

        if (p.mtl.shader.uniforms["IsEarth"] == undefined) return;
        let k = 0;
        if (p.name == "Earth") k = 1;
        let mWLoc = p.mtl.shader.uniforms["IsEarth"].loc;
        this.gl.uniform1f(mWLoc, k);

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

  let rnd1;

  // OpenGL initialization
  function initGL() {
    let canvas1 = document.getElementById("canvas1");
    let camera1 = camera(canvas1.clientWidth, canvas1.clientHeight)
      .camSet(vec3(5, 6, 5))
      .camSetProj(0.1, 0.1, 300);

    rnd1 = renderCreate(canvas1, "earth", camera1);
    return rnd1;
    //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
  } // End of 'initGL' function

  // Render function
  function render() {
    rnd1.render();
  }

  console.log("library.js was imported");

  window.addEventListener("load", () => {

    initGL();

    let mtl1 = mtl("earth", null, rnd1.gl);
    let mtl2 = mtl("earth", null, rnd1.gl);
    mtl("default", null, rnd1.gl);

    let img = new Image();
    img.src = "earth.jpeg";
    let nameURL = imageCreate(img, "earth");
    mtl1.textureAttach(nameURL);

    //let img1 = new Image();
    //img1.src = "clouds1.png";
    //let nameURL1 = imageCreate(img1, "clouds");
    //mtl2.textureAttach(nameURL1);

    //rnd1.primAttach("Cube", "cube", mtl3, vec3(1, 0, 0), 2);
    rnd1.primAttach("Earth", "earth", mtl1, vec3(0, 2, 0), 2);
    let cloud = rnd1.primAttach("Clouds", "earth", mtl2, vec3(0, 2, 0), 5);

    let x = 0, y = 0;

    setInterval(() => {
      if (cloud.VBuf.id) {
        console.log(`lb${x}:${y}`);
        storeGeoData(cloud, x, y);
        x++;
        if (x >= cloud.w) {
          x = 0;
          y++;
          if (y >= cloud.h)
            y = 0;
        }
      }
    }, 10);

    const draw = () => {
      /*
      rnd1.gl.bindBuffer(rnd1.gl.ARRAY_BUFFER, cloud.VBuf.id);
      for (let x = 0; x < cloud.w; x++) {
        for (let y = 0; y < cloud.h; y++) {
          let x1 = 1, y1 = 1,  offset = (y * cloud.w + x) * 16;
          rnd1.gl.bufferSubData(rnd1.gl.ARRAY_BUFFER, offset + 12, new Float32Array([10]));
        }
      }
      r += 1.8;
      if (r > 100)
        r = 0;
      */
      render();

      window.requestAnimationFrame(draw);
    };
    draw();
  });

  async function getGeoData(lat, lon) {
    const req = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=fa794a0fcea5e8cd7b7e33a0d5d76fa4`;
    let request = await fetch(req);
    let data = await request.json();
    return data.clouds.all;
  }

  async function storeGeoData(cloud, x, y) {
    let lat = y * 180 / (cloud.h - 1) - 90, lon = x * 360 / (cloud.w - 1) - 180;
    const req = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=fa794a0fcea5e8cd7b7e33a0d5d76fa4`;

    let request = await fetch(req);
    let data = await request.json();
    let r = data.clouds.all;

    console.log(`lb${lat}:${lon}->${r}`);

    rnd1.gl.bindBuffer(rnd1.gl.ARRAY_BUFFER, cloud.VBuf.id);
    let offset = (y * cloud.w + x) * 16;
    rnd1.gl.bufferSubData(rnd1.gl.ARRAY_BUFFER, offset + 12, new Float32Array([r]));
  }

  exports.getGeoData = getGeoData;
  exports.initGL = initGL;
  exports.render = render;
  exports.storeGeoData = storeGeoData;

  return exports;

})({});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vVUJPL3Viby5qcyIsIi4uL3ByaW1zL2N1YmUuanMiLCIuLi9wcmltcy9lYXJ0aC5qcyIsIi4uL3NoZC9zaGFkZXIuanMiLCIuLi9tdGgvdmVjMy5qcyIsIi4uL210aC9tYXQ0LmpzIiwiLi4vcHJpbXMvcHJpbS5qcyIsIi4uL3RpbWUvdGltZXIuanMiLCIuLi9tdGgvaW5wdXQuanMiLCIuLi9yZW5kZXIvcmVuZGVyLmpzIiwiLi4vbXRoL2NhbWVyYS5qcyIsIi4uL3RleHR1cmUvdGV4LmpzIiwiLi4vbWF0ZXJpYWwvbXRsLmpzIiwiLi4vbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih0eXBlLCBzaXplLCBnbCkge1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLy8gQnVmZmVyIHR5cGUgKGdsLioqKl9CVUZGRVIpXHJcbiAgICB0aGlzLnNpemUgPSBzaXplOyAvLyBCdWZmZXIgc2l6ZSBpbiBieXRlc1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICBpZiAoc2l6ZSA9PSAwIHx8IHR5cGUgPT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKHR5cGUsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YSh0eXBlLCBzaXplLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgfVxyXG4gIHVwZGF0ZShkYXRhKSB7fVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBidWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ2J1ZmZlcicgZnVuY3Rpb25cclxuXHJcbmNsYXNzIF91Ym9fYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IobmFtZSwgc2l6ZSwgYmluZFBvaW50KSB7XHJcbiAgICBzdXBlcih0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCBzaXplKTtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmJpbmRQb2ludCA9IGJpbmRQb2ludDsgLy8gQnVmZmVyIEdQVSBiaW5kaW5nIHBvaW50XHJcbiAgfVxyXG4gIGFwcGx5KHNoZCkge1xyXG4gICAgaWYgKFxyXG4gICAgICBzaGQgPT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgIHNoZC5pZCA9PSB1bmRlZmluZWQgfHxcclxuICAgICAgc2hkLnVuaWZvcm1CbG9ja3NbdGhpcy5uYW1lXSA9PSB1bmRlZmluZWRcclxuICAgIClcclxuICAgICAgcmV0dXJuO1xyXG4gICAgZ2wudW5pZm9ybUJsb2NrQmluZGluZyhcclxuICAgICAgc2hkLmlkLFxyXG4gICAgICBzaGQudW5pZm9ybUJsb2Nrc1t0aGlzLm5hbWVdLmluZGV4LFxyXG4gICAgICB0aGlzLmJpbmRQb2ludFxyXG4gICAgKTtcclxuICAgIGdsLmJpbmRCdWZmZXJCYXNlKHRoaXMuZ2wuVU5JRk9STV9CVUZGRVIsIHRoaXMuYmluZFBvaW50LCB0aGlzLmlkKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHVib19idWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3Vib19idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG5cclxuY2xhc3MgX3ZlcnRleF9idWZmZXIgZXh0ZW5kcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih2QXJyYXksIGdsKSB7XHJcbiAgICBjb25zdCBuID0gdkFycmF5Lmxlbmd0aDtcclxuICAgIHN1cGVyKGdsLkFSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgdGhpcy5nbC5BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkodkFycmF5KSxcclxuICAgICAgdGhpcy5nbC5TVEFUSUNfRFJBV1xyXG4gICAgKTtcclxuICB9XHJcbiAgYXBwbHkoTG9jLCBzaXplLCBvZmZzZXQpIHtcclxuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihMb2MsIHNpemUgLyA0LCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgc2l6ZSwgb2Zmc2V0KTtcclxuICAgIHRoaXMuZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoTG9jKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHZlcnRleF9idWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3ZlcnRleF9idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd2ZXJ0ZXhfYnVmZmVyJyBmdW5jdGlvblxyXG5cclxuY2xhc3MgX2luZGV4X2J1ZmZlciBleHRlbmRzIF9idWZmZXIge1xyXG4gIGNvbnN0cnVjdG9yKGlBcnJheSwgZ2wpIHtcclxuICAgIGNvbnN0IG4gPSBpQXJyYXkubGVuZ3RoO1xyXG4gICAgc3VwZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG4gKiA0LCBnbCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmlkKTtcclxuICAgIGdsLmJ1ZmZlckRhdGEoXHJcbiAgICAgIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLFxyXG4gICAgICBuZXcgVWludDMyQXJyYXkoaUFycmF5KSxcclxuICAgICAgdGhpcy5nbC5TVEFUSUNfRFJBV1xyXG4gICAgKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4X2J1ZmZlciguLi5hcmdzKSB7XHJcbiAgcmV0dXJuIG5ldyBfaW5kZXhfYnVmZmVyKC4uLmFyZ3MpO1xyXG59IC8vIEVuZCBvZiAndWJvX2J1ZmZlcicgZnVuY3Rpb25cclxuIiwiZXhwb3J0IGZ1bmN0aW9uIGN1YmVDcmVhdGUoKSB7XHJcbiAgLyogbGV0IHN4ID0gMCArIHNpZGUsXHJcbiAgICBzeSA9IHBvcy55ICsgc2lkZSxcclxuICAgIHN6ID0gcG9zLnogLSBzaWRlOyAqL1xyXG4gIGxldCBwID0gW1xyXG4gICAgWy0wLjUsIC0wLjUsIDAuNV0sXHJcbiAgICBbMC41LCAtMC41LCAwLjVdLFxyXG4gICAgWzAuNSwgMC41LCAwLjVdLFxyXG4gICAgWy0wLjUsIDAuNSwgMC41XSxcclxuICAgIFstMC41LCAwLjUsIC0wLjVdLFxyXG4gICAgWzAuNSwgMC41LCAtMC41XSxcclxuICAgIFswLjUsIC0wLjUsIC0wLjVdLFxyXG4gICAgWy0wLjUsIC0wLjUsIC0wLjVdLFxyXG4gIF07XHJcblxyXG4gIGxldCBuID0gW1xyXG4gICAgWy0xLCAtMSwgMV0sXHJcbiAgICBbMSwgLTEsIDFdLFxyXG4gICAgWzEsIDEsIDFdLFxyXG4gICAgWy0xLCAxLCAxXSxcclxuICAgIFstMSwgMSwgLTFdLFxyXG4gICAgWzEsIDEsIC0xXSxcclxuICAgIFsxLCAtMSwgLTFdLFxyXG4gICAgWy0xLCAtMSwgLTFdLFxyXG4gIF07XHJcbiAgbGV0IHZlcnRleGVzID0gW10sXHJcbiAgICBqID0gMDtcclxuICB3aGlsZSAoaiA8IDgpIHtcclxuICAgIHZlcnRleGVzW2pdID0gW1xyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICBuW2pdWzBdLFxyXG4gICAgICAwLFxyXG4gICAgICAwLFxyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICAwLFxyXG4gICAgICBuW2pdWzFdLFxyXG4gICAgICAwLFxyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICAwLFxyXG4gICAgICAwLFxyXG4gICAgICBuW2pdWzJdLFxyXG4gICAgXTtcclxuICAgIGorKztcclxuICB9XHJcbiAgbGV0IGluZCA9IFtcclxuICAgIDIsIDExLCA1LCA4LCAtMSxcclxuICAgIDYsIDMsIDE1LCAxOCwgLTEsXHJcbiAgICAxOSwgMjIsIDQsIDEsIC0xLFxyXG4gICAgMCwgOSwgMjEsIDEyLCAtMSxcclxuICAgIDE0LCAxNywgMjMsIDIwLCAtMSxcclxuICAgIDIzLCAxNCwgMTcsIC0xLFxyXG4gICAgMTYsIDEzLCA3LCAxMCxcclxuICBdO1xyXG5cclxuICB2ZXJ0ZXhlcyA9IFtcclxuICAgIC4uLnZlcnRleGVzWzBdLFxyXG4gICAgLi4udmVydGV4ZXNbMV0sXHJcbiAgICAuLi52ZXJ0ZXhlc1syXSxcclxuICAgIC4uLnZlcnRleGVzWzNdLFxyXG4gICAgLi4udmVydGV4ZXNbNF0sXHJcbiAgICAuLi52ZXJ0ZXhlc1s1XSxcclxuICAgIC4uLnZlcnRleGVzWzZdLFxyXG4gICAgLi4udmVydGV4ZXNbN10sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIFt2ZXJ0ZXhlcywgaW5kXTtcclxufSIsImltcG9ydCB7IGdldEdlb0RhdGEgfSBmcm9tIFwiLi4vbWFpblwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVhcnRoQ3JlYXRlKG5hbWUpIHtcclxuICBsZXQgdmVydGV4ZXMgPSBbXSxcclxuICAgIHcgPSBuYW1lID09IFwiRWFydGhcIiA/IDMwIDogMjAwLFxyXG4gICAgaCA9IG5hbWUgPT0gXCJFYXJ0aFwiID8gMTggOiAxMDAsXHJcbiAgICBpLFxyXG4gICAgaixcclxuICAgIHRoZXRhLFxyXG4gICAgcGhpLFxyXG4gICAgRyA9IFtdLFxyXG4gICAgaW5kID0gW10sXHJcbiAgICB4LFxyXG4gICAgeSxcclxuICAgIFI7XHJcbiAgbGV0IHBpID0gTWF0aC5hY29zKC0xKSxcclxuICAgIHo7XHJcblxyXG4gIFIgPSBuYW1lID09IFwiRWFydGhcIiA/IDEgOiAxLjE7XHJcblxyXG4gIGZvciAoaSA9IDAsIHRoZXRhID0gMDsgaSA8IGg7IGkrKywgdGhldGEgKz0gcGkgLyAoaCAtIDEpKSB7XHJcbiAgICBmb3IgKGogPSAwLCBwaGkgPSAwOyBqIDwgdzsgaisrLCBwaGkgKz0gKDIgKiBwaSkgLyAodyAtIDEpKSB7XHJcbiAgICAgIC8vR1swXSA9IE1hdGguc2luKHRoZXRhKSAqIE1hdGguc2luKHBoaSk7XHJcbiAgICAgIC8vR1sxXSA9IE1hdGguY29zKHRoZXRhKTtcclxuICAgICAgLy9HWzJdID0gTWF0aC5zaW4odGhldGEpICogTWF0aC5jb3MocGhpKTtcclxuICAgICAgR1swXSA9IGogLyAodyAtIDEpO1xyXG4gICAgICBHWzFdID0gaSAvIChoIC0gMSk7XHJcbiAgICAgIGlmIChuYW1lID09IFwiRWFydGhcIikgeiA9IDA7XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHogPSAwOyAvLyA1MCArIDMwICogTWF0aC5zaW4oKGkgKiB3ICsgaikgLyAyLjApOyAvLyBnZXRHZW9EYXRhKChNYXRoLnNpbih0aGV0YSkgKiBNYXRoLnNpbihwaGkpKSAqIDE4MCAvIHBpIC0gTWF0aC5hY29zKC0xKSAqIDE4MCAvIHBpLCBNYXRoLmNvcyh0aGV0YSkgKiAxODAgLyBwaSk7XHJcbiAgICAgIH1cclxuICAgICAgR1syXSA9IFI7XHJcbiAgICAgIEdbM10gPSB6O1xyXG4gICAgICB2ZXJ0ZXhlcyA9IHZlcnRleGVzLmNvbmNhdCguLi5HKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvciAoaSA9IDAsIHkgPSAwOyB5IDwgaCAtIDE7IGkgKz0gNCwgeSsrKSB7XHJcbiAgICBmb3IgKGogPSAwLCB4ID0gMDsgaiA8ICgyICsgdyAqIDIpICogMiAtIDQ7IGogKz0gNCkge1xyXG4gICAgICAvL2ogLSBjb3VudCBvZiBpbmQgaW4gb25lIHJvdywgeCAtIGRlZmluaW5nIGEgc2VxdWVuY2Ugb2YgaW5kXHJcbiAgICAgIGluZFtpICogaCArIGpdID0geSAqIGggKyB4O1xyXG4gICAgICBpZiAoeCA9PSB3IC0gMSkge1xyXG4gICAgICAgIGluZFtpICogaCArIGogKyAxXSA9IHkgKiBoO1xyXG4gICAgICB9IGVsc2UgaW5kW2kgKiBoICsgaiArIDFdID0geSAqIGggKyB4ICsgMTtcclxuICAgICAgaW5kW2kgKiBoICsgaiArIDJdID0gKHkgKyAxKSAqIGggKyB4O1xyXG4gICAgICBpZiAoeCA9PSB3IC0gMSkgaW5kW2kgKiBoICsgaiArIDNdID0gKHkgKyAxKSAqIGg7XHJcbiAgICAgIGVsc2UgaW5kW2kgKiBoICsgaiArIDNdID0gKHkgKyAxKSAqIGggKyB4ICsgMTtcclxuXHJcbiAgICAgIHgrKztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGluZCA9IFtdO1xyXG4gIGZvciAobGV0IGkgPSAwLCBrID0gMDsgaSA8IGggLSAxOyBpKyspXHJcbiAge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB3OyBqKyspXHJcbiAgICB7XHJcbiAgICAgIGluZC5wdXNoKChpICsgMSkgKiB3ICsgaik7XHJcbiAgICAgIGluZC5wdXNoKGkgKiB3ICsgaik7XHJcbiAgICB9XHJcbiAgICBpZiAoaSAhPSBoIC0gMilcclxuICAgICAgaW5kLnB1c2goLTEpO1xyXG4gIH1cclxuXHJcblxyXG5cclxuICByZXR1cm4gW3ZlcnRleGVzLCBpbmQsIHcsIGhdO1xyXG59XHJcbiIsImNsYXNzIF9zaGFkZXIge1xyXG4gIGFzeW5jIF9pbml0KG5hbWUsIGdsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICB0aGlzLnNoYWRlcnMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogbnVsbCxcclxuICAgICAgICB0eXBlOiB0aGlzLmdsLlZFUlRFWF9TSEFERVIsXHJcbiAgICAgICAgbmFtZTogXCJ2ZXJ0XCIsXHJcbiAgICAgICAgc3JjOiBcIlwiLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgdHlwZTogdGhpcy5nbC5GUkFHTUVOVF9TSEFERVIsXHJcbiAgICAgICAgbmFtZTogXCJmcmFnXCIsXHJcbiAgICAgICAgc3JjOiBcIlwiLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNoYWRlcnMpIHtcclxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYGJpbi9zaGFkZXJzLyR7bmFtZX0vJHtzLm5hbWV9Lmdsc2w/JHtNYXRoLnJhbmRvbSgpfWApO1xyXG4gICAgICBsZXQgc3JjID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICBpZiAodHlwZW9mIHNyYyA9PSBcInN0cmluZ1wiICYmIHNyYyAhPSBcIlwiKSBzLnNyYyA9IHNyYztcclxuICAgIH1cclxuICAgIC8vIHJlY29tcGlsZSBzaGFkZXJzXHJcbiAgICB0aGlzLnVwZGF0ZVNoYWRlcnNTb3VyY2UoKTtcclxuICB9XHJcbiAgdXBkYXRlU2hhZGVyc1NvdXJjZSgpIHtcclxuICAgIHRoaXMuc2hhZGVyc1swXS5pZCA9IG51bGw7XHJcbiAgICB0aGlzLnNoYWRlcnNbMV0uaWQgPSBudWxsO1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICBpZiAodGhpcy5zaGFkZXJzWzBdLnNyYyA9PSBcIlwiIHx8IHRoaXMuc2hhZGVyc1sxXS5zcmMgPT0gXCJcIikgcmV0dXJuO1xyXG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc2hhZGVycykge1xyXG4gICAgICBzLmlkID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIocy50eXBlKTtcclxuICAgICAgdGhpcy5nbC5zaGFkZXJTb3VyY2Uocy5pZCwgcy5zcmMpO1xyXG4gICAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIocy5pZCk7XHJcbiAgICAgIGlmICghdGhpcy5nbC5nZXRTaGFkZXJQYXJhbWV0ZXIocy5pZCwgdGhpcy5nbC5DT01QSUxFX1NUQVRVUykpIHtcclxuICAgICAgICBsZXQgYnVmID0gdGhpcy5nbC5nZXRTaGFkZXJJbmZvTG9nKHMuaWQpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBTaGFkZXIgJHt0aGlzLm5hbWV9LyR7cy5uYW1lfSBjb21waWxlIGZhaWw6ICR7YnVmfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmlkID0gdGhpcy5nbC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMuc2hhZGVycykge1xyXG4gICAgICBpZiAocy5pZCAhPSBudWxsKSB0aGlzLmdsLmF0dGFjaFNoYWRlcih0aGlzLmlkLCBzLmlkKTtcclxuICAgIH1cclxuICAgIGxldCBwcmcgPSB0aGlzLmlkO1xyXG4gICAgdGhpcy5nbC5saW5rUHJvZ3JhbShwcmcpO1xyXG4gICAgaWYgKCF0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJnLCB0aGlzLmdsLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICBsZXQgYnVmID0gdGhpcy5nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcmcpO1xyXG4gICAgICBjb25zb2xlLmxvZyhgU2hhZGVyIHByb2dyYW0gJHt0aGlzLm5hbWV9IGxpbmsgZmFpbDogJHtidWZ9YCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnVwZGF0ZVNoYWRlckRhdGEoKTtcclxuICB9XHJcbiAgdXBkYXRlU2hhZGVyRGF0YSgpIHtcclxuICAgIC8vIFNoYWRlciBhdHRyaWJ1dGVzXHJcbiAgICB0aGlzLmF0dHJzID0ge307XHJcbiAgICBjb25zdCBjb3VudEF0dHJzID0gdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKFxyXG4gICAgICB0aGlzLmlkLFxyXG4gICAgICB0aGlzLmdsLkFDVElWRV9BVFRSSUJVVEVTXHJcbiAgICApO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudEF0dHJzOyBpKyspIHtcclxuICAgICAgY29uc3QgaW5mbyA9IHRoaXMuZ2wuZ2V0QWN0aXZlQXR0cmliKHRoaXMuaWQsIGkpO1xyXG4gICAgICB0aGlzLmF0dHJzW2luZm8ubmFtZV0gPSB7XHJcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxyXG4gICAgICAgIHR5cGU6IGluZm8udHlwZSxcclxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXHJcbiAgICAgICAgbG9jOiB0aGlzLmdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMuaWQsIGluZm8ubmFtZSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2hhZGVyIHVuaWZvcm1zXHJcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XHJcbiAgICBjb25zdCBjb3VudFVuaWZvcm1zID0gdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKFxyXG4gICAgICB0aGlzLmlkLFxyXG4gICAgICB0aGlzLmdsLkFDVElWRV9VTklGT1JNU1xyXG4gICAgKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnRVbmlmb3JtczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm0odGhpcy5pZCwgaSk7XHJcbiAgICAgIHRoaXMudW5pZm9ybXNbaW5mby5uYW1lXSA9IHtcclxuICAgICAgICBuYW1lOiBpbmZvLm5hbWUsXHJcbiAgICAgICAgdHlwZTogaW5mby50eXBlLFxyXG4gICAgICAgIHNpemU6IGluZm8uc2l6ZSxcclxuICAgICAgICBsb2M6IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuaWQsIGluZm8ubmFtZSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2hhZGVyIHVuaWZvcm0gYmxvY2tzXHJcbiAgICB0aGlzLnVuaWZvcm1CbG9ja3MgPSB7fTtcclxuICAgIGNvbnN0IGNvdW50VW5pZm9ybUJsb2NrcyA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihcclxuICAgICAgdGhpcy5pZCxcclxuICAgICAgdGhpcy5nbC5BQ1RJVkVfVU5JRk9STV9CTE9DS1NcclxuICAgICk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50VW5pZm9ybUJsb2NrczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGJsb2NrX25hbWUgPSB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja05hbWUodGhpcy5pZCwgaSk7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtQmxvY2tJbmRleCh0aGlzLmlkLCBibG9ja19uYW1lKTtcclxuICAgICAgdGhpcy51bmlmb3JtQmxvY2tzW2Jsb2NrX25hbWVdID0ge1xyXG4gICAgICAgIG5hbWU6IGJsb2NrX25hbWUsXHJcbiAgICAgICAgaW5kZXg6IGluZGV4LFxyXG4gICAgICAgIHNpemU6IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrUGFyYW1ldGVyKFxyXG4gICAgICAgICAgdGhpcy5pZCxcclxuICAgICAgICAgIGlkeCxcclxuICAgICAgICAgIHRoaXMuZ2wuVU5JRk9STV9CTE9DS19EQVRBX1NJWkVcclxuICAgICAgICApLFxyXG4gICAgICAgIGJpbmQ6IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrUGFyYW1ldGVyKFxyXG4gICAgICAgICAgdGhpcy5pZCxcclxuICAgICAgICAgIGlkeCxcclxuICAgICAgICAgIHRoaXMuZ2wuVU5JRk9STV9CTE9DS19CSU5ESU5HXHJcbiAgICAgICAgKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcbiAgY29uc3RydWN0b3IobmFtZSwgZ2wpIHtcclxuICAgIHRoaXMuX2luaXQobmFtZSwgZ2wpO1xyXG4gIH1cclxuICBhcHBseSgpIHtcclxuICAgIGlmICh0aGlzLmlkICE9IG51bGwpIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLmlkKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHNoYWRlcihuYW1lLCBnbCkge1xyXG4gIHJldHVybiBuZXcgX3NoYWRlcihuYW1lLCBnbCk7XHJcbn1cclxuLypcclxubGV0IHNyYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hkVmVydFNyY1wiKS52YWx1ZTtcclxuc2hkLnNoYWRlcnNbMF0uc3JjID0gc3JjO1xyXG5zaGQudXBkYXRlU2hhZGVyc1NvdXJjZSgpO1xyXG4qL1xyXG4iLCJjbGFzcyBfdmVjMyB7XHJcbiAgY29uc3RydWN0b3IoeCwgeSwgeikge1xyXG4gICAgaWYgKHR5cGVvZih4KSAhPSBcIm51bWJlclwiKSB7XHJcbiAgICAgIGlmICh4ID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAodGhpcy54ID0geC54KSwgKHRoaXMueSA9IHgueSksICh0aGlzLnogPSB4LnopO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoeSAhPSB1bmRlZmluZWQgJiYgeiAhPSB1bmRlZmluZWQpXHJcbiAgICAgICh0aGlzLnggPSB4KSwgKHRoaXMueSA9IHkpLCAodGhpcy56ID0geik7XHJcbiAgICBlbHNlICh0aGlzLnggPSB4KSwgKHRoaXMueSA9IHgpLCAodGhpcy56ID0geCk7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgYWRkIGFub3RoZXJcclxuICBhZGQodikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyh0aGlzLnggKyB2LngsIHRoaXMueSArIHYueSwgdGhpcy56ICsgdi56KTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBzdWJzdHJhY3QgYW5vdGhlclxyXG4gIHN1Yih2KSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55LCB0aGlzLnogLSB2LnopO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIG11bHRpcGxpY2F0ZWQgYnkgbnVtYmVyXHJcbiAgbXVsTnVtKG4pIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54ICogbiwgdGhpcy55ICogbiwgdGhpcy56ICogbik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgZGV2aWRlZCBieSBudW1iZXJcclxuICBkaXZOdW0obikge1xyXG4gICAgaWYgKG4gPT0gMCkgcmV0dXJuO1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyh0aGlzLnggLyBuLCB0aGlzLnkgLyBuLCB0aGlzLnogLyBuKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBOZWdhdGl2ZVxyXG4gIG5lZygpIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzMoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XHJcbiAgfVxyXG5cclxuICAvL1R3byB2ZWN0b3JzMyBkb3QgcHJvZHVjdFxyXG4gIGRvdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIExlbmdodCBldmFsdWF0aW9uXHJcbiAgbGVuKCkge1xyXG4gICAgbGV0IGxlbiA9IHRoaXMuZG90KHRoaXMpO1xyXG4gICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSAxKSByZXR1cm4gbGVuO1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChsZW4pO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIE5vcm1hbGl6ZVxyXG4gIG5vcm1hbGl6ZSgpIHtcclxuICAgIGxldCBsZW4gPSB0aGlzLmRvdCh0aGlzKTtcclxuXHJcbiAgICBpZiAobGVuID09IDEgfHwgbGVuID09IDApIHJldHVybiB0aGlzO1xyXG4gICAgcmV0dXJuIHRoaXMuZGl2TnVtKE1hdGguc3FydChsZW4pKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyB0cmFuc2ZvbWF0aW9uXHJcbiAgdHJhbnNmb3JtKG0pIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzMoXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIHRoaXMueiAqIG0uYVsyXVswXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgdGhpcy56ICogbS5hWzJdWzFdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyB0aGlzLnogKiBtLmFbMl1bMl1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgYnkgbWF0cml4IG11bHRpcGxpY2F0aW9uICh3aXRoIGhvbW9nZW5pb3VzIGRldmlkZSlcclxuICB2ZWMzTXVsTWF0cihtKSB7XHJcbiAgICBsZXQgdyA9XHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVszXSArIHRoaXMueSAqIG0uYVsxXVszXSArIHRoaXMueiAqIG0uYVsyXVszXSArIG0uYVszXVszXTtcclxuXHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKFxyXG4gICAgICAoVi5YICogbS5hWzBdWzBdICsgdGhpcy55ICogbS5hWzFdWzBdICsgVi5aICogbS5hWzJdWzBdICsgbS5hWzNdWzBdKSAvIHcsXHJcbiAgICAgIChWLlggKiBtLmFbMF1bMV0gKyB0aGlzLnkgKiBtLmFbMV1bMV0gKyBWLlogKiBtLmFbMl1bMV0gKyBtLmFbM11bMV0pIC8gdyxcclxuICAgICAgKFYuWCAqIG0uYVswXVsyXSArIHRoaXMueSAqIG0uYVsxXVsyXSArIFYuWiAqIG0uYVsyXVsyXSArIG0uYVszXVsyXSkgLyB3XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy9Dcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzXHJcbiAgY3Jvc3Modikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyhcclxuICAgICAgdGhpcy55ICogdi56IC0gdGhpcy56ICogdi55LFxyXG4gICAgICB0aGlzLnogKiB2LnggLSB0aGlzLnggKiB2LnosXHJcbiAgICAgIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vUG9pbnQgYnkgbWF0cml4IHRyYW5zZm9ybWF0aW9uXHJcbiAgcG9pbnRUcmFuc2Zvcm0obSkge1xyXG4gICAgbGV0IHYgPSBuZXcgX3ZlYzMoXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIHYueiAqIG0uYVsyXVswXSArIG0uYVszXVswXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgdi56ICogbS5hWzJdWzFdICsgbS5hWzNdWzFdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyB2LnogKiBtLmFbMl1bMl0gKyBtLmFbM11bMl1cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmVjMyh4LCB5LCB6KSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVjMyh4LCB5LCB6KTtcclxufVxyXG4iLCJpbXBvcnQge3ZlYzN9IGZyb20gXCIuL3ZlYzMuanNcIlxyXG5cclxuY2xhc3MgX21hdDQge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgdG9BcnJheSgpIHtcclxuICAgIGxldCB0ID0gdGhpcy5hO1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdCh0WzBdKS5jb25jYXQodFsxXSkuY29uY2F0KHRbMl0pLmNvbmNhdCh0WzNdKTtcclxuICB9XHJcblxyXG4gIC8vVHJhbnNsYXRlIG1hdHJpeFxyXG4gIG1hdHJUcmFuc2xhdGUodikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgWzEsIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAxLCAwXSxcclxuICAgICAgW3YueCwgdi55LCB2LnosIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9NdWx0aXBseWluZyB0d28gbWF0cml4ZXNcclxuICBtYXRyTXVsTWF0cjIobSkge1xyXG4gICAgbGV0IHIgPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzBdWzFdID1cclxuICAgICAgdGhpcy5hWzBdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVswXVsyXSA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgci5hWzFdWzBdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzBdO1xyXG5cclxuICAgIHIuYVsxXVsxXSA9XHJcbiAgICAgIHRoaXMuYVsxXVswXSAqIG0uYVswXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsxXSAqIG0uYVsxXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsyXSAqIG0uYVsyXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVszXSAqIG0uYVszXVsxXTtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICB0aGlzLmFbMV1bMF0gKiBtLmFbMF1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMV0gKiBtLmFbMV1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMl0gKiBtLmFbMl1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bM10gKiBtLmFbM11bMl07XHJcblxyXG4gICAgci5hWzFdWzNdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzNdO1xyXG5cclxuICAgIHIuYVsyXVswXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVswXTtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICB0aGlzLmFbMl1bMF0gKiBtLmFbMF1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMV0gKiBtLmFbMV1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMl0gKiBtLmFbMl1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bM10gKiBtLmFbM11bMV07XHJcblxyXG4gICAgci5hWzJdWzJdID1cclxuICAgICAgdGhpcy5hWzJdWzBdICogbS5hWzBdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzFdICogbS5hWzFdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzJdICogbS5hWzJdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzNdICogbS5hWzNdWzJdO1xyXG5cclxuICAgIHIuYVsyXVszXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVszXTtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzNdWzFdID1cclxuICAgICAgdGhpcy5hWzNdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVszXVsyXSA9XHJcbiAgICAgIHRoaXMuYVszXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICAvL011bHRpcGx5aW5nIHRocmVlIG1hdHJpeGVzXHJcbiAgbWF0ck11bE1hdHIzKG0xLCBtMikge1xyXG4gICAgcmV0dXJuIHRoaXMubWF0ck11bE1hdHIyKG0xLm1hdHJNdWxNYXRyMihtMikpO1xyXG4gIH1cclxuXHJcbiAgTWF0ckludmVyc2UoKSB7XHJcbiAgICBsZXQgciA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbGV0IGRldCA9IG1hdHJEZXRlcm0oTSk7XHJcblxyXG4gICAgaWYgKGRldCA9PSAwKSByZXR1cm4gcjtcclxuXHJcbiAgICAvKiBidWlsZCBhZGpvaW50IG1hdHJpeCAqL1xyXG4gICAgci5hWzBdWzBdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bMF0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVswXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzBdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMF1bMV0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVsxXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzFdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bMV0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVswXVsyXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzFdWzJdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMl1bMl0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVszXVsyXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzBdWzNdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bM10gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVszXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzNdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIC8vUm90YXRpb24gbWF0cml4XHJcbiAgbWF0clJvdGF0ZShhbmdsZSwgdikge1xyXG4gICAgbGV0IGEgPSBhbmdsZSAqIDMuMTQxNTkyNjUzNTg5NzkzMiAvIDE4MCxcclxuICAgICAgcyA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjID0gTWF0aC5jb3MoYSk7XHJcblxyXG4gICAgbGV0IHIgPSBuZXcgX21hdDQoKTtcclxuICAgIHIuYSA9IFtcclxuICAgICAgW1xyXG4gICAgICAgIGMgKyB2LnggKiB2LnggKiAoMSAtIGMpLFxyXG4gICAgICAgIHYueSAqIHYueCAqICgxIC0gYykgLSB2LnogKiBzLFxyXG4gICAgICAgIHYueiAqIHYueCAqICgxIC0gYykgKyB2LnkgKiBzLFxyXG4gICAgICAgIDAsXHJcbiAgICAgIF0sXHJcbiAgICAgIFtcclxuICAgICAgICB2LnggKiB2LnkgKiAoMSAtIGMpICsgdi56ICogcyxcclxuICAgICAgICBjICsgdi55ICogdi55ICogKDEgLSBjKSxcclxuICAgICAgICB2LnogKiB2LnkgKiAoMSAtIGMpIC0gdi54ICogcyxcclxuICAgICAgICAwLFxyXG4gICAgICBdLFxyXG4gICAgICBbXHJcbiAgICAgICAgdi54ICogdi56ICogKDEgLSBjKSAtIHYueSAqIHMsXHJcbiAgICAgICAgdi55ICogdi56ICogKDEgLSBjKSArIHYueCAqIHMsXHJcbiAgICAgICAgYyArIHYueiAqIHYueiAqICgxIC0gYyksXHJcbiAgICAgICAgMCxcclxuICAgICAgXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgLy9WaWV3IG1hdHJpeFxyXG4gIG1hdHJWaWV3KGxvYywgYXQsIHVwMSkge1xyXG4gICAgbGV0IGRpciA9IGF0LnN1Yihsb2MpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICByaWdodCA9IGRpci5jcm9zcyh1cDEpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICB1cCA9IHJpZ2h0LmNyb3NzKGRpcikubm9ybWFsaXplKCk7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbS5hID0gW1xyXG4gICAgICBbcmlnaHQueCwgdXAueCwgLWRpci54LCAwXSxcclxuICAgICAgW3JpZ2h0LnksIHVwLnksIC1kaXIueSwgMF0sXHJcbiAgICAgIFtyaWdodC56LCB1cC56LCAtZGlyLnosIDBdLFxyXG4gICAgICBbLWxvYy5kb3QocmlnaHQpLCAtbG9jLmRvdCh1cCksIGxvYy5kb3QoZGlyKSwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL0ZydXN0dW0gbWF0cml4XHJcbiAgbWF0ckZydXN0dW0obCwgciwgYiwgdCwgbiwgZikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgWygyICogbikgLyAociAtIGwpLCAwLCAwLCAwXSxcclxuICAgICAgWzAsICgyICogbikgLyAodCAtIGIpLCAwLCAwXSxcclxuICAgICAgWyhyICsgbCkgLyAociAtIGwpLCAodCArIGIpIC8gKHQgLSBiKSwgLSgoZiArIG4pIC8gKGYgLSBuKSksIC0xXSxcclxuICAgICAgWzAsIDAsIC0oKDIgKiBuICogZikgLyAoZiAtIG4pKSwgMF0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1RyYW5zcG9zZSBtYXRyaXhcclxuICBtYXRyVHJhbnNwb3NlKCkge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICAobS5hID0gW20uYVswXVswXSwgbS5hWzFdWzBdLCBtLmFbMl1bMF0sIG0uYVszXVswXV0pLFxyXG4gICAgICBbbS5hWzBdWzFdLCBtLmFbMV1bMV0sIG0uYVsyXVsxXSwgbS5hWzNdWzFdXSxcclxuICAgICAgW20uYVswXVsyXSwgbS5hWzFdWzJdLCBtLmFbMl1bMl0sIG0uYVszXVsyXV0sXHJcbiAgICAgIFttLmFbMF1bM10sIG0uYVsxXVszXSwgbS5hWzJdWzNdLCBtLmFbM11bM11dO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1JhdGF0aW9uIGJ5IFggbWF0cml4XHJcbiAgbWF0clJvdGF0ZVgoYW5nbGVJbkRlZ3JlZSkge1xyXG4gICAgbGV0IGEgPSBhbmdsZUluRGVncmVlICogMy4xNDE1OTI2NTM1ODk3OTMyIC8gMTgwLFxyXG4gICAgICBzaSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjbyA9IE1hdGguY29zKGEpLFxyXG4gICAgICBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCBjbywgc2ksIDBdLFxyXG4gICAgICBbMCwgLXNpLCBjbywgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vUm90YXRpb24gYnkgWSBtYXRyaXhcclxuICBtYXRyUm90YXRlWShhbmdsZUluRGVncmVlKSB7XHJcbiAgICBsZXQgYSA9IGFuZ2xlSW5EZWdyZWUgKiAzLjE0MTU5MjY1MzU4OTc5MzIgLyAxODAsXHJcbiAgICAgIHNpID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGNvID0gTWF0aC5jb3MoYSksXHJcbiAgICAgIG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFtjbywgMCwgLXNpLCAwXSxcclxuICAgICAgWzAsIDEsIDAsIDBdLFxyXG4gICAgICBbc2ksIDAsIGNvLCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBieSBaIG1hdHJpeFxyXG4gIG1hdHJSb3RhdGVaKGFuZ2xlSW5EZWdyZWUpIHtcclxuICAgIGxldCBhID0gYW5nbGVJbkRlZ3JlZSAqIDMuMTQxNTkyNjUzNTg5NzkzMiAvIDE4MCxcclxuICAgICAgc2kgPSBNYXRoLnNpbihhKSxcclxuICAgICAgY28gPSBNYXRoLmNvcyhhKSxcclxuICAgICAgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIG0uYSA9IFtcclxuICAgICAgW2NvLCBzaSwgMCwgMF0sXHJcbiAgICAgIFstc2ksIGNvLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1NjYWxlIG1hdHJpeFxyXG4gIG1hdHJTY2FsZSh2KSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIG0uYSA9IFtcclxuICAgICAgW3YueCwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCB2LnksIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgdi56LCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgbWF0ck9ydGhvKGwsIHIsIGIsIHQsIG4sIGYpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbMiAvIChyIC0gbCksIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMiAvICh0IC0gYiksIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgLTIgLyAoZiAtIG4pLCAwXSxcclxuICAgICAgWy0ociArIGwpIC8gKHIgLSBsKSwgLSh0ICsgYikgLyAodCAtIGIpLCAtKGYgKyBuKSAvIChmIC0gbiksIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuICAvL1BvaW50IGJ5IG1hdHJpeCB0cmFuc2Zvcm1hdGlvblxyXG4gIHRyYW5zZm9ybVBvaW50KHYpIHtcclxuICAgIGxldCB2ZSA9IHZlYzMoXHJcbiAgICAgIHYueCAqIHRoaXMuYVswXVswXSArIHYueSAqIHRoaXMuYVsxXVswXSArIHYueiAqIHRoaXMuYVsyXVswXSArIHRoaXMuYVszXVswXSxcclxuICAgICAgdi54ICogdGhpcy5hWzBdWzFdICsgdi55ICogdGhpcy5hWzFdWzFdICsgdi56ICogdGhpcy5hWzJdWzFdICsgdGhpcy5hWzNdWzFdLFxyXG4gICAgICB2LnggKiB0aGlzLmFbMF1bMl0gKyB2LnkgKiB0aGlzLmFbMV1bMl0gKyB2LnogKiB0aGlzLmFbMl1bMl0gKyB0aGlzLmFbM11bMl1cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHZlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWF0ckRldGVybTN4MyhhMTEsIGExMiwgYTEzLCBhMjEsIGEyMiwgYTIzLCBhMzEsIGEzMiwgYTMzKSB7XHJcbiAgcmV0dXJuIChcclxuICAgIGExMSAqIGEyMiAqIGEzMyArXHJcbiAgICBhMTIgKiBhMjMgKiBhMzEgK1xyXG4gICAgYTEzICogYTIxICogYTMyIC1cclxuICAgIGExMSAqIGEyMyAqIGEzMiAtXHJcbiAgICBhMTIgKiBhMjEgKiBhMzMgLVxyXG4gICAgYTEzICogYTIyICogYTMxXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWF0ckRldGVybShtKSB7XHJcbiAgbGV0IGQgPVxyXG4gICAgK3RoaXMuYVswXVswXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzFdLFxyXG4gICAgICAgIG0uYVsxXVsyXSxcclxuICAgICAgICBtLmFbMV1bM10sXHJcbiAgICAgICAgbS5hWzJdWzFdLFxyXG4gICAgICAgIG0uYVsyXVsyXSxcclxuICAgICAgICBtLmFbMl1bM10sXHJcbiAgICAgICAgbS5hWzNdWzFdLFxyXG4gICAgICAgIG0uYVszXVsyXSxcclxuICAgICAgICBtLmFbM11bM11cclxuICAgICAgKSArXHJcbiAgICAtbS5hWzBdWzFdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMF0sXHJcbiAgICAgICAgbS5hWzFdWzJdLFxyXG4gICAgICAgIG0uYVsxXVszXSxcclxuICAgICAgICBtLmFbMl1bMF0sXHJcbiAgICAgICAgbS5hWzJdWzJdLFxyXG4gICAgICAgIG0uYVsyXVszXSxcclxuICAgICAgICBtLmFbM11bMF0sXHJcbiAgICAgICAgbS5hWzNdWzJdLFxyXG4gICAgICAgIG0uYVszXVszXVxyXG4gICAgICApICtcclxuICAgICttLmFbMF1bMl0gKlxyXG4gICAgICBtYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIG0uYVsxXVswXSxcclxuICAgICAgICBtLmFbMV1bMV0sXHJcbiAgICAgICAgbS5hWzFdWzNdLFxyXG4gICAgICAgIG0uYVsyXVswXSxcclxuICAgICAgICBtLmFbMl1bMV0sXHJcbiAgICAgICAgbS5hWzJdWzNdLFxyXG4gICAgICAgIG0uYVszXVswXSxcclxuICAgICAgICBtLmFbM11bMV0sXHJcbiAgICAgICAgbS5hWzNdWzNdXHJcbiAgICAgICkgK1xyXG4gICAgLW0uYVswXVszXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzBdLFxyXG4gICAgICAgIG0uYVsxXVsxXSxcclxuICAgICAgICBtLmFbMV1bMl0sXHJcbiAgICAgICAgbS5hWzJdWzBdLFxyXG4gICAgICAgIG0uYVsyXVsxXSxcclxuICAgICAgICBtLmFbMl1bMl0sXHJcbiAgICAgICAgbS5hWzNdWzBdLFxyXG4gICAgICAgIG0uYVszXVsxXSxcclxuICAgICAgICBtLmFbM11bMl1cclxuICAgICAgKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1hdDQoKSB7XHJcbiAgcmV0dXJuIG5ldyBfbWF0NCgpO1xyXG59XHJcbiIsImltcG9ydCB7IGluZGV4X2J1ZmZlciwgdmVydGV4X2J1ZmZlciB9IGZyb20gXCIuLi9VQk8vdWJvLmpzXCI7XHJcbmltcG9ydCB7IGN1YmVDcmVhdGUgfSBmcm9tIFwiLi9jdWJlLmpzXCI7XHJcbmltcG9ydCB7IGVhcnRoQ3JlYXRlIH0gZnJvbSBcIi4vZWFydGguanNcIjtcclxuaW1wb3J0IHsgc2hhZGVyIH0gZnJvbSBcIi4uL3NoZC9zaGFkZXIuanNcIjtcclxuaW1wb3J0IHsgbWF0NCB9IGZyb20gXCIuLi9tdGgvbWF0NC5qc1wiO1xyXG5pbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4uL210aC92ZWMzLmpzXCI7XHJcblxyXG5jbGFzcyBfcHJpbSB7XHJcbiAgY29uc3RydWN0b3IoZ2wsIG5hbWUsIHR5cGUsIG10bCwgcG9zLCBWQnVmLCBJQnVmLCBWQSwgbm9vZkksIG5vb2ZWLCBzaWRlKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgKHRoaXMuVkJ1ZiA9IFZCdWYpLCAodGhpcy5JQnVmID0gSUJ1ZiksICh0aGlzLlZBID0gVkEpOyAvKiByZW5kZXIgaW5mbyAqL1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLyogcGxhdG9uIGZpZ3VyZSB0eXBlICovXHJcbiAgICB0aGlzLnBvcyA9IHBvczsgLyogcG9zaXRpb24gKi9cclxuXHJcbiAgICB0aGlzLnNpZGUgPSBzaWRlO1xyXG4gICAgLy9sZXQgc2hkID0gc2hhZGVyKHNoZF9uYW1lLCBnbCk7XHJcbiAgICB0aGlzLm10bCA9IG10bDtcclxuICAgIHRoaXMuc2hkSXNMb2FkZWQgPSBudWxsO1xyXG4gICAgdGhpcy5ub29mSSA9IG5vb2ZJO1xyXG4gICAgdGhpcy5ub29mViA9IG5vb2ZWO1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5tYXRyV291cmxkID0gbWF0NCgpO1xyXG4gIH1cclxuXHJcbiAgdGV4QXR0YWNoKHVybCwgZ2wsIHR5cGUgPSBcIjJkXCIpIHtcclxuICAgIHRoaXMubXRsLnRleHR1cmVBdHRhY2godXJsLCB0eXBlLCBnbCk7XHJcbiAgfVxyXG5cclxuICB1cGRhdGVQcmltRGF0YSh0aW1lcikge1xyXG4gICAgaWYgKHRoaXMubXRsLnNoYWRlci51bmlmb3Jtc1tcIm1hdHJXb3JsZFwiXSA9PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIGxldCBtciwgbTE7XHJcbiAgICBpZiAodGhpcy50eXBlID09IFwiZWFydGhcIiB8fCB0aGlzLnR5cGUgPT0gXCJjbG91ZHNcIikge1xyXG4gICAgICBtMSA9IG1hdDQoKVxyXG4gICAgICAgIC5tYXRyTXVsTWF0cjIobWF0NCgpLm1hdHJSb3RhdGVZKDMwICogdGltZXIuZ2xvYmFsVGltZSkpXHJcbiAgICAgICAgLm1hdHJNdWxNYXRyMihtYXQ0KCkubWF0clNjYWxlKHZlYzMoMywgMywgMykpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1yID0gbWF0NCgpLm1hdHJTY2FsZSh2ZWMzKHRoaXMuc2lkZSkpO1xyXG4gICAgICBtMSA9IG1hdDQoKVxyXG4gICAgICAgIC5tYXRyVHJhbnNsYXRlKHRoaXMucG9zKVxyXG4gICAgICAgIC5tYXRyTXVsTWF0cjIobXIpXHJcbiAgICAgICAgLm1hdHJNdWxNYXRyMihtYXQ0KCkubWF0clJvdGF0ZVkoMzAgKiB0aW1lci5nbG9iYWxUaW1lKSk7XHJcbiAgICB9XHJcbiAgICBsZXQgYXJyMSA9IG0xLnRvQXJyYXkoKTtcclxuICAgIGxldCBtV0xvYyA9IHRoaXMubXRsLnNoYWRlci51bmlmb3Jtc1tcIm1hdHJXb3JsZFwiXS5sb2M7XHJcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobVdMb2MsIGZhbHNlLCBhcnIxKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcih0aW1lcikge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBKTtcclxuICAgIGlmICh0aGlzLnNoZElzTG9hZGVkID09IG51bGwpIHtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuVkJ1Zi5pZCk7XHJcbiAgICAgIGlmICh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJbk5vcm1hbFwiXSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDEyLCAwKTtcclxuICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Ob3JtYWxcIl0ubG9jLCAyNCwgMTIpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluUG9zaXRpb25cIl0ubG9jLCAxNiwgMCk7XHJcbiAgICAgIC8vIHRoaXMubXRsLnNoYWRlci51cGRhdGVTaGFkZXJEYXRhKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnVwZGF0ZVByaW1EYXRhKHRpbWVyKTtcclxuXHJcbiAgICBpZiAodGhpcy5ub29mSSAhPSBudWxsKSB7XHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuSUJ1Zi5pZCk7XHJcbiAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRV9TVFJJUCwgdGhpcy5ub29mSSwgZ2wuVU5TSUdORURfSU5ULCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGdsLmRyYXdBcnJheXMoZ2wuTElORV9TVFJJUCwgMCwgdGhpcy5ub29mVik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBfdmVydGV4IHtcclxuICBjb25zdHJ1Y3Rvcihwb3MsIG5vcm0pIHtcclxuICAgICh0aGlzLnBvcyA9IHBvcyksICh0aGlzLm5vcm0gPSBub3JtKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2cnQocG9zLCBub3JtKSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVydGV4KHBvcywgbm9ybSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcmltQ3JlYXRlKG5hbWUsIHR5cGUsIG10bCwgcG9zLCBzaWRlID0gMywgZ2wpIHtcclxuICBsZXQgdmk7XHJcbiAgaWYgKHR5cGUgPT0gXCJjdWJlXCIpIHZpID0gY3ViZUNyZWF0ZSgpO1xyXG4gIGlmICh0eXBlID09IFwiZWFydGhcIikgdmkgPSBlYXJ0aENyZWF0ZShuYW1lKTtcclxuICBsZXQgdmVydCA9IHZpWzBdLFxyXG4gICAgaW5kID0gdmlbMV0sXHJcbiAgICB3ID0gdmlbMl0sXHJcbiAgICBoID0gdmlbM107XHJcblxyXG4gIGxldCB2ZXJ0ZXhBcnJheSA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgZ2wuYmluZFZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcclxuICBsZXQgdmVydGV4QnVmZmVyID0gdmVydGV4X2J1ZmZlcih2ZXJ0LCBnbCksXHJcbiAgICBpbmRleEJ1ZmZlcixcclxuICAgIGluZGxlbjtcclxuXHJcbiAgaWYgKGluZCAhPSBudWxsKSAoaW5kZXhCdWZmZXIgPSBpbmRleF9idWZmZXIoaW5kLCBnbCkpLCAoaW5kbGVuID0gaW5kLmxlbmd0aCk7XHJcbiAgZWxzZSAoaW5kZXhCdWZmZXIgPSBudWxsKSwgKGluZGxlbiA9IG51bGwpO1xyXG5cclxuICBsZXQgcHIgPSBuZXcgX3ByaW0oXHJcbiAgICBnbCxcclxuICAgIG5hbWUsXHJcbiAgICB0eXBlLFxyXG4gICAgbXRsLFxyXG4gICAgcG9zLFxyXG4gICAgdmVydGV4QnVmZmVyLFxyXG4gICAgaW5kZXhCdWZmZXIsXHJcbiAgICB2ZXJ0ZXhBcnJheSxcclxuICAgIGluZGxlbixcclxuICAgIHZlcnQubGVuZ3RoLFxyXG4gICAgc2lkZVxyXG4gICk7XHJcbiAgcHIudyA9IHc7XHJcbiAgcHIuaCA9IGg7XHJcbiAgcmV0dXJuIHByO1xyXG59XHJcbiIsImNsYXNzIF90aW1lciB7XHJcbiAgLy8gVGltZXIgb2J0YWluIGN1cnJlbnQgdGltZSBpbiBzZWNvbmRzIG1ldGhvZFxyXG4gIGdldFRpbWUoKSB7XHJcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgIGxldCB0ID1cclxuICAgICAgZGF0ZS5nZXRNaWxsaXNlY29uZHMoKSAvIDEwMDAuMCArXHJcbiAgICAgIGRhdGUuZ2V0U2Vjb25kcygpICtcclxuICAgICAgZGF0ZS5nZXRNaW51dGVzKCkgKiA2MDtcclxuICAgIHJldHVybiB0O1xyXG4gIH07XHJcblxyXG4gIC8vIFRpbWVyIHJlc3BvbnNlIG1ldGhvZFxyXG4gIHJlc3BvbnNlKCkge1xyXG4gICAgbGV0IHQgPSB0aGlzLmdldFRpbWUoKTtcclxuICAgIC8vIEdsb2JhbCB0aW1lXHJcbiAgICB0aGlzLmdsb2JhbFRpbWUgPSB0O1xyXG4gICAgdGhpcy5nbG9iYWxEZWx0YVRpbWUgPSB0IC0gdGhpcy5vbGRUaW1lO1xyXG4gICAgLy8gVGltZSB3aXRoIHBhdXNlXHJcbiAgICBpZiAodGhpcy5pc1BhdXNlKSB7XHJcbiAgICAgIHRoaXMubG9jYWxEZWx0YVRpbWUgPSAwO1xyXG4gICAgICB0aGlzLnBhdXNlVGltZSArPSB0IC0gdGhpcy5vbGRUaW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5sb2NhbERlbHRhVGltZSA9IHRoaXMuZ2xvYmFsRGVsdGFUaW1lO1xyXG4gICAgICB0aGlzLmxvY2FsVGltZSA9IHQgLSB0aGlzLnBhdXNlVGltZSAtIHRoaXMuc3RhcnRUaW1lO1xyXG4gICAgfVxyXG4gICAgLy8gRlBTXHJcbiAgICB0aGlzLmZyYW1lQ291bnRlcisrO1xyXG4gICAgaWYgKHQgLSB0aGlzLm9sZFRpbWVGUFMgPiAzKSB7XHJcbiAgICAgIHRoaXMuRlBTID0gdGhpcy5mcmFtZUNvdW50ZXIgLyAodCAtIHRoaXMub2xkVGltZUZQUyk7XHJcbiAgICAgIHRoaXMub2xkVGltZUZQUyA9IHQ7XHJcbiAgICAgIHRoaXMuZnJhbWVDb3VudGVyID0gMDtcclxuICAgICAgLy9pZiAodGFnX2lkICE9IG51bGwpXHJcbiAgICAgIC8vICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWdfaWQpLmlubmVySFRNTCA9IHRoaXMuZ2V0RlBTKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9sZFRpbWUgPSB0O1xyXG4gIH07XHJcbiBcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIC8vIEZpbGwgdGltZXIgZ2xvYmFsIGRhdGFcclxuICAgIHRoaXMuZ2xvYmFsVGltZSA9IHRoaXMubG9jYWxUaW1lID0gdGhpcy5nZXRUaW1lKCk7XHJcbiAgICB0aGlzLmdsb2JhbERlbHRhVGltZSA9IHRoaXMubG9jYWxEZWx0YVRpbWUgPSAwO1xyXG4gIFxyXG4gICAgLy8gRmlsbCB0aW1lciBzZW1pIGdsb2JhbCBkYXRhXHJcbiAgICB0aGlzLnN0YXJ0VGltZSA9IHRoaXMub2xkVGltZSA9IHRoaXMub2xkVGltZUZQUyA9IHRoaXMuZ2xvYmFsVGltZTtcclxuICAgIHRoaXMuZnJhbWVDb3VudGVyID0gMDtcclxuICAgIHRoaXMuaXNQYXVzZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5GUFMgPSAzMC4wO1xyXG4gICAgdGhpcy5wYXVzZVRpbWUgPSAwO1xyXG4gIH1cclxuICAvLyBPYnRhaW4gRlBTIGFzIHN0cmluZyBtZXRob2RcclxuICBnZXRGUFMgPSAoKSA9PiB0aGlzLkZQUy50b0ZpeGVkKDMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXIoKSB7XHJcbiAgcmV0dXJuIG5ldyBfdGltZXIoKTtcclxufSIsImltcG9ydCB7IHZlYzMgfSBmcm9tIFwiLi92ZWMzLmpzXCI7XHJcbmltcG9ydCB7IG1hdDQgfSBmcm9tIFwiLi9tYXQ0LmpzXCI7XHJcblxyXG5jb25zdCBEMlIgPSBkZWdyZWVzID0+IGRlZ3JlZXMgKiBNYXRoLlBJIC8gMTgwO1xyXG5jb25zdCBSMkQgPSByYWRpYW5zID0+IHJhZGlhbnMgKiAxODAgLyBNYXRoLlBJO1xyXG4gXHJcbmZ1bmN0aW9uIGRpc3RhbmNlKHAxLCBwMikge1xyXG4gIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDEuY2xpZW50WCAtIHAyLmNsaWVudFgsIDIpICsgTWF0aC5wb3cocDEuY2xpZW50WSAtIHAyLmNsaWVudFksIDIpKTtcclxufVxyXG4gXHJcbmV4cG9ydCBjbGFzcyBpbnB1dCB7XHJcbiAgY29uc3RydWN0b3Iocm5kKSB7XHJcbiAgICAvL2dsLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB0aGlzLm9uQ2xpY2soZSkpO1xyXG4gICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5vbk1vdXNlTW92ZShlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCAoZSkgPT4gdGhpcy5vbk1vdXNlV2hlZWwoZSkpO1xyXG4gICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5vbk1vdXNlRG93bihlKSk7XHJcbiAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5vbk1vdXNlVXAoZSkpO1xyXG4gICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiBlLnByZXZlbnREZWZhdWx0KCkpO1xyXG4gICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG4gICAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5vblRvdWNoU3RhcnQoZSkpO1xyXG4gICAgICBybmQuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLm9uVG91Y2hNb3ZlKGUpKTtcclxuICAgICAgcm5kLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLm9uVG91Y2hFbmQoZSkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHRoaXMub25LZXlEb3duKGUpKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlKSA9PiB0aGlzLm9uS2V5VXAoZSkpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1YID0gMDtcclxuICAgIHRoaXMubVkgPSAwO1xyXG4gICAgdGhpcy5tWiA9IDA7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zID0gWzAsIDAsIDAsIDAsIDBdO1xyXG4gICAgdGhpcy5tQnV0dG9uc09sZCA9IFswLCAwLCAwLCAwLCAwXTtcclxuICAgIHRoaXMubUJ1dHRvbnNDbGljayA9IFswLCAwLCAwLCAwLCAwXTtcclxuICAgIFxyXG4gICAgLy8gWm9vbSBzcGVjaWZpY1xyXG4gICAgdGhpcy5zY2FsaW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLmRpc3QgPSAwO1xyXG4gICAgdGhpcy5zY2FsZV9mYWN0b3IgPSAxLjA7XHJcbiAgICB0aGlzLmN1cnJfc2NhbGUgPSAxLjA7XHJcbiAgICB0aGlzLm1heF96b29tID0gOC4wO1xyXG4gICAgdGhpcy5taW5fem9vbSA9IDAuNTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB0aGlzLmtleXMgPSBbXTtcclxuICAgIHRoaXMua2V5c09sZCA9IFtdO1xyXG4gICAgdGhpcy5rZXlzQ2xpY2sgPSBbXTtcclxuICAgIFtcclxuICAgICAgXCJFbnRlclwiLCBcIkJhY2tzcGFjZVwiLFxyXG4gICAgICBcIkRlbGV0ZVwiLCBcIlNwYWNlXCIsIFwiVGFiXCIsIFwiRXNjYXBlXCIsIFwiQXJyb3dMZWZ0XCIsIFwiQXJyb3dVcFwiLCBcIkFycm93UmlnaHRcIixcclxuICAgICAgXCJBcnJvd0Rvd25cIiwgXCJTaGlmdFwiLCBcIkNvbnRyb2xcIiwgXCJBbHRcIiwgXCJTaGlmdExlZnRcIiwgXCJTaGlmdFJpZ2h0XCIsIFwiQ29udHJvbExlZnRcIixcclxuICAgICAgXCJDb250cm9sUmlnaHRcIiwgXCJQYWdlVXBcIiwgXCJQYWdlRG93blwiLCBcIkVuZFwiLCBcIkhvbWVcIixcclxuICAgICAgXCJEaWdpdDBcIiwgXCJEaWdpdDFcIixcclxuICAgICAgXCJLZXlBXCIsXHJcbiAgICAgIFwiTnVtcGFkMFwiLCBcIk51bXBhZE11bHRpcGx5XCIsXHJcbiAgICAgIFwiRjFcIixcclxuICAgIF0uZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmtleXNba2V5XSA9IDA7XHJcbiAgICAgIHRoaXMua2V5c09sZFtrZXldID0gMDtcclxuICAgICAgdGhpcy5rZXlzQ2xpY2tba2V5XSA9IDA7XHJcbiAgICB9KTtcclxuIFxyXG4gICAgdGhpcy5zaGlmdEtleSA9IGZhbHNlO1xyXG4gICAgdGhpcy5hbHRLZXkgPSBmYWxzZTtcclxuICAgIHRoaXMuY3RybEtleSA9IGZhbHNlO1xyXG4gXHJcbiAgICB0aGlzLmlzRmlyc3QgPSB0cnVlO1xyXG4gIH0gLy8gRW5kIG9mICdjb25zdHJ1Y3RvcicgZnVuY3Rpb25cclxuIFxyXG4gIC8vLyBNb3VzZSBoYW5kbGUgZnVuY3Rpb25zXHJcbiBcclxuICBvbkNsaWNrKGUpIHtcclxuICAgIC8vY3JpYVxyXG4gIH0gLy8gRW5kIG9mICdvbkNsaWNrJyBmdW5jdGlvblxyXG4gIFxyXG4gIG9uVG91Y2hTdGFydChlKSB7XHJcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAxKVxyXG4gICAgICB0aGlzLm1CdXR0b25zWzBdID0gMTtcclxuICAgIGVsc2UgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMikge1xyXG4gICAgICB0aGlzLm1CdXR0b25zWzBdID0gMDtcclxuICAgICAgdGhpcy5tQnV0dG9uc1syXSA9IDE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5tQnV0dG9uc1swXSA9IDA7XHJcbiAgICAgIHRoaXMubUJ1dHRvbnNbMl0gPSAwO1xyXG4gICAgICB0aGlzLm1CdXR0b25zWzFdID0gMTtcclxuICAgIH1cclxuICAgIGxldFxyXG4gICAgICB4ID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZS50YXJnZXQub2Zmc2V0TGVmdCxcclxuICAgICAgeSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGUudGFyZ2V0Lm9mZnNldFRvcDtcclxuICAgIHRoaXMubUR4ID0gMDtcclxuICAgIHRoaXMubUR5ID0gMDtcclxuICAgIHRoaXMubUR6ID0gMDtcclxuICAgIHRoaXMubVggPSB4O1xyXG4gICAgdGhpcy5tWSA9IHk7XHJcbiBcclxuICAgIGxldCB0dCA9IGUudGFyZ2V0VG91Y2hlcztcclxuICAgIGlmICh0dC5sZW5ndGggPj0gMikge1xyXG4gICAgICB0aGlzLmRpc3QgPSBkaXN0YW5jZSh0dFswXSwgdHRbMV0pO1xyXG4gICAgICB0aGlzLnNjYWxpbmcgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHsgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICB0aGlzLnNjYWxpbmcgPSBmYWxzZTtcclxuICAgIH1cclxuICB9IC8vIEVuZCBvZiAnb25Ub3VjaFN0YXJ0JyBmdW5jdGlvblxyXG4gXHJcbiAgb25Ub3VjaE1vdmUoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gXHJcbiAgICBsZXRcclxuICAgICAgeCA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWCAtIGUudGFyZ2V0Lm9mZnNldExlZnQsXHJcbiAgICAgIHkgPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3A7XHJcbiBcclxuICAgIGxldCB0dCA9IGUudGFyZ2V0VG91Y2hlcztcclxuXHJcbiAgICBpZiAodGhpcy5zY2FsaW5nKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgIHRoaXMubUR6ID0gMDtcclxuICAgICAgdGhpcy5jdXJyX3NjYWxlID0gKGRpc3RhbmNlKHR0WzBdLCB0dFsxXSkgLyB0aGlzLmRpc3QpICogdGhpcy5zY2FsZV9mYWN0b3I7XHJcbiBcclxuICAgICAgbGV0IGQgPSBkaXN0YW5jZSh0dFswXSwgdHRbMV0pO1xyXG4gICAgICBpZiAoTWF0aC5hYnMoZCAtIHRoaXMuZGlzdCkgPiAwKSB7Ly80Nykge1xyXG4gICAgICAgIGlmIChkIDwgdGhpcy5kaXN0KVxyXG4gICAgICAgICAgdGhpcy5tRHogPSAxICogKGQgLyB0aGlzLmRpc3QpLCB0aGlzLmRpc3QgPSBkO1xyXG4gICAgICAgIGVsc2UgaWYgKGQgPiB0aGlzLmRpc3QpXHJcbiAgICAgICAgICB0aGlzLm1EeiA9IC0xICogKHRoaXMuZGlzdCAvIGQpLCB0aGlzLmRpc3QgPSBkO1xyXG4gICAgICAgIHRoaXMubVogKz0gdGhpcy5tRHo7XHJcbiBcclxuICAgICAgICB0aGlzLm1EeCA9IHggLSB0aGlzLm1YO1xyXG4gICAgICAgIHRoaXMubUR5ID0geSAtIHRoaXMubVk7XHJcbiAgICAgICAgdGhpcy5tWCA9IHg7XHJcbiAgICAgICAgdGhpcy5tWSA9IHk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiBcclxuICAgIGlmICh0aGlzLm1CdXR0b25zWzFdID09IDEpIHtcclxuICAgICAgdGhpcy5tRHggPSAwO1xyXG4gICAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICAgIHRoaXMubUR6ID0geSAtIHRoaXMubVo7XHJcbiAgICAgIHRoaXMubVggPSB4O1xyXG4gICAgICB0aGlzLm1ZID0geTtcclxuICAgICAgdGhpcy5tWiArPSB0aGlzLm1EejtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubUR4ID0geCAtIHRoaXMubVg7XHJcbiAgICAgIHRoaXMubUR5ID0geSAtIHRoaXMubVk7XHJcbiAgICAgIHRoaXMubUR6ID0gMDtcclxuICAgICAgdGhpcy5tWCA9IHg7XHJcbiAgICAgIHRoaXMubVkgPSB5O1xyXG4gICAgfSAgXHJcbiAgfSAvLyBFbmQgb2YgJ29uVG91Y2hNb3ZlJyBmdW5jdGlvblxyXG4gXHJcbiAgb25Ub3VjaEVuZChlKSB7XHJcbiAgICB0aGlzLm1CdXR0b25zWzBdID0gMDtcclxuICAgIHRoaXMubUJ1dHRvbnNbMV0gPSAwO1xyXG4gICAgdGhpcy5tQnV0dG9uc1syXSA9IDA7XHJcbiAgICBsZXRcclxuICAgICAgeCA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWCAtIGUudGFyZ2V0Lm9mZnNldExlZnQsXHJcbiAgICAgIHkgPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3A7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1YID0geDtcclxuICAgIHRoaXMubVkgPSB5O1xyXG4gXHJcbiAgICBsZXQgdHQgPSBlLnRhcmdldFRvdWNoZXM7XHJcbiAgICBpZiAodHQubGVuZ3RoIDwgMikge1xyXG4gICAgICB0aGlzLnNjYWxpbmcgPSBmYWxzZTtcclxuICAgICAgaWYgKHRoaXMuY3Vycl9zY2FsZSA8IHRoaXMubWluX3pvb20pIHtcclxuICAgICAgICB0aGlzLnNjYWxlX2ZhY3RvciA9IHRoaXMubWluX3pvb207XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY3Vycl9zY2FsZSA+IHRoaXMubWF4X3pvb20pIHtcclxuICAgICAgICAgIHRoaXMuc2NhbGVfZmFjdG9yID0gdGhpcy5tYXhfem9vbTsgXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuc2NhbGVfZmFjdG9yID0gdGhpcy5jdXJyX3NjYWxlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zY2FsaW5nID0gdHJ1ZTtcclxuICAgIH1cclxuICB9IC8vIEVuZCBvZiAnb25Ub3VjaE1vdmUnIGZ1bmN0aW9uXHJcbiBcclxuICBvbk1vdXNlTW92ZShlKSB7XHJcbiAgICBsZXRcclxuICAgICAgZHggPSBlLm1vdmVtZW50WCxcclxuICAgICAgZHkgPSBlLm1vdmVtZW50WTtcclxuICAgIHRoaXMubUR4ID0gZHg7XHJcbiAgICB0aGlzLm1EeSA9IGR5O1xyXG4gICAgdGhpcy5tRHogPSAwO1xyXG4gICAgdGhpcy5tWCArPSBkeDtcclxuICAgIHRoaXMubVkgKz0gZHk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uTW91c2VNb3ZlJyBmdW5jdGlvblxyXG4gXHJcbiAgb25Nb3VzZVdoZWVsKGUpIHtcclxuICAgIGlmIChlLndoZWVsRGVsdGEgIT0gMClcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpcy5tWiArPSAodGhpcy5tRHogPSBlLndoZWVsRGVsdGEgLyAxMjApO1xyXG4gIH0gLy8gRW5kIG9mICdvbk1vdXNlV2hlZWwnIGZ1bmN0aW9uXHJcbiBcclxuICBvbk1vdXNlRG93bihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiBcclxuICAgIHRoaXMubUJ1dHRvbnNPbGRbZS5idXR0b25dID0gdGhpcy5tQnV0dG9uc1tlLmJ1dHRvbl07XHJcbiAgICB0aGlzLm1CdXR0b25zW2UuYnV0dG9uXSA9IDE7XHJcbiAgICB0aGlzLm1CdXR0b25zQ2xpY2tbZS5idXR0b25dID0gIXRoaXMubUJ1dHRvbnNPbGRbZS5idXR0b25dICYmIHRoaXMubUJ1dHRvbnNbZS5idXR0b25dO1xyXG4gICAgXHJcbiAgICB0aGlzLnNoaWZ0S2V5ID0gZS5zaGlmdEtleTtcclxuICAgIHRoaXMuYWx0S2V5ID0gZS5hbHRLZXk7XHJcbiAgICB0aGlzLmN0cmxLZXkgPSBlLmN0cmxLZXk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uTW91c2VNb3ZlJyBmdW5jdGlvblxyXG4gIFxyXG4gIG9uTW91c2VVcChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiBcclxuICAgIHRoaXMubUJ1dHRvbnNPbGRbZS5idXR0b25dID0gdGhpcy5tQnV0dG9uc1tlLmJ1dHRvbl07XHJcbiAgICB0aGlzLm1CdXR0b25zW2UuYnV0dG9uXSA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zQ2xpY2tbZS5idXR0b25dID0gMDtcclxuIFxyXG4gICAgdGhpcy5zaGlmdEtleSA9IGUuc2hpZnRLZXk7XHJcbiAgICB0aGlzLmFsdEtleSA9IGUuYWx0S2V5O1xyXG4gICAgdGhpcy5jdHJsS2V5ID0gZS5jdHJsS2V5O1xyXG4gIH0gLy8gRW5kIG9mICdvbk1vdXNlTW92ZScgZnVuY3Rpb25cclxuIFxyXG4gIC8vLyBLZXlib2FyZCBoYW5kbGVcclxuICBvbktleURvd24oZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAndGV4dGFyZWEnKVxyXG4gICAgICByZXR1cm47XHJcbiAgICBsZXQgZm9jdXNlZF9lbGVtZW50ID0gbnVsbDtcclxuICAgIGlmIChkb2N1bWVudC5oYXNGb2N1cygpICYmXHJcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSAmJlxyXG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG4gICAgICBmb2N1c2VkX2VsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xyXG4gICAgICBpZiAoZm9jdXNlZF9lbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAndGV4dGFyZWEnKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH0gICAgICBcclxuICAgIGlmIChlLmNvZGUgIT0gXCJGMTJcIiAmJiBlLmNvZGUgIT0gXCJGMTFcIiAmJiBlLmNvZGUgIT0gXCJLZXlSXCIpXHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMua2V5c09sZFtlLmNvZGVdID0gdGhpcy5rZXlzW2UuY29kZV07XHJcbiAgICB0aGlzLmtleXNbZS5jb2RlXSA9IDE7XHJcbiAgICB0aGlzLmtleXNDbGlja1tlLmNvZGVdID0gIXRoaXMua2V5c09sZFtlLmNvZGVdICYmIHRoaXMua2V5c1tlLmNvZGVdO1xyXG4gICAgXHJcbiAgICB0aGlzLnNoaWZ0S2V5ID0gZS5zaGlmdEtleTtcclxuICAgIHRoaXMuYWx0S2V5ID0gZS5hbHRLZXk7XHJcbiAgICB0aGlzLmN0cmxLZXkgPSBlLmN0cmxLZXk7XHJcbiAgfSAvLyBFbmQgb2YgJ29uS2V5RG93bicgZnVuY3Rpb25cclxuICBcclxuICBvbktleVVwKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3RleHRhcmVhJylcclxuICAgICAgcmV0dXJuO1xyXG4gICAgbGV0IGZvY3VzZWRfZWxlbWVudCA9IG51bGw7XHJcbiAgICBpZiAoZG9jdW1lbnQuaGFzRm9jdXMoKSAmJlxyXG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmJvZHkgJiZcclxuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpIHtcclxuICAgICAgZm9jdXNlZF9lbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgaWYgKGZvY3VzZWRfZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3RleHRhcmVhJylcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9ICAgICAgXHJcbiAgICBpZiAoZS5jb2RlICE9IFwiRjEyXCIgJiYgZS5jb2RlICE9IFwiRjExXCIgJiYgZS5jb2RlICE9IFwiS2V5UlwiKVxyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLmtleXNPbGRbZS5jb2RlXSA9IHRoaXMua2V5c1tlLmNvZGVdO1xyXG4gICAgdGhpcy5rZXlzW2UuY29kZV0gPSAwO1xyXG4gICAgdGhpcy5rZXlzQ2xpY2tbZS5jb2RlXSA9IDA7XHJcbiBcclxuICAgIHRoaXMuc2hpZnRLZXkgPSBlLnNoaWZ0S2V5O1xyXG4gICAgdGhpcy5hbHRLZXkgPSBlLmFsdEtleTtcclxuICAgIHRoaXMuY3RybEtleSA9IGUuY3RybEtleTtcclxuICB9IC8vIEVuZCBvZiAnb25LZXlVcCcgZnVuY3Rpb25cclxuICBcclxuICAvLy8gQ2FtZXJhIG1vdmVtZW50IGhhbmRsaW5nXHJcbiAgcmVzZXQoKSB7XHJcbiAgICB0aGlzLm1EeCA9IDA7XHJcbiAgICB0aGlzLm1EeSA9IDA7XHJcbiAgICB0aGlzLm1EeiA9IDA7XHJcbiAgICB0aGlzLm1CdXR0b25zQ2xpY2suZm9yRWFjaChrID0+IHRoaXMubUJ1dHRvbnNDbGlja1trXSA9IDApO1xyXG4gICAgdGhpcy5rZXlzQ2xpY2suZm9yRWFjaChrID0+IHRoaXMua2V5c0NsaWNrW2tdID0gMCk7XHJcbiBcclxuICAgIHRoaXMuc2hpZnRLZXkgPSB0aGlzLmtleXNbXCJTaGlmdExlZnRcIl0gfHwgdGhpcy5rZXlzW1wiU2hpZnRSaWdodFwiXTtcclxuICAgIHRoaXMuYWx0S2V5ID0gdGhpcy5rZXlzW1wiQWx0TGVmdFwiXSB8fCB0aGlzLmtleXNbXCJBbHRSaWdodFwiXTtcclxuICAgIHRoaXMuY3RybEtleSA9IHRoaXMua2V5c1tcIkNvbnRyb2xMZWZ0XCJdIHx8IHRoaXMua2V5c1tcIkNvbnRyb2xSaWdodFwiXTtcclxuICB9IC8vIEVuZCBvZiByZXNldCcgZnVuY3Rpb25cclxuICAgICAgICAgIFxyXG4gIHJlc3BvbnNlQ2FtZXJhKHJuZCkge1xyXG4gICAgaWYgKHRoaXMuc2hpZnRLZXkgJiYgdGhpcy5rZXlzQ2xpY2tbXCJLZXlGXCJdKSB7XHJcbiAgICAgIHJuZC5jYW0gPSBybmQuY2FtLmNhbVNldCh2ZWMzKDYpLCB2ZWMzKDApLCB2ZWMzKDAsIDEsIDApKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuY3RybEtleSkge1xyXG4gICAgICAvLyBIYW5kbGUgY2FtZXJhIG9yaWVudGF0aW9uXHJcbiAgICAgIGxldFxyXG4gICAgICAgIERpc3QgPSBybmQuY2FtLmF0LnN1YihybmQuY2FtLmxvYykubGVuKCksXHJcbiAgICAgICAgY29zVCA9IChybmQuY2FtLmxvYy55IC0gcm5kLmNhbS5hdC55KSAvIERpc3QsXHJcbiAgICAgICAgc2luVCA9IE1hdGguc3FydCgxIC0gY29zVCAqIGNvc1QpLFxyXG4gICAgICAgIHBsZW4gPSBEaXN0ICogc2luVCxcclxuICAgICAgICBjb3NQID0gKHJuZC5jYW0ubG9jLnogLSBybmQuY2FtLmF0LnopIC8gcGxlbixcclxuICAgICAgICBzaW5QID0gKHJuZC5jYW0ubG9jLnggLSBybmQuY2FtLmF0LngpIC8gcGxlbixcclxuICAgICAgICBhemltdXRoID0gUjJEKE1hdGguYXRhbjIoc2luUCwgY29zUCkpLFxyXG4gICAgICAgIGVsZXZhdG9yID0gUjJEKE1hdGguYXRhbjIoc2luVCwgY29zVCkpO1xyXG4gXHJcbiAgICAgIGF6aW11dGggKz0gcm5kLnRpbWVyLmdsb2JhbERlbHRhVGltZSAqIDMgKlxyXG4gICAgICAgICgtMzAgKiB0aGlzLm1CdXR0b25zWzBdICogdGhpcy5tRHggK1xyXG4gICAgICAgICA0NyAqICh0aGlzLmtleXNbXCJBcnJvd0xlZnRcIl0gLSB0aGlzLmtleXNbXCJBcnJvd1JpZ2h0XCJdKSk7XHJcbiBcclxuICAgICAgZWxldmF0b3IgKz0gcm5kLnRpbWVyLmdsb2JhbERlbHRhVGltZSAqIDIgKlxyXG4gICAgICAgICgtMzAgKiB0aGlzLm1CdXR0b25zWzBdICogdGhpcy5tRHkgK1xyXG4gICAgICAgICA0NyAqICh0aGlzLmtleXNbXCJBcnJvd1VwXCJdIC0gdGhpcy5rZXlzW1wiQXJyb3dEb3duXCJdKSk7XHJcbiAgICAgIGlmIChlbGV2YXRvciA8IDAuMDgpXHJcbiAgICAgICAgZWxldmF0b3IgPSAwLjA4O1xyXG4gICAgICBlbHNlIGlmIChlbGV2YXRvciA+IDE3OC45MClcclxuICAgICAgICBlbGV2YXRvciA9IDE3OC45MDtcclxuIFxyXG4gICAgICBEaXN0ICs9IHJuZC50aW1lci5nbG9iYWxEZWx0YVRpbWUgKiAoMSArIHRoaXMuc2hpZnRLZXkgKiAxOCkgKlxyXG4gICAgICAgICg4ICogdGhpcy5tRHogK1xyXG4gICAgICAgICA4ICogKHRoaXMua2V5c1tcIlBhZ2VVcFwiXSAtIHRoaXMua2V5c1tcIlBhZ2VEb3duXCJdKSk7XHJcbiAgICAgIGlmIChEaXN0IDwgMC4xKVxyXG4gICAgICAgIERpc3QgPSAwLjE7XHJcbiBcclxuICAgICAgLyogSGFuZGxlIGNhbWVyYSBwb3NpdGlvbiAqL1xyXG4gICAgICBpZiAodGhpcy5tQnV0dG9uc1syXSkge1xyXG4gICAgICAgIGxldCBXcCA9IHJuZC5jYW0ucHJvalNpemU7XHJcbiAgICAgICAgbGV0IEhwID0gcm5kLmNhbS5wcm9qU2l6ZTtcclxuICAgICAgICBpZiAocm5kLmNhbS5mcmFtZVcgPiBybmQuY2FtLmZyYW1lSClcclxuICAgICAgICAgIFdwICo9IHJuZC5jYW0uZnJhbWVXIC8gcm5kLmNhbS5mcmFtZUg7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgSHAgKj0gcm5kLmNhbS5mcmFtZUggLyBybmQuY2FtLmZyYW1lVztcclxuICAgICAgICBsZXQgc3ggPSAtdGhpcy5tRHggKiBXcCAvIHJuZC5jYW0uZnJhbWVXICogRGlzdCAvIHJuZC5jYW0ucHJvakRpc3Q7XHJcbiAgICAgICAgbGV0IHN5ID0gdGhpcy5tRHkgKiBIcCAvIHJuZC5jYW0uZnJhbWVIICogRGlzdCAvIHJuZC5jYW0ucHJvakRpc3Q7XHJcbiBcclxuICAgICAgICBsZXQgZHYgPSBybmQuY2FtLnJpZ2h0Lm11bE51bShzeCkuYWRkKHJuZC5jYW0udXAubXVsTnVtKHN5KSk7XHJcbiAgICAgICAgcm5kLmNhbS5hdCA9IHJuZC5jYW0uYXQuYWRkKGR2KTtcclxuICAgICAgICBybmQuY2FtLmxvYyA9IHJuZC5jYW0ubG9jLmFkZChkdik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBsb2MgPSBtYXQ0KCkubWF0clJvdGF0ZShlbGV2YXRvciwgdmVjMygxLCAwLCAwKSkubWF0ck11bE1hdHIyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgbWF0NCgpLm1hdHJSb3RhdGUoYXppbXV0aCwgdmVjMygwLCAxLCAwKSkubWF0ck11bE1hdHIyKCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0NCgpLm1hdHJUcmFuc2xhdGUocm5kLmNhbS5hdCkpKS50cmFuc2Zvcm1Qb2ludCh2ZWMzKDAsIERpc3QsIDApKVxyXG4gICAgICAvKiBTZXR1cCByZXN1bHQgY2FtZXJhICovXHJcbiAgICAgIHJuZC5jYW0gPSBybmQuY2FtLmNhbVNldChsb2MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcm5kLmNhbS5hdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWMzKDAsIDEsIDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgbWF0clJvdGF0ZShhemltdXRoLCB2ZWMzKDAsIDEsIDApKS5tYXRyTXVsTWF0cjIoIFxyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICBtYXRyVHJhbnNsYXRlKHJuZC5jYW0uYXQpKSkudHJhbnNmb3JtUG9pbnQodmVjMygwLCBEaXN0LCAwKSksXHJcbiAgICAgIC8vICAgICAgICAgICBybmQuY2FtLmF0LFxyXG4gICAgICAvLyAgICAgICAgICAgdmVjMygwLCAxLCAwKVxyXG4gICAgICAvLyAgICAgICAgICAgKTtcclxuICAgIH1cclxuICB9IC8vIEVuZCBvZiAncmVzcG9uc2XRgUNhbWVyYScgZnVuY3Rpb25cclxufSAvLyBFbmQgb2YgJ2lucHV0JyBjbGFzc1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlucHV0X2luaXQocm5kKSB7XHJcbiAgICByZXR1cm4gbmV3IGlucHV0KHJuZCk7XHJcbn0iLCJpbXBvcnQgeyBwcmltQ3JlYXRlIH0gZnJvbSBcIi4uL3ByaW1zL3ByaW0uanNcIjtcclxuaW1wb3J0IHsgbWF0NCB9IGZyb20gXCIuLi9tdGgvbWF0NC5qc1wiO1xyXG5pbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4uL210aC92ZWMzLmpzXCI7XHJcbmltcG9ydCB7IHRpbWVyIH0gZnJvbSBcIi4uL3RpbWUvdGltZXIuanNcIjtcclxuaW1wb3J0IHsgaW5wdXRfaW5pdCB9IGZyb20gXCIuLi9tdGgvaW5wdXQuanNcIjtcclxuXHJcbmNsYXNzIF9yZW5kZXIge1xyXG4gIGNvbnN0cnVjdG9yKGNhbnZhcywgbmFtZSwgY2FtZXJhKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XHJcbiAgICB0aGlzLmdsLmVuYWJsZSh0aGlzLmdsLkRFUFRIX1RFU1QpO1xyXG4gICAgdGhpcy5nbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjEsIDEpO1xyXG4gICAgLy90aGlzLnByZyA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgdGhpcy50aW1lciA9IHRpbWVyKCk7XHJcbiAgICB0aGlzLnByaW1zID0gW107XHJcbiAgICB0aGlzLmlucHV0ID0gaW5wdXRfaW5pdCh0aGlzKTtcclxuICAgIHRoaXMuY2FtID0gY2FtZXJhO1xyXG4gIFxyXG4gICAgdGhpcy5nbC5lbmFibGUodGhpcy5nbC5CTEVORCk7XHJcbiAgICB0aGlzLmdsLmJsZW5kRnVuYyh0aGlzLmdsLlNSQ19BTFBIQSwgdGhpcy5nbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcclxuICB9XHJcblxyXG4gIHByaW1BdHRhY2gobmFtZSwgdHlwZSwgbXRsLCBwb3MsIHNpZGUgPSAzKSB7XHJcbiAgICBsZXQgcCA9IHByaW1DcmVhdGUobmFtZSwgdHlwZSwgbXRsLCBwb3MsIHNpZGUsIHRoaXMuZ2wpO1xyXG4gICAgdGhpcy5wcmltc1t0aGlzLnByaW1zLmxlbmd0aF0gPSBwO1xyXG4gICAgcmV0dXJuIHA7XHJcbiAgfVxyXG5cclxuICBwcm9ncmFtVW5pZm9ybXMoc2hkKSB7XHJcbiAgICBpZiAoc2hkLnVuaWZvcm1zW1wibWF0clZpZXdcIl0gIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vbGV0IG0gPSBtYXQ0KCkubWF0clZpZXcodmVjMyg1LCAzLCA1KSwgdmVjMygwLCAwLCAwKSwgdmVjMygwLCAxLCAwKSk7XHJcbiAgICAgIGxldCBhcnIgPSB0aGlzLmNhbS5tYXRyVmlldy50b0FycmF5KCk7XHJcbiAgICAgIGxldCBtVkxvYyA9IHNoZC51bmlmb3Jtc1tcIm1hdHJWaWV3XCJdLmxvYztcclxuICAgICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KG1WTG9jLCBmYWxzZSwgYXJyKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2hkLnVuaWZvcm1zW1wibWF0clByb2pcIl0gIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vbGV0IG0xID0gbWF0NCgpLm1hdHJGcnVzdHVtKC0wLjA4LCAwLjA4LCAtMC4wOCwgMC4wOCwgMC4xLCAyMDApO1xyXG4gICAgICBsZXQgYXJyMSA9IHRoaXMuY2FtLm1hdHJQcm9qLnRvQXJyYXkoKTtcclxuICAgICAgbGV0IG1QTG9jID0gc2hkLnVuaWZvcm1zW1wibWF0clByb2pcIl0ubG9jO1xyXG4gICAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobVBMb2MsIGZhbHNlLCBhcnIxKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHRyYW5zZm9ybVByb2dyYW1Vbmlmb3JtcyhzaGQpIHtcclxuICAgIGlmIChzaGQudW5pZm9ybXNbXCJUaW1lXCJdID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgbGV0IHRpbWVMb2MgPSBzaGQudW5pZm9ybXNbXCJUaW1lXCJdLmxvYztcclxuXHJcbiAgICB0aGlzLmdsLnVuaWZvcm0xZih0aW1lTG9jLCB0aGlzLnRpbWVyLmdsb2JhbFRpbWUpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCkge1xyXG4gICAgdGhpcy5nbC5jbGVhcih0aGlzLmdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG4gICAgdGhpcy5nbC5jbGVhcih0aGlzLmdsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgdGhpcy50aW1lci5yZXNwb25zZSgpO1xyXG4gICAgdGhpcy5pbnB1dC5yZXNwb25zZUNhbWVyYSh0aGlzKTtcclxuICAgIHRoaXMuaW5wdXQucmVzZXQoKTtcclxuICAgIGZvciAoY29uc3QgcCBvZiB0aGlzLnByaW1zKSB7XHJcbiAgICAgIGlmIChwLm10bC5zaGFkZXIuaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgcC5tdGwuc2hhZGVyLnNoYWRlcnNbMF0uaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgcC5tdGwuc2hhZGVyLnNoYWRlcnNbMV0uaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgcC5zaGRJc0xvYWRlZCA9PSBudWxsKSB7XHJcbiAgICAgICAgcC5tdGwuYXBwbHkoKTtcclxuICAgICAgICB0aGlzLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGFkZXIpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtUHJvZ3JhbVVuaWZvcm1zKHAubXRsLnNoYWRlcik7XHJcblxyXG4gICAgICAgIGlmIChwLm10bC5zaGFkZXIudW5pZm9ybXNbXCJJc0VhcnRoXCJdID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIGxldCBrID0gMDtcclxuICAgICAgICBpZiAocC5uYW1lID09IFwiRWFydGhcIikgayA9IDE7XHJcbiAgICAgICAgbGV0IG1XTG9jID0gcC5tdGwuc2hhZGVyLnVuaWZvcm1zW1wiSXNFYXJ0aFwiXS5sb2M7XHJcbiAgICAgICAgdGhpcy5nbC51bmlmb3JtMWYobVdMb2MsIGspO1xyXG5cclxuICAgICAgICAvL2lmIChwLm5hbWUgPT0gXCJDbG91ZHNcIikgc2V0SW50ZXJ2YWwoKCkgPT4ge30sIDEwMDAwKTtcclxuICAgICAgICBwLnJlbmRlcih0aGlzLnRpbWVyKTtcclxuICAgICAgICBwLnNoZElzTG9hZGVkID0gMTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHAuc2hkSXNMb2FkZWQgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICBwLm10bC5hcHBseSgpO1xyXG4gICAgICB0aGlzLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGFkZXIpO1xyXG5cclxuICAgICAgaWYgKHAubXRsLnNoYWRlci51bmlmb3Jtc1tcIklzRWFydGhcIl0gPT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgIGxldCBrID0gMDtcclxuICAgICAgaWYgKHAubmFtZSA9PSBcIkVhcnRoXCIpIGsgPSAxO1xyXG4gICAgICBsZXQgbVdMb2MgPSBwLm10bC5zaGFkZXIudW5pZm9ybXNbXCJJc0VhcnRoXCJdLmxvYztcclxuICAgICAgdGhpcy5nbC51bmlmb3JtMWYobVdMb2MsIGspO1xyXG5cclxuICAgICAgdGhpcy50cmFuc2Zvcm1Qcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hhZGVyKTtcclxuICAgICAgcC5yZW5kZXIodGhpcy50aW1lcik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ3JlYXRlKGNhbnZhcywgbmFtZSwgY2FtZXJhKSB7XHJcbiAgcmV0dXJuIG5ldyBfcmVuZGVyKGNhbnZhcywgbmFtZSwgY2FtZXJhKTtcclxufVxyXG4iLCJpbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4vdmVjMy5qc1wiO1xyXG5pbXBvcnQgeyBtYXQ0IH0gZnJvbSBcIi4vbWF0NC5qc1wiO1xyXG5cclxuY2xhc3MgX2NhbWVyYSB7XHJcbiAgY29uc3RydWN0b3IodywgaCkge1xyXG4gICAgdGhpcy5hdCA9IHZlYzMoMCwgMCwgMCk7XHJcbiAgICB0aGlzLmxvYyA9IHZlYzMoNSwgNSwgNSk7XHJcbiAgICB0aGlzLnVwID0gdmVjMygwLCAxLCAwKTtcclxuICAgICh0aGlzLm1hdHJWaWV3ID0gbnVsbCksICh0aGlzLm1hdHJWUCA9IG51bGwpO1xyXG4gICAgKHRoaXMuZGlyID0gbnVsbCksICh0aGlzLnJpZ2h0ID0gbnVsbCk7XHJcbiAgICBpZiAoaCA9PSB1bmRlZmluZWQpIGggPSB3O1xyXG4gICAgKHRoaXMuZnJhbWVXID0gdyksICh0aGlzLmZyYW1lSCA9IGgpO1xyXG4gIH1cclxuXHJcbiAgY2FtU2V0KGxvYywgYXQsIHVwKSB7XHJcbiAgICBpZiAobG9jID09IHVuZGVmaW5lZCkgbG9jID0gdGhpcy5sb2M7XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5sb2MgPSBsb2M7XHJcbiAgICB9XHJcbiAgICBpZiAoYXQgPT0gdW5kZWZpbmVkKSBhdCA9IHRoaXMuYXQ7XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5hdCA9IGF0O1xyXG4gICAgfVxyXG4gICAgaWYgKHVwID09IHVuZGVmaW5lZCkgdXAgPSB0aGlzLnVwO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMudXAgPSB1cDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1hdHJWaWV3ID0gbWF0NCgpLm1hdHJWaWV3KGxvYywgYXQsIHVwKTtcclxuXHJcbiAgICB0aGlzLnJpZ2h0ID0gdmVjMyhcclxuICAgICAgdGhpcy5tYXRyVmlldy5hWzBdWzBdLFxyXG4gICAgICB0aGlzLm1hdHJWaWV3LmFbMV1bMF0sXHJcbiAgICAgIHRoaXMubWF0clZpZXcuYVsyXVswXVxyXG4gICAgKTtcclxuICAgIHRoaXMudXAgPSB2ZWMzKFxyXG4gICAgICB0aGlzLm1hdHJWaWV3LmFbMF1bMV0sXHJcbiAgICAgIHRoaXMubWF0clZpZXcuYVsxXVsxXSxcclxuICAgICAgdGhpcy5tYXRyVmlldy5hWzJdWzFdXHJcbiAgICApO1xyXG4gICAgdGhpcy5kaXIgPSB2ZWMzKFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzBdWzJdLFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzFdWzJdLFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzJdWzJdXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBjYW1TZXRQcm9qKHByb2pTaXplLCBQcm9qRGlzdCwgUHJvakZhckNsaXApIHtcclxuICAgIGxldCByeCwgcnk7XHJcblxyXG4gICAgdGhpcy5wcm9qRGlzdCA9IFByb2pEaXN0O1xyXG4gICAgdGhpcy5wcm9qRmFyQ2xpcCA9IFByb2pGYXJDbGlwO1xyXG4gICAgcnggPSByeSA9IHRoaXMucHJvalNpemUgPSBwcm9qU2l6ZTtcclxuXHJcbiAgICAvKiBDb3JyZWN0IGFzcGVjdCByYXRpbyAqL1xyXG4gICAgaWYgKHRoaXMuZnJhbWVXID49IHRoaXMuZnJhbWVIKSByeCAqPSB0aGlzLmZyYW1lVyAvIHRoaXMuZnJhbWVIO1xyXG4gICAgZWxzZSByeSAqPSB0aGlzLmZyYW1lSCAvIHRoaXMuZnJhbWVXO1xyXG5cclxuICAgIHRoaXMud3AgPSByeDtcclxuICAgIHRoaXMuaHAgPSByeTtcclxuICAgIHRoaXMubWF0clByb2ogPSBtYXQ0KCkubWF0ckZydXN0dW0oXHJcbiAgICAgIC1yeCAvIDIsXHJcbiAgICAgIHJ4IC8gMixcclxuICAgICAgLXJ5IC8gMixcclxuICAgICAgcnkgLyAyLFxyXG4gICAgICB0aGlzLnByb2pEaXN0LFxyXG4gICAgICB0aGlzLnByb2pGYXJDbGlwXHJcbiAgICApO1xyXG4gICAgdGhpcy5tYXRyVlAgPSB0aGlzLm1hdHJWaWV3Lm1hdHJNdWxNYXRyMih0aGlzLm1hdHJQcm9qKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYW1lcmEodywgaCkge1xyXG4gIHJldHVybiBuZXcgX2NhbWVyYSh3LCBoKTtcclxufVxyXG4iLCJjbGFzcyBfaW1hZ2Uge1xyXG4gIGNvbnN0cnVjdG9yKGltZywgbmFtZSkge1xyXG4gICAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGltYWdlQ3JlYXRlKGltZywgbmFtZSkge1xyXG4gIHJldHVybiBuZXcgX2ltYWdlKGltZywgbmFtZSk7XHJcbn1cclxuXHJcbmNsYXNzIF90ZXh0dXJlIHtcclxuICBjb25zdHJ1Y3RvcihuYW1lVVJMLCB0ZXh0dXJlVHlwZSwgZ2wpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWVVUkwubmFtZTtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIGlmICh0ZXh0dXJlVHlwZSA9PSBcIjJkXCIpIHRoaXMudHlwZSA9IGdsLlRFWFRVUkVfMkQ7XHJcbiAgICBlbHNlICh0aGlzLnR5cGUgPSBudWxsKSwgY29uc29sZS5sb2coXCJ0ZXh0dXJlIHR5cGUgaXMgbm90IDJkXCIpO1xyXG4gICAgdGhpcy5pZCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudHlwZSwgdGhpcy5pZCk7XHJcbiAgICBpZiAobmFtZVVSTC5pbWcpIHtcclxuICAgICAgZ2wudGV4SW1hZ2UyRChcclxuICAgICAgICB0aGlzLnR5cGUsXHJcbiAgICAgICAgMCxcclxuICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgIDEsXHJcbiAgICAgICAgMSxcclxuICAgICAgICAwLFxyXG4gICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgZ2wuVU5TSUdORURfQllURSxcclxuICAgICAgICBuZXcgVWludDhBcnJheShbMjU1LCAyNTUsIDI1NSwgMF0pXHJcbiAgICAgICk7XHJcbiAgICAgIG5hbWVVUkwuaW1nLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnR5cGUsIHRoaXMuaWQpO1xyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xyXG4gICAgICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgICAgICB0aGlzLnR5cGUsXHJcbiAgICAgICAgICAwLFxyXG4gICAgICAgICAgZ2wuUkdCQSxcclxuICAgICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgICBnbC5VTlNJR05FRF9CWVRFLFxyXG4gICAgICAgICAgbmFtZVVSTC5pbWdcclxuICAgICAgICApO1xyXG4gICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKHRoaXMudHlwZSk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnR5cGUsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5SRVBFQVQpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50eXBlLCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuUkVQRUFUKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgdGhpcy50eXBlLFxyXG4gICAgICAgICAgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLFxyXG4gICAgICAgICAgZ2wuTElORUFSX01JUE1BUF9MSU5FQVJcclxuICAgICAgICApO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50eXBlLCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhcHBseShpLCBzaGQsIHRleCkge1xyXG4gICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRTAgKyBpKTtcclxuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGV4LnR5cGUsIHRleC5pZCk7XHJcblxyXG4gICAgaWYgKHNoZC51bmlmb3Jtc1tcImVhcnRoVGV4XCJdID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgbGV0IHRleExvYyA9IHNoZC51bmlmb3Jtc1tcImVhcnRoVGV4XCJdLmxvYztcclxuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHRleExvYywgaSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGV4dHVyZSh1cmwsIHR5cGUsIGdsKSB7XHJcbiAgcmV0dXJuIG5ldyBfdGV4dHVyZSh1cmwsIHR5cGUsIGdsKTtcclxufVxyXG4iLCJpbXBvcnQgeyBzaGFkZXIgfSBmcm9tIFwiLi4vc2hkL3NoYWRlci5qc1wiO1xyXG5pbXBvcnQgeyB0ZXh0dXJlIH0gZnJvbSBcIi4uL3RleHR1cmUvdGV4LmpzXCI7XHJcblxyXG5jbGFzcyBfbWF0ZXJpYWwge1xyXG4gIGNvbnN0cnVjdG9yKHNoZF9uYW1lLCB1Ym8sIGdsKSB7XHJcbiAgICB0aGlzLnNoYWRlciA9IHNoYWRlcihzaGRfbmFtZSwgZ2wpO1xyXG4gICAgdGhpcy51Ym8gPSB1Ym87XHJcbiAgICB0aGlzLnRleHR1cmVzID0gW107XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgfVxyXG5cclxuICB0ZXh0dXJlQXR0YWNoKHVybCwgdHlwZSA9IFwiMmRcIikge1xyXG4gICAgdGhpcy50ZXh0dXJlc1t0aGlzLnRleHR1cmVzLmxlbmd0aF0gPSB0ZXh0dXJlKHVybCwgdHlwZSwgdGhpcy5nbCk7XHJcbiAgfVxyXG5cclxuICBhcHBseSgpIHtcclxuICAgIGlmICh0aGlzLnNoYWRlci5pZCA9PSBudWxsKSByZXR1cm47XHJcbiAgICB0aGlzLnNoYWRlci5hcHBseSgpO1xyXG5cclxuICAgIGZvciAobGV0IHQgPSAwOyB0IDwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7IHQrKylcclxuICAgICAgaWYgKHRoaXMudGV4dHVyZXNbdF0gIT0gbnVsbClcclxuICAgICAgICB0aGlzLnRleHR1cmVzW3RdLmFwcGx5KHQsIHRoaXMuc2hhZGVyLCB0aGlzLnRleHR1cmVzW3RdKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtdGwoc2hkLCB1Ym8sIGdsKSB7XHJcbiAgcmV0dXJuIG5ldyBfbWF0ZXJpYWwoc2hkLCB1Ym8sIGdsKTtcclxufVxyXG4iLCJpbXBvcnQgeyByZW5kZXJDcmVhdGUgfSBmcm9tIFwiLi9yZW5kZXIvcmVuZGVyLmpzXCI7XHJcbmltcG9ydCB7IHZlYzMgfSBmcm9tIFwiLi9tdGgvdmVjMy5qc1wiO1xyXG5pbXBvcnQgeyBjYW1lcmEgfSBmcm9tIFwiLi9tdGgvY2FtZXJhLmpzXCI7XHJcbmltcG9ydCB7IG10bCB9IGZyb20gXCIuL21hdGVyaWFsL210bC5qc1wiO1xyXG5pbXBvcnQgeyBpbWFnZUNyZWF0ZSB9IGZyb20gXCIuL3RleHR1cmUvdGV4LmpzXCI7XHJcblxyXG5sZXQgcm5kMTtcclxuXHJcbi8vIE9wZW5HTCBpbml0aWFsaXphdGlvblxyXG5leHBvcnQgZnVuY3Rpb24gaW5pdEdMKCkge1xyXG4gIGxldCBjYW52YXMxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXMxXCIpO1xyXG4gIGxldCBjYW1lcmExID0gY2FtZXJhKGNhbnZhczEuY2xpZW50V2lkdGgsIGNhbnZhczEuY2xpZW50SGVpZ2h0KVxyXG4gICAgLmNhbVNldCh2ZWMzKDUsIDYsIDUpKVxyXG4gICAgLmNhbVNldFByb2ooMC4xLCAwLjEsIDMwMCk7XHJcblxyXG4gIHJuZDEgPSByZW5kZXJDcmVhdGUoY2FudmFzMSwgXCJlYXJ0aFwiLCBjYW1lcmExKTtcclxuICByZXR1cm4gcm5kMTtcclxuICAvL2ZvciAoY29uc3QgcCBvZiBybmQucHJpbXMpIHJuZC5wcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hkKTtcclxufSAvLyBFbmQgb2YgJ2luaXRHTCcgZnVuY3Rpb25cclxuXHJcbi8vIFJlbmRlciBmdW5jdGlvblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gIHJuZDEucmVuZGVyKCk7XHJcbn1cclxuXHJcbmNvbnNvbGUubG9nKFwibGlicmFyeS5qcyB3YXMgaW1wb3J0ZWRcIik7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xyXG5cclxuICBpbml0R0woKTtcclxuXHJcbiAgbGV0IG10bDEgPSBtdGwoXCJlYXJ0aFwiLCBudWxsLCBybmQxLmdsKTtcclxuICBsZXQgbXRsMiA9IG10bChcImVhcnRoXCIsIG51bGwsIHJuZDEuZ2wpO1xyXG4gIGxldCBtdGwzID0gbXRsKFwiZGVmYXVsdFwiLCBudWxsLCBybmQxLmdsKTtcclxuXHJcbiAgbGV0IGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gIGltZy5zcmMgPSBcImVhcnRoLmpwZWdcIjtcclxuICBsZXQgbmFtZVVSTCA9IGltYWdlQ3JlYXRlKGltZywgXCJlYXJ0aFwiKTtcclxuICBtdGwxLnRleHR1cmVBdHRhY2gobmFtZVVSTCk7XHJcblxyXG4gIC8vbGV0IGltZzEgPSBuZXcgSW1hZ2UoKTtcclxuICAvL2ltZzEuc3JjID0gXCJjbG91ZHMxLnBuZ1wiO1xyXG4gIC8vbGV0IG5hbWVVUkwxID0gaW1hZ2VDcmVhdGUoaW1nMSwgXCJjbG91ZHNcIik7XHJcbiAgLy9tdGwyLnRleHR1cmVBdHRhY2gobmFtZVVSTDEpO1xyXG5cclxuICAvL3JuZDEucHJpbUF0dGFjaChcIkN1YmVcIiwgXCJjdWJlXCIsIG10bDMsIHZlYzMoMSwgMCwgMCksIDIpO1xyXG4gIHJuZDEucHJpbUF0dGFjaChcIkVhcnRoXCIsIFwiZWFydGhcIiwgbXRsMSwgdmVjMygwLCAyLCAwKSwgMik7XHJcbiAgbGV0IGNsb3VkID0gcm5kMS5wcmltQXR0YWNoKFwiQ2xvdWRzXCIsIFwiZWFydGhcIiwgbXRsMiwgdmVjMygwLCAyLCAwKSwgNSk7XHJcblxyXG4gIGxldCB4ID0gMCwgeSA9IDA7XHJcblxyXG4gIHNldEludGVydmFsKCgpID0+IHtcclxuICAgIGlmIChjbG91ZC5WQnVmLmlkKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBsYiR7eH06JHt5fWApO1xyXG4gICAgICBzdG9yZUdlb0RhdGEoY2xvdWQsIHgsIHkpO1xyXG4gICAgICB4Kys7XHJcbiAgICAgIGlmICh4ID49IGNsb3VkLncpIHtcclxuICAgICAgICB4ID0gMDtcclxuICAgICAgICB5Kys7XHJcbiAgICAgICAgaWYgKHkgPj0gY2xvdWQuaClcclxuICAgICAgICAgIHkgPSAwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgMTApO1xyXG5cclxuICBjb25zdCBkcmF3ID0gKCkgPT4ge1xyXG4gICAgLypcclxuICAgIHJuZDEuZ2wuYmluZEJ1ZmZlcihybmQxLmdsLkFSUkFZX0JVRkZFUiwgY2xvdWQuVkJ1Zi5pZCk7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGNsb3VkLnc7IHgrKykge1xyXG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNsb3VkLmg7IHkrKykge1xyXG4gICAgICAgIGxldCB4MSA9IDEsIHkxID0gMSwgIG9mZnNldCA9ICh5ICogY2xvdWQudyArIHgpICogMTY7XHJcbiAgICAgICAgcm5kMS5nbC5idWZmZXJTdWJEYXRhKHJuZDEuZ2wuQVJSQVlfQlVGRkVSLCBvZmZzZXQgKyAxMiwgbmV3IEZsb2F0MzJBcnJheShbMTBdKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHIgKz0gMS44O1xyXG4gICAgaWYgKHIgPiAxMDApXHJcbiAgICAgIHIgPSAwO1xyXG4gICAgKi9cclxuICAgIHJlbmRlcigpO1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhdyk7XHJcbiAgfTtcclxuICBkcmF3KCk7XHJcbn0pO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEdlb0RhdGEobGF0LCBsb24pIHtcclxuICBjb25zdCByZXEgPSBgaHR0cHM6Ly9hcGkub3BlbndlYXRoZXJtYXAub3JnL2RhdGEvMi41L3dlYXRoZXI/bGF0PSR7bGF0fSZsb249JHtsb259JmFwcGlkPWZhNzk0YTBmY2VhNWU4Y2Q3YjdlMzNhMGQ1ZDc2ZmE0YDtcclxuICBsZXQgcmVxdWVzdCA9IGF3YWl0IGZldGNoKHJlcSk7XHJcbiAgbGV0IGRhdGEgPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTtcclxuICByZXR1cm4gZGF0YS5jbG91ZHMuYWxsO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVHZW9EYXRhKGNsb3VkLCB4LCB5KSB7XHJcbiAgbGV0IGxhdCA9IHkgKiAxODAgLyAoY2xvdWQuaCAtIDEpIC0gOTAsIGxvbiA9IHggKiAzNjAgLyAoY2xvdWQudyAtIDEpIC0gMTgwO1xyXG4gIGNvbnN0IHJlcSA9IGBodHRwczovL2FwaS5vcGVud2VhdGhlcm1hcC5vcmcvZGF0YS8yLjUvd2VhdGhlcj9sYXQ9JHtsYXR9Jmxvbj0ke2xvbn0mYXBwaWQ9ZmE3OTRhMGZjZWE1ZThjZDdiN2UzM2EwZDVkNzZmYTRgO1xyXG5cclxuICBsZXQgcmVxdWVzdCA9IGF3YWl0IGZldGNoKHJlcSk7XHJcbiAgbGV0IGRhdGEgPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTtcclxuICBsZXQgciA9IGRhdGEuY2xvdWRzLmFsbDtcclxuXHJcbiAgY29uc29sZS5sb2coYGxiJHtsYXR9OiR7bG9ufS0+JHtyfWApO1xyXG5cclxuICBybmQxLmdsLmJpbmRCdWZmZXIocm5kMS5nbC5BUlJBWV9CVUZGRVIsIGNsb3VkLlZCdWYuaWQpO1xyXG4gIGxldCBvZmZzZXQgPSAoeSAqIGNsb3VkLncgKyB4KSAqIDE2O1xyXG4gIHJuZDEuZ2wuYnVmZmVyU3ViRGF0YShybmQxLmdsLkFSUkFZX0JVRkZFUiwgb2Zmc2V0ICsgMTIsIG5ldyBGbG9hdDMyQXJyYXkoW3JdKSk7XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztFQUFBLE1BQU0sT0FBTyxDQUFDO0VBQ2QsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7RUFDOUIsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0VBQ3JCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7RUFDbkIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztFQUNqQixJQUFJLElBQUksSUFBSSxJQUFJLENBQUMs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RUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtFQUM1RCxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7RUFDaEU7RUFDQTtFQUNBO0VBQ0EsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN6QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3pCLE1BQU0sSUFBSSxJQUFJLElBQUksT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDakMsV0FBVztFQUNYLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNkLE9BQU87RUFDUCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDZixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDZixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdkMsS0FBSztFQUNMLEdBQUc7QUFDSDtFQUNBLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUM3QyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUN4RDtFQUNBLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDakMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0VBQ3RCLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDbkMsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDaEQsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDM0MsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ3ZELFdBQVcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwRDtFQUNBLE1BQU0sQ0FBQyxFQUFFLENBQUM7RUFDVixLQUFLO0VBQ0wsR0FBRztBQUNIO0VBQ0EsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDO0VBQ1gsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMs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Q0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdEQsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLEdBQUcsR0FBRztFQUNSLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUM3QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0VBQ3pDLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxTQUFTLEdBQUc7RUFDZCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0I7RUFDQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQzFDLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN2QyxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRTtFQUNmLElBQUksT0FBTyxJQUFJLEtBQUs7RUFDcEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEUsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEUsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEUsS0FBSyxDQUFDO0VBQ04sR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUU7RUFDakIsSUFBSSxJQUFJLENBQUM7RUFDVCxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0U7RUFDQSxJQUFJLE9BQU8sSUFBSSxLQUFLO0VBQ3BCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDOUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUM5RSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQzlFLEtBQUssQ0FBQztFQUNOLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0VBQ1gsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDakMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNqQyxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtFQUNwQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSztFQUNyQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDM0UsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMs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QyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRTtFQUN2QixJQUFJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDbEQsR0FBRztBQUNIO0VBQ0EsRUFBRSxXQUFXLEdBQUc7RUFDaEIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0VBQ3hCLElBQUksSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCO0VBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDM0I7RUFDQTtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFO0VBQ3ZCLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLGtCQUFrQixHQUFHLEdBQUc7RUFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QjtFQUNBLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNO0VBQ04sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDL0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNO0VBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMvQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNO0VBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQy9CLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNLENBQUMsQ0FBQyxFQUFF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QUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdkQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNuRCxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFdBQVcsQ0FBQyxhQUFhLEVBQUU7RUFDN0IsSUFBSSxJQUFJLENBQUMsR0FBRyxhQUFhLEdBQUcsa0JBQWtC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QUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUM5QixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM1QixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM1QixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDckUsS0FBSyxDQUFDO0VBQ04sSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7RUFDSDtFQUNBLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtFQUNwQixJQUFJLElBQUksRUFBRSxHQUFHLElBQUk7RUFDakIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqRixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pGLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakYsS0FBSyxDQUFDO0FBQ047RUFDQSxJQUFJLE9BQU8sRUFBRSxDQUFDO0VBQ2QsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0VBQ3BFLEVBQUU7RUFDRixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztFQUNuQixJQUFJO0VBQ0osQ0FBQztBQUNEO0VBQ0EsU0FBUyxVQUFVLENBQUMsQ0FBQyxFQUFFO0VBQ3ZCLEVBQUUsSUFBSSxDQUFDO0VBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixPQUFPO0VBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2QsTUFBTSxhQUFhO0VBQ25CLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLE9BQU87RUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDZCxNQUFNLGFBQWE7RUFDbkIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsT0FBTztFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIs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Q0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUQsTUFBTSxJQUFJLElBQUksR0FBRyxHQUFHO0VBQ3BCLFFBQVEsSUFBSSxHQUFHLEdBQUcsQ0FBQztFQUNuQjtFQUNBO0VBQ0EsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7RUFDNUIsUUFBUSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztFQUNsQyxRQUFRLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQ2xDLFFBQVEsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU07RUFDM0MsVUFBVSxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7RUFDaEQ7RUFDQSxVQUFVLEVBQUUsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztFQUNoRCxRQUFRLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQzNFLFFBQVEsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0VBQzFFO0VBQ0EsUUFBUSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3JFLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3hDLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzFDLE9BQU87QUFDUDtFQUNBLE1BQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVk7RUFDdkUsc0JBQXNCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO0VBQzVFLHdCQUF3QixJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFDO0VBQzNGO0VBQ0EsTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUc7RUFDbEMsMEJBQTBCLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUNwQywwQkFBMEIsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3ZDLDJCQUEyQixDQUFDO0VBQzVCO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxLQUFLO0VBQ0wsR0FBRztFQUNILENBQUM7QUFDRDtFQUNPLFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRTtFQUNoQyxJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDMUI7O0VDaFdBLE1BQU0sT0FBTyxDQUFDO0VBQ2QsRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7RUFDcEMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztFQUN6QixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0VBQ3JCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0VBQzFDLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztFQUN2QyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3pDO0VBQ0EsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssRUFBRSxDQUFDO0VBQ3pCLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7RUFDcEIsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNsQyxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO0VBQ3RCO0VBQ0EsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ2xDLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0VBQ3RFLEdBQUc7QUFDSDtFQUNBLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFO0VBQzdDLElBQUksSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzVELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUN0QyxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0EsRUFBRSxlQUFlLENBQUMsR0FBRyxFQUFFO0VBQ3ZCLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLFNBQVMsRUFBRTtFQUMvQztFQUNBLE1BQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7RUFDNUMsTUFBTSxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUMvQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztFQUNsRCxLQUFLO0FBQ0w7RUFDQSxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxTQUFTLEVBQUU7RUFDL0M7RUFDQSxNQUFNLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0VBQzdDLE1BQU0sSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDL0MsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDbkQsS0FBSztFQUNMLEdBQUc7QUFDSDtFQUNBLEVBQUUsd0JBQXdCLENBQUMsR0FBRyxFQUFFO0VBQ2hDLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRSxPQUFPO0VBQ2xELElBQUksSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDM0M7RUFDQSxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0VBQ3RELEdBQUc7QUFDSDtFQUNBLEVBQUUsTUFBTSxHQUFHO0VBQ1gsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUM7RUFDNUMsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUM7RUFDNUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0VBQzFCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDcEMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQ3ZCLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0VBQ2hDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksSUFBSTtFQUNqQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBSTtFQUM1QyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBSTtFQUM1QyxVQUFVLENBQUMsQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO0VBQ2pDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUN0QixRQUFRLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUMzQyxRQUFRLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BEO0VBQ0EsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLEVBQUUsT0FBTztFQUNsRSxRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNsQixRQUFRLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNyQyxRQUFRLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDekQsUUFBUSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEM7RUFDQTtFQUNBLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDN0IsUUFBUSxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztFQUMxQixRQUFRLE9BQU87RUFDZixPQUFPO0VBQ1AsTUFBTSxJQUFJLENBQUMsQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFLE9BQU87RUFDeEMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQ3BCLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDO0VBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLEVBQUUsT0FBTztFQUNoRSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNoQixNQUFNLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNuQyxNQUFNLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDdkQsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEM7RUFDQSxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ2xELE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDM0IsS0FBSztFQUNMLEdBQUc7RUFDSCxDQUFDO0FBQ0Q7RUFDTyxTQUFTLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtFQUNuRCxFQUFFLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztFQUMzQzs7RUM3RkEsTUFBTSxPQUFPLENBQUM7RUFDZCxFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ3BCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDN0IsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDO0VBQ2pELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO0VBQzNDLElBQUksSUFBSSxDQUFDLElBQUksU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDekMsR0FBRztBQUNIO0VBQ0EsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7RUFDdEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxTQUFTLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDekMsU0FBUztFQUNULE1BQU0sSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7RUFDckIsS0FBSztFQUNMLElBQUksSUFBSSxFQUFFLElBQUksU0FBUyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0VBQ3RDLFNBQVM7RUFDVCxNQUFNLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ25CLEtBQUs7RUFDTCxJQUFJLElBQUksRUFBRSxJQUFJLFNBQVMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztFQUN0QyxTQUFTO0VBQ1QsTUFBTSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztFQUNuQixLQUFLO0FBQ0w7RUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakQ7RUFDQSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSTtFQUNyQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixLQUFLLENBQUM7RUFDTixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSTtFQUNsQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQixLQUFLLENBQUM7RUFDTixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSTtFQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM1QixLQUFLLENBQUM7RUFDTixJQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2hCLEdBQUc7QUFDSDtFQUNBLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO0VBQzlDLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0FBQ2Y7RUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0VBQzdCLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7RUFDbkMsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ3ZDO0VBQ0E7RUFDQSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7RUFDcEUsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3pDO0VBQ0EsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztFQUNqQixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2pCLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxXQUFXO0VBQ3RDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQztFQUNiLE1BQU0sRUFBRSxHQUFHLENBQUM7RUFDWixNQUFNLENBQUMsRUFBRSxHQUFHLENBQUM7RUFDYixNQUFNLEVBQUUsR0FBRyxDQUFDO0VBQ1osTUFBTSxJQUFJLENBQUMsUUFBUTtFQUNuQixNQUFNLElBQUksQ0FBQyxXQUFXO0VBQ3RCLEtBQUssQ0FBQztFQUNOLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDNUQ7RUFDQSxJQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2hCLEdBQUc7RUFDSCxDQUFDO0FBQ0Q7RUFDTyxTQUFTLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQzdCLEVBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDM0I7O0VDN0VBLE1BQU0sTUFBTSxDQUFDO0VBQ2IsRUFBRSxXQUFXLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtFQUN6QixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0VBQ25CLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDckIsR0FBRztFQUNILENBQUM7QUFDRDtFQUNPLFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUU7RUFDdkMsRUFBRSxPQUFPLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztFQUMvQixDQUFDO0FBQ0Q7RUFDQSxNQUFNLFFBQVEsQ0FBQztFQUNmLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO0VBQ3hDLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0VBQzdCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDakIsSUFBSSxJQUFJLFdBQVcsSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO0VBQ3ZELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7RUFDbkUsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztFQUNqQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDdkMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7RUFDckIsTUFBTSxFQUFFLENBQUMsVUFBVTtFQUNuQixRQUFRLElBQUksQ0FBQyxJQUFJO0VBQ2pCLFFBQVEsQ0FBQztFQUNULFFBQVEsRUFBRSxDQUFDLElBQUk7RUFDZixRQUFRLENBQUM7RUFDVCxRQUFRLENBQUM7RUFDVCxRQUFRLENBQUM7RUFDVCxRQUFRLEVBQUUsQ0FBQyxJQUFJO0VBQ2YsUUFBUSxFQUFFLENBQUMsYUFBYTtFQUN4QixRQUFRLElBQUksVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDMUMsT0FBTyxDQUFDO0VBQ1IsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNO0VBQ2pDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUMzQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ3JELFFBQVEsRUFBRSxDQUFDLFVBQVU7RUFDckIsVUFBVSxJQUFJLENBQUMsSUFBSTtFQUNuQixVQUFVLENBQUM7RUFDWCxVQUFVLEVBQUUsQ0FBQyxJQUFJO0VBQ2pCLFVBQVUsRUFBRSxDQUFDLElBQUk7RUFDakIsVUFBVSxFQUFFLENBQUMsYUFBYTtFQUMxQixVQUFVLE9BQU8sQ0FBQyxHQUFHO0VBQ3JCLFNBQVMsQ0FBQztFQUNWLFFBQVEsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDckMsUUFBUSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDbEUsUUFBUSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDbEUsUUFBUSxFQUFFLENBQUMsYUFBYTtFQUN4QixVQUFVLElBQUksQ0FBQyxJQUFJO0VBQ25CLFVBQVUsRUFBRSxDQUFDLGtCQUFrQjtFQUMvQixVQUFVLEVBQUUsQ0FBQyxvQkFBb0I7RUFDakMsU0FBUyxDQUFDO0VBQ1YsUUFBUSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUN0RSxPQUFPLENBQUM7RUFDUixLQUFLO0VBQ0wsR0FBRztBQUNIO0VBQ0EsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7RUFDckIsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNoRCxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFDO0VBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksU0FBUyxFQUFFLE9BQU87RUFDdEQsSUFBSSxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUM5QyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNqQyxHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ08sU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7RUFDdkMsRUFBRSxPQUFPLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDckM7O0VDaEVBLE1BQU0sU0FBUyxDQUFDO0VBQ2hCLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO0VBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ3ZDLElBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7RUFDbkIsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztFQUN2QixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2pCLEdBQUc7QUFDSDtFQUNBLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFO0VBQ2xDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN0RSxHQUFHO0FBQ0g7RUFDQSxFQUFFLEtBQUssR0FBRztFQUNWLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxJQUFJLEVBQUUsT0FBTztFQUN2QyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7RUFDakQsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSTtFQUNsQyxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqRSxHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ08sU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7RUFDbEMsRUFBRSxPQUFPLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDckM7O0VDckJBLElBQUksSUFBSSxDQUFDO0FBQ1Q7RUFDQTtFQUNPLFNBQVMsTUFBTSxHQUFHO0VBQ3pCLEVBQUUsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztFQUNuRCxFQUFFLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUM7RUFDakUsS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDMUIsS0FBSyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQjtFQUNBLEVBQUUsSUFBSSxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0VBQ2pELEVBQUUsT0FBTyxJQUFJLENBQUM7RUFDZDtFQUNBLENBQUM7QUFDRDtFQUNBO0VBQ08sU0FBUyxNQUFNLEdBQUc7RUFDekIsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7RUFDaEIsQ0FBQztBQUNEO0VBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3ZDO0VBQ0EsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNO0FBQ3RDO0VBQ0EsRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUNYO0VBQ0EsRUFBRSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDekMsRUFBRSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDekMsRUFBYSxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO0FBQzNDO0VBQ0EsRUFBRSxJQUFJLEdBQUcsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0VBQ3hCLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxZQUFZLENBQUM7RUFDekIsRUFBRSxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0VBQzFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5QjtFQUNBO0VBQ0E7RUFDQTtFQUNBO0FBQ0E7RUFDQTtFQUNBLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUM1RCxFQUFFLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekU7RUFDQSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25CO0VBQ0EsRUFBRSxXQUFXLENBQUMsTUFBTTtFQUNwQixJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUU7RUFDdkIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDaEMsTUFBTSxDQUFDLEVBQUUsQ0FBQztFQUNWLE1BQU0sSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRTtFQUN4QixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDZCxRQUFRLENBQUMsRUFBRSxDQUFDO0VBQ1osUUFBUSxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztFQUN4QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDaEIsT0FBTztFQUNQLEtBQUs7RUFDTCxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVDtFQUNBLEVBQUUsTUFBTSxJQUFJLEdBQUcsTUFBTTtFQUNyQjtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ2I7RUFDQSxJQUFJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUN2QyxHQUFHLENBQUM7RUFDSixFQUFFLElBQUksRUFBRSxDQUFDO0VBQ1QsQ0FBQyxDQUFDLENBQUM7QUFDSDtFQUNPLGVBQWUsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7RUFDM0MsRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7RUFDN0gsRUFBRSxJQUFJLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNqQyxFQUFFLElBQUksSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0VBQ2xDLEVBQUUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztFQUN6QixDQUFDO0FBQ0Q7RUFDTyxlQUFlLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUNoRCxFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7RUFDOUUsRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7QUFDN0g7RUFDQSxFQUFFLElBQUksT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2pDLEVBQUUsSUFBSSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7RUFDbEMsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUMxQjtFQUNBLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDO0VBQ0EsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzFELEVBQUUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0VBQ3RDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsRUFBRSxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRjs7Ozs7Ozs7Ozs7OzsifQ==
