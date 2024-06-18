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

  //import {vec3} from "./prims/vec3"

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
      return this.matrMulMatr2(matrMulMatr(this.a, m1), m2);
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
          c + v.X * v.X * (1 - c),
          v.Y * v.X * (1 - c) - v.Z * s,
          v.Z * v.X * (1 - c) + v.Y * s,
          0,
        ],
        [
          v.X * v.Y * (1 - c) + v.Z * s,
          c + v.Y * v.Y * (1 - c),
          v.Z * v.Y * (1 - c) - v.X * s,
          0,
        ],
        [
          v.X * v.Z * (1 - c) - v.Y * s,
          v.Y * v.Z * (1 - c) + v.X * s,
          c + v.Z * v.Z * (1 - c),
          0,
        ],
        [0, 0, 0, 1],
      ];
      return r;
    }

    //View matrix
    matrView(loc, at, up1) {
      let dir = at.vec3SubVec3(loc).vec3Normalize(),
        right = dir.vec3CrossVec3(up1).vec3Normalize(),
        up = right.vec3CrossVec3(dir).vec3Normalize();
      let m = new _mat4();
      m.a = [
        [right.x, up.x, -dir.x, 0],
        [right.y, up.y, -dir.y, 0],
        [right.z, up.z, -dir.z, 0],
        [-loc.vec3DotVec3(right), -loc.vec3DotVec3(up), loc.vec3DotVec3(dir), 1],
      ];
      return m;
    }

    //Frustum matrix
    MatrFrustum(l, r, b, t, n, f) {
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
      +m.a[0][0] *
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

  function vec3(x, y, z) {
    return new _vec3(x, y, z);
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
    }

    updatePrimData() {
      //let mr = mat4().matrRotateX(30);
      const date = new Date();
      let t =
        date.getMinutes() * 60 +
        date.getSeconds() +
        date.getMilliseconds() / 1000;

      let mr = mat4().matrScale(vec3(this.side));
      let m1 = mat4().matrTranslate(this.pos).matrMulMatr2(mr).matrMulMatr2(mat4().matrRotateY(30 * t));
      let arr1 = m1.toArray();
      let mWLoc = this.mtl.shader.uniforms["matrWorld"].loc;
      this.gl.uniformMatrix4fv(mWLoc, false, arr1);
    }

    render() {
      let gl = this.gl;
      if (this.noofI != null) {
        if (this.mtl.shdIsLoaded == null) {
          this.updatePrimData();
          this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
          this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
          this.mtl.shader.updateShaderData();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
        gl.bindVertexArray(this.VA.id);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
        gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
      } else {
        if (this.mtl.shdIsLoaded == null) {
          this.updatePrimData();
          this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
          this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
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
    let vert = vi[0],
      ind = vi[1];

    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let vertexBuffer = vertex_buffer(vert, gl);

    let indexBuffer = index_buffer(ind, gl);

    return new _prim(
      gl,
      name,
      type,
      mtl,
      pos,
      vertexBuffer,
      indexBuffer,
      vertexArray,
      ind.length,
      vert.length,
      side
    );
  }

  class _render {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext("webgl2");
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.clearColor(0.9, 0.7, 0.7, 1);
      this.prg = this.gl.createProgram();

      this.prims = [];
    }

    primAttach(name, type, shd_name, pos, side=3) {
      let p = primCreate(name, type, shd_name, pos, side, this.gl);
      this.prims[this.prims.length] = p;
    }

    programUniforms(shd) {
      let m = mat4().matrView(vec3(5, 3, 5), vec3(0, 0, 0), vec3(0, 1, 0));
      let arr = m.toArray();
      let mVLoc = shd.uniforms["matrView"].loc;
      this.gl.uniformMatrix4fv(mVLoc, false, arr);

      let m1 = mat4().MatrFrustum(-0.08, 0.08, -0.08, 0.08, 0.1, 200);
      //let m1 = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);
      let arr1 = m1.toArray();
      let mPLoc = shd.uniforms["matrProj"].loc;
      this.gl.uniformMatrix4fv(mPLoc, false, arr1);
    }

    transformProgramUniforms(shd) {
      if (shd.uniforms["Time"] == undefined)
        return;
      let timeLoc = shd.uniforms["Time"].loc;

      if (timeLoc != -1) {
        const date = new Date();
        let t =
          date.getMinutes() * 60 +
          date.getSeconds() +
          date.getMilliseconds() / 1000;
        this.gl.uniform1f(timeLoc, t);
      }
    }

    render() {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      
      for (const p of this.prims) {
        if (
          p.mtl.shader.id != null &&
          p.mtl.shader.shaders[0].id != null &&
          p.mtl.shader.shaders[1].id != null &&
          p.shdIsLoaded == null
        ) {
          p.mtl.shader.apply();
          this.programUniforms(p.mtl.shader);
          this.transformProgramUniforms(p.mtl.shader);
          p.render();
          p.shdIsLoaded = 1;
          return;
        }
        if (p.shdIsLoaded == null) return;
        this.transformProgramUniforms(p.mtl.shader);
        p.render();
      }
    }
  }

  function renderCreate(canvas) {
    return new _render(canvas);
  }

  let rnd;

  //Common uniform variables
  //let matrView = mat4().matrView(vec3(5, 5, 5), vec3(0, 0, 0), vec3(0, 1, 0));
  //let matrProj = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);

  // OpenGL initialization
  function initGL() {
    let canvas = document.getElementById("canvas");
    rnd = renderCreate(canvas);

    rnd.primAttach("cubePrim", "cube", "default", vec3(0, 0, 0));
    //for (const p of rnd.prims) rnd.programUniforms(p.mtl.shd);
  } // End of 'initGL' function

  // Render function
  function render() {
    rnd.gl.clear(rnd.gl.COLOR_BUFFER_BIT);

    rnd.render();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vVUJPL3Viby5qcyIsIi4uL3ByaW1zL2N1YmUuanMiLCIuLi9zaGQvc2hhZGVyLmpzIiwiLi4vbXRoL21hdDQuanMiLCIuLi9tdGgvdmVjMy5qcyIsIi4uL3ByaW1zL3ByaW0uanMiLCIuLi9yZW5kZXIvcmVuZGVyLmpzIiwiLi4vbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih0eXBlLCBzaXplLCBnbCkge1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLy8gQnVmZmVyIHR5cGUgKGdsLioqKl9CVUZGRVIpXHJcbiAgICB0aGlzLnNpemUgPSBzaXplOyAvLyBCdWZmZXIgc2l6ZSBpbiBieXRlc1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICBpZiAoc2l6ZSA9PSAwIHx8IHR5cGUgPT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKHR5cGUsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YSh0eXBlLCBzaXplLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgfVxyXG4gIHVwZGF0ZShkYXRhKSB7fVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBidWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ2J1ZmZlcicgZnVuY3Rpb25cclxuXHJcbmNsYXNzIF91Ym9fYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IobmFtZSwgc2l6ZSwgYmluZFBvaW50KSB7XHJcbiAgICBzdXBlcih0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCBzaXplKTtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmJpbmRQb2ludCA9IGJpbmRQb2ludDsgLy8gQnVmZmVyIEdQVSBiaW5kaW5nIHBvaW50XHJcbiAgfVxyXG4gIGFwcGx5KHNoZCkge1xyXG4gICAgaWYgKFxyXG4gICAgICBzaGQgPT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgIHNoZC5pZCA9PSB1bmRlZmluZWQgfHxcclxuICAgICAgc2hkLnVuaWZvcm1CbG9ja3NbdGhpcy5uYW1lXSA9PSB1bmRlZmluZWRcclxuICAgIClcclxuICAgICAgcmV0dXJuO1xyXG4gICAgZ2wudW5pZm9ybUJsb2NrQmluZGluZyhcclxuICAgICAgc2hkLmlkLFxyXG4gICAgICBzaGQudW5pZm9ybUJsb2Nrc1t0aGlzLm5hbWVdLmluZGV4LFxyXG4gICAgICB0aGlzLmJpbmRQb2ludFxyXG4gICAgKTtcclxuICAgIGdsLmJpbmRCdWZmZXJCYXNlKHRoaXMuZ2wuVU5JRk9STV9CVUZGRVIsIHRoaXMuYmluZFBvaW50LCB0aGlzLmlkKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHVib19idWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3Vib19idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG5cclxuY2xhc3MgX3ZlcnRleF9idWZmZXIgZXh0ZW5kcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih2QXJyYXksIGdsKSB7XHJcbiAgICBjb25zdCBuID0gdkFycmF5Lmxlbmd0aDtcclxuICAgIHN1cGVyKGdsLkFSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgdGhpcy5nbC5BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkodkFycmF5KSxcclxuICAgICAgdGhpcy5nbC5TVEFUSUNfRFJBV1xyXG4gICAgKTtcclxuICB9XHJcbiAgYXBwbHkoTG9jLCBzaXplLCBvZmZzZXQpIHtcclxuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihMb2MsIDMsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCBzaXplLCBvZmZzZXQpO1xyXG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShMb2MpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gdmVydGV4X2J1ZmZlciguLi5hcmdzKSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVydGV4X2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ3ZlcnRleF9idWZmZXInIGZ1bmN0aW9uXHJcblxyXG5jbGFzcyBfaW5kZXhfYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IoaUFycmF5LCBnbCkge1xyXG4gICAgY29uc3QgbiA9IGlBcnJheS5sZW5ndGg7XHJcbiAgICBzdXBlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBVaW50MzJBcnJheShpQXJyYXkpLFxyXG4gICAgICB0aGlzLmdsLlNUQVRJQ19EUkFXXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhfYnVmZmVyKC4uLmFyZ3MpIHtcclxuICByZXR1cm4gbmV3IF9pbmRleF9idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG4iLCJleHBvcnQgZnVuY3Rpb24gY3ViZUNyZWF0ZSgpIHtcclxuICAvKiBsZXQgc3ggPSAwICsgc2lkZSxcclxuICAgIHN5ID0gcG9zLnkgKyBzaWRlLFxyXG4gICAgc3ogPSBwb3MueiAtIHNpZGU7ICovXHJcbiAgbGV0IHAgPSBbXHJcbiAgICBbLTAuNSwgLTAuNSwgMC41XSxcclxuICAgIFswLjUsIC0wLjUsIDAuNV0sXHJcbiAgICBbMC41LCAwLjUsIDAuNV0sXHJcbiAgICBbLTAuNSwgMC41LCAwLjVdLFxyXG4gICAgWy0wLjUsIDAuNSwgLTAuNV0sXHJcbiAgICBbMC41LCAwLjUsIC0wLjVdLFxyXG4gICAgWzAuNSwgLTAuNSwgLTAuNV0sXHJcbiAgICBbLTAuNSwgLTAuNSwgLTAuNV0sXHJcbiAgXTtcclxuXHJcbiAgbGV0IG4gPSBbXHJcbiAgICBbLTEsIC0xLCAxXSxcclxuICAgIFsxLCAtMSwgMV0sXHJcbiAgICBbMSwgMSwgMV0sXHJcbiAgICBbLTEsIDEsIDFdLFxyXG4gICAgWy0xLCAxLCAtMV0sXHJcbiAgICBbMSwgMSwgLTFdLFxyXG4gICAgWzEsIC0xLCAtMV0sXHJcbiAgICBbLTEsIC0xLCAtMV0sXHJcbiAgXTtcclxuICBsZXQgdmVydGV4ZXMgPSBbXSxcclxuICAgIGogPSAwO1xyXG4gIHdoaWxlIChqIDwgOCkge1xyXG4gICAgdmVydGV4ZXNbal0gPSBbXHJcbiAgICAgIC4uLnBbal0sXHJcbiAgICAgIG5bal1bMF0sXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIC4uLnBbal0sXHJcbiAgICAgIDAsXHJcbiAgICAgIG5bal1bMV0sXHJcbiAgICAgIDAsXHJcbiAgICAgIC4uLnBbal0sXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIG5bal1bMl0sXHJcbiAgICBdO1xyXG4gICAgaisrO1xyXG4gIH1cclxuICBsZXQgaW5kID0gW1xyXG4gICAgMiwgMTEsIDUsIDgsIDYsIDMsIDE1LCAxOCwgMTksIDIyLCA0LCAxLCAwLCA5LCAyMSwgMTIsIDE0LCAxNywgMjMsIDIwLCAyMyxcclxuICAgIDE0LCAxNywgMTYsIDEzLCA3LCAxMCxcclxuICBdO1xyXG5cclxuICB2ZXJ0ZXhlcyA9IFtcclxuICAgIC4uLnZlcnRleGVzWzBdLFxyXG4gICAgLi4udmVydGV4ZXNbMV0sXHJcbiAgICAuLi52ZXJ0ZXhlc1syXSxcclxuICAgIC4uLnZlcnRleGVzWzNdLFxyXG4gICAgLi4udmVydGV4ZXNbNF0sXHJcbiAgICAuLi52ZXJ0ZXhlc1s1XSxcclxuICAgIC4uLnZlcnRleGVzWzZdLFxyXG4gICAgLi4udmVydGV4ZXNbN10sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIFt2ZXJ0ZXhlcywgaW5kXTtcclxufSIsImNsYXNzIF9zaGFkZXIge1xyXG4gIGFzeW5jIF9pbml0KG5hbWUsIGdsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICB0aGlzLnNoYWRlcnMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogbnVsbCxcclxuICAgICAgICB0eXBlOiB0aGlzLmdsLlZFUlRFWF9TSEFERVIsXHJcbiAgICAgICAgbmFtZTogXCJ2ZXJ0XCIsXHJcbiAgICAgICAgc3JjOiBcIlwiLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgdHlwZTogdGhpcy5nbC5GUkFHTUVOVF9TSEFERVIsXHJcbiAgICAgICAgbmFtZTogXCJmcmFnXCIsXHJcbiAgICAgICAgc3JjOiBcIlwiLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNoYWRlcnMpIHtcclxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYGJpbi9zaGFkZXJzLyR7bmFtZX0vJHtzLm5hbWV9Lmdsc2xgKTtcclxuICAgICAgbGV0IHNyYyA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgaWYgKHR5cGVvZiBzcmMgPT0gXCJzdHJpbmdcIiAmJiBzcmMgIT0gXCJcIikgcy5zcmMgPSBzcmM7XHJcbiAgICB9XHJcbiAgICAvLyByZWNvbXBpbGUgc2hhZGVyc1xyXG4gICAgdGhpcy51cGRhdGVTaGFkZXJzU291cmNlKCk7XHJcbiAgfVxyXG4gIHVwZGF0ZVNoYWRlcnNTb3VyY2UoKSB7XHJcbiAgICB0aGlzLnNoYWRlcnNbMF0uaWQgPSBudWxsO1xyXG4gICAgdGhpcy5zaGFkZXJzWzFdLmlkID0gbnVsbDtcclxuICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgaWYgKHRoaXMuc2hhZGVyc1swXS5zcmMgPT0gXCJcIiB8fCB0aGlzLnNoYWRlcnNbMV0uc3JjID09IFwiXCIpIHJldHVybjtcclxuICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNoYWRlcnMpIHtcclxuICAgICAgcy5pZCA9IHRoaXMuZ2wuY3JlYXRlU2hhZGVyKHMudHlwZSk7XHJcbiAgICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKHMuaWQsIHMuc3JjKTtcclxuICAgICAgdGhpcy5nbC5jb21waWxlU2hhZGVyKHMuaWQpO1xyXG4gICAgICBpZiAoIXRoaXMuZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHMuaWQsIHRoaXMuZ2wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgbGV0IGJ1ZiA9IHRoaXMuZ2wuZ2V0U2hhZGVySW5mb0xvZyhzLmlkKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgU2hhZGVyICR7dGhpcy5uYW1lfS8ke3MubmFtZX0gY29tcGlsZSBmYWlsOiAke2J1Zn1gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5pZCA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNoYWRlcnMpIHtcclxuICAgICAgaWYgKHMuaWQgIT0gbnVsbCkgdGhpcy5nbC5hdHRhY2hTaGFkZXIodGhpcy5pZCwgcy5pZCk7XHJcbiAgICB9XHJcbiAgICBsZXQgcHJnID0gdGhpcy5pZDtcclxuICAgIHRoaXMuZ2wubGlua1Byb2dyYW0ocHJnKTtcclxuICAgIGlmICghdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByZywgdGhpcy5nbC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgbGV0IGJ1ZiA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJnKTtcclxuICAgICAgY29uc29sZS5sb2coYFNoYWRlciBwcm9ncmFtICR7dGhpcy5uYW1lfSBsaW5rIGZhaWw6ICR7YnVmfWApO1xyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGVTaGFkZXJEYXRhKCk7XHJcbiAgfVxyXG4gIHVwZGF0ZVNoYWRlckRhdGEoKSB7XHJcbiAgICAvLyBTaGFkZXIgYXR0cmlidXRlc1xyXG4gICAgdGhpcy5hdHRycyA9IHt9O1xyXG4gICAgY29uc3QgY291bnRBdHRycyA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihcclxuICAgICAgdGhpcy5pZCxcclxuICAgICAgdGhpcy5nbC5BQ1RJVkVfQVRUUklCVVRFU1xyXG4gICAgKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnRBdHRyczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdsLmdldEFjdGl2ZUF0dHJpYih0aGlzLmlkLCBpKTtcclxuICAgICAgdGhpcy5hdHRyc1tpbmZvLm5hbWVdID0ge1xyXG4gICAgICAgIG5hbWU6IGluZm8ubmFtZSxcclxuICAgICAgICB0eXBlOiBpbmZvLnR5cGUsXHJcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxyXG4gICAgICAgIGxvYzogdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmlkLCBpbmZvLm5hbWUpLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNoYWRlciB1bmlmb3Jtc1xyXG4gICAgdGhpcy51bmlmb3JtcyA9IHt9O1xyXG4gICAgY29uc3QgY291bnRVbmlmb3JtcyA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihcclxuICAgICAgdGhpcy5pZCxcclxuICAgICAgdGhpcy5nbC5BQ1RJVkVfVU5JRk9STVNcclxuICAgICk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50VW5pZm9ybXM7IGkrKykge1xyXG4gICAgICBjb25zdCBpbmZvID0gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtKHRoaXMuaWQsIGkpO1xyXG4gICAgICB0aGlzLnVuaWZvcm1zW2luZm8ubmFtZV0gPSB7XHJcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxyXG4gICAgICAgIHR5cGU6IGluZm8udHlwZSxcclxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXHJcbiAgICAgICAgbG9jOiB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmlkLCBpbmZvLm5hbWUpLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNoYWRlciB1bmlmb3JtIGJsb2Nrc1xyXG4gICAgdGhpcy51bmlmb3JtQmxvY2tzID0ge307XHJcbiAgICBjb25zdCBjb3VudFVuaWZvcm1CbG9ja3MgPSB0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIoXHJcbiAgICAgIHRoaXMuaWQsXHJcbiAgICAgIHRoaXMuZ2wuQUNUSVZFX1VOSUZPUk1fQkxPQ0tTXHJcbiAgICApO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudFVuaWZvcm1CbG9ja3M7IGkrKykge1xyXG4gICAgICBjb25zdCBibG9ja19uYW1lID0gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtQmxvY2tOYW1lKHRoaXMuaWQsIGkpO1xyXG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrSW5kZXgodGhpcy5pZCwgYmxvY2tfbmFtZSk7XHJcbiAgICAgIHRoaXMudW5pZm9ybUJsb2Nrc1tibG9ja19uYW1lXSA9IHtcclxuICAgICAgICBuYW1lOiBibG9ja19uYW1lLFxyXG4gICAgICAgIGluZGV4OiBpbmRleCxcclxuICAgICAgICBzaXplOiB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja1BhcmFtZXRlcihcclxuICAgICAgICAgIHRoaXMuaWQsXHJcbiAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICB0aGlzLmdsLlVOSUZPUk1fQkxPQ0tfREFUQV9TSVpFXHJcbiAgICAgICAgKSxcclxuICAgICAgICBiaW5kOiB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja1BhcmFtZXRlcihcclxuICAgICAgICAgIHRoaXMuaWQsXHJcbiAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICB0aGlzLmdsLlVOSUZPUk1fQkxPQ0tfQklORElOR1xyXG4gICAgICAgICksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0cnVjdG9yKG5hbWUsIGdsKSB7XHJcbiAgICB0aGlzLl9pbml0KG5hbWUsIGdsKTtcclxuICB9XHJcbiAgYXBwbHkoKSB7XHJcbiAgICBpZiAodGhpcy5pZCAhPSBudWxsKSB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5pZCk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzaGFkZXIobmFtZSwgZ2wpIHtcclxuICByZXR1cm4gbmV3IF9zaGFkZXIobmFtZSwgZ2wpO1xyXG59XHJcbi8qXHJcbmxldCBzcmMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNoZFZlcnRTcmNcIikudmFsdWU7XHJcbnNoZC5zaGFkZXJzWzBdLnNyYyA9IHNyYztcclxuc2hkLnVwZGF0ZVNoYWRlcnNTb3VyY2UoKTtcclxuKi9cclxuIiwiLy9pbXBvcnQge3ZlYzN9IGZyb20gXCIuL3ByaW1zL3ZlYzNcIlxyXG5cclxuY2xhc3MgX21hdDQge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgdG9BcnJheSgpIHtcclxuICAgIGxldCB0ID0gdGhpcy5hO1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdCh0WzBdKS5jb25jYXQodFsxXSkuY29uY2F0KHRbMl0pLmNvbmNhdCh0WzNdKTtcclxuICB9XHJcblxyXG4gIC8vVHJhbnNsYXRlIG1hdHJpeFxyXG4gIG1hdHJUcmFuc2xhdGUodikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgWzEsIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAxLCAwXSxcclxuICAgICAgW3YueCwgdi55LCB2LnosIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9NdWx0aXBseWluZyB0d28gbWF0cml4ZXNcclxuICBtYXRyTXVsTWF0cjIobSkge1xyXG4gICAgbGV0IHIgPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzBdWzFdID1cclxuICAgICAgdGhpcy5hWzBdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVswXVsyXSA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgci5hWzFdWzBdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzBdO1xyXG5cclxuICAgIHIuYVsxXVsxXSA9XHJcbiAgICAgIHRoaXMuYVsxXVswXSAqIG0uYVswXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsxXSAqIG0uYVsxXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsyXSAqIG0uYVsyXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVszXSAqIG0uYVszXVsxXTtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICB0aGlzLmFbMV1bMF0gKiBtLmFbMF1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMV0gKiBtLmFbMV1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMl0gKiBtLmFbMl1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bM10gKiBtLmFbM11bMl07XHJcblxyXG4gICAgci5hWzFdWzNdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzNdO1xyXG5cclxuICAgIHIuYVsyXVswXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVswXTtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICB0aGlzLmFbMl1bMF0gKiBtLmFbMF1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMV0gKiBtLmFbMV1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMl0gKiBtLmFbMl1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bM10gKiBtLmFbM11bMV07XHJcblxyXG4gICAgci5hWzJdWzJdID1cclxuICAgICAgdGhpcy5hWzJdWzBdICogbS5hWzBdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzFdICogbS5hWzFdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzJdICogbS5hWzJdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzNdICogbS5hWzNdWzJdO1xyXG5cclxuICAgIHIuYVsyXVszXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVszXTtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzNdWzFdID1cclxuICAgICAgdGhpcy5hWzNdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVszXVsyXSA9XHJcbiAgICAgIHRoaXMuYVszXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICAvL011bHRpcGx5aW5nIHRocmVlIG1hdHJpeGVzXHJcbiAgbWF0ck11bE1hdHIzKG0xLCBtMikge1xyXG4gICAgcmV0dXJuIHRoaXMubWF0ck11bE1hdHIyKG1hdHJNdWxNYXRyKHRoaXMuYSwgbTEpLCBtMik7XHJcbiAgfVxyXG5cclxuICBNYXRySW52ZXJzZSgpIHtcclxuICAgIGxldCByID0gbmV3IF9tYXQ0KCk7XHJcbiAgICBsZXQgZGV0ID0gbWF0ckRldGVybShNKTtcclxuXHJcbiAgICBpZiAoZGV0ID09IDApIHJldHVybiByO1xyXG5cclxuICAgIC8qIGJ1aWxkIGFkam9pbnQgbWF0cml4ICovXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVswXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzBdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVswXVsxXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzFdWzFdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVszXVsxXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzBdWzJdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVsyXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzJdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVszXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzNdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBtYXRyaXhcclxuICBtYXRyUm90YXRlKGFuZ2xlLCB2KSB7XHJcbiAgICBsZXQgYSA9IGFuZ2xlICogMy4xNDE1OTI2NTM1ODk3OTMyIC8gMTgwLFxyXG4gICAgICBzID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGMgPSBNYXRoLmNvcyhhKTtcclxuXHJcbiAgICBsZXQgciA9IG5ldyBfbWF0NCgpO1xyXG4gICAgci5hID0gW1xyXG4gICAgICBbXHJcbiAgICAgICAgYyArIHYuWCAqIHYuWCAqICgxIC0gYyksXHJcbiAgICAgICAgdi5ZICogdi5YICogKDEgLSBjKSAtIHYuWiAqIHMsXHJcbiAgICAgICAgdi5aICogdi5YICogKDEgLSBjKSArIHYuWSAqIHMsXHJcbiAgICAgICAgMCxcclxuICAgICAgXSxcclxuICAgICAgW1xyXG4gICAgICAgIHYuWCAqIHYuWSAqICgxIC0gYykgKyB2LlogKiBzLFxyXG4gICAgICAgIGMgKyB2LlkgKiB2LlkgKiAoMSAtIGMpLFxyXG4gICAgICAgIHYuWiAqIHYuWSAqICgxIC0gYykgLSB2LlggKiBzLFxyXG4gICAgICAgIDAsXHJcbiAgICAgIF0sXHJcbiAgICAgIFtcclxuICAgICAgICB2LlggKiB2LlogKiAoMSAtIGMpIC0gdi5ZICogcyxcclxuICAgICAgICB2LlkgKiB2LlogKiAoMSAtIGMpICsgdi5YICogcyxcclxuICAgICAgICBjICsgdi5aICogdi5aICogKDEgLSBjKSxcclxuICAgICAgICAwLFxyXG4gICAgICBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICAvL1ZpZXcgbWF0cml4XHJcbiAgbWF0clZpZXcobG9jLCBhdCwgdXAxKSB7XHJcbiAgICBsZXQgZGlyID0gYXQudmVjM1N1YlZlYzMobG9jKS52ZWMzTm9ybWFsaXplKCksXHJcbiAgICAgIHJpZ2h0ID0gZGlyLnZlYzNDcm9zc1ZlYzModXAxKS52ZWMzTm9ybWFsaXplKCksXHJcbiAgICAgIHVwID0gcmlnaHQudmVjM0Nyb3NzVmVjMyhkaXIpLnZlYzNOb3JtYWxpemUoKTtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFtyaWdodC54LCB1cC54LCAtZGlyLngsIDBdLFxyXG4gICAgICBbcmlnaHQueSwgdXAueSwgLWRpci55LCAwXSxcclxuICAgICAgW3JpZ2h0LnosIHVwLnosIC1kaXIueiwgMF0sXHJcbiAgICAgIFstbG9jLnZlYzNEb3RWZWMzKHJpZ2h0KSwgLWxvYy52ZWMzRG90VmVjMyh1cCksIGxvYy52ZWMzRG90VmVjMyhkaXIpLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vRnJ1c3R1bSBtYXRyaXhcclxuICBNYXRyRnJ1c3R1bShsLCByLCBiLCB0LCBuLCBmKSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG4gICAgbS5hID0gW1xyXG4gICAgICBbKDIgKiBuKSAvIChyIC0gbCksIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgKDIgKiBuKSAvICh0IC0gYiksIDAsIDBdLFxyXG4gICAgICBbKHIgKyBsKSAvIChyIC0gbCksICh0ICsgYikgLyAodCAtIGIpLCAtKChmICsgbikgLyAoZiAtIG4pKSwgLTFdLFxyXG4gICAgICBbMCwgMCwgLSgoMiAqIG4gKiBmKSAvIChmIC0gbikpLCAwXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vVHJhbnNwb3NlIG1hdHJpeFxyXG4gIG1hdHJUcmFuc3Bvc2UoKSB7XHJcbiAgICBsZXQgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIChtLmEgPSBbbS5hWzBdWzBdLCBtLmFbMV1bMF0sIG0uYVsyXVswXSwgbS5hWzNdWzBdXSksXHJcbiAgICAgIFttLmFbMF1bMV0sIG0uYVsxXVsxXSwgbS5hWzJdWzFdLCBtLmFbM11bMV1dLFxyXG4gICAgICBbbS5hWzBdWzJdLCBtLmFbMV1bMl0sIG0uYVsyXVsyXSwgbS5hWzNdWzJdXSxcclxuICAgICAgW20uYVswXVszXSwgbS5hWzFdWzNdLCBtLmFbMl1bM10sIG0uYVszXVszXV07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vUmF0YXRpb24gYnkgWCBtYXRyaXhcclxuICBtYXRyUm90YXRlWChhbmdsZUluRGVncmVlKSB7XHJcbiAgICBsZXQgYSA9IGFuZ2xlSW5EZWdyZWUgKiAzLjE0MTU5MjY1MzU4OTc5MzIgLyAxODAsXHJcbiAgICAgIHNpID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGNvID0gTWF0aC5jb3MoYSksXHJcbiAgICAgIG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsxLCAwLCAwLCAwXSxcclxuICAgICAgWzAsIGNvLCBzaSwgMF0sXHJcbiAgICAgIFswLCAtc2ksIGNvLCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBieSBZIG1hdHJpeFxyXG4gIG1hdHJSb3RhdGVZKGFuZ2xlSW5EZWdyZWUpIHtcclxuICAgIGxldCBhID0gYW5nbGVJbkRlZ3JlZSAqIDMuMTQxNTkyNjUzNTg5NzkzMiAvIDE4MCxcclxuICAgICAgc2kgPSBNYXRoLnNpbihhKSxcclxuICAgICAgY28gPSBNYXRoLmNvcyhhKSxcclxuICAgICAgbSA9IG5ldyBfbWF0NCgpO1xyXG5cclxuICAgIG0uYSA9IFtcclxuICAgICAgW2NvLCAwLCAtc2ksIDBdLFxyXG4gICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgIFtzaSwgMCwgY28sIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICAvL1JvdGF0aW9uIGJ5IFogbWF0cml4XHJcbiAgbWF0clJvdGF0ZVooYW5nbGVJbkRlZ3JlZSkge1xyXG4gICAgbGV0IGEgPSBhbmdsZUluRGVncmVlICogMy4xNDE1OTI2NTM1ODk3OTMyIC8gMTgwLFxyXG4gICAgICBzaSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjbyA9IE1hdGguY29zKGEpLFxyXG4gICAgICBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbY28sIHNpLCAwLCAwXSxcclxuICAgICAgWy1zaSwgY28sIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vU2NhbGUgbWF0cml4XHJcbiAgbWF0clNjYWxlKHYpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbdi54LCAwLCAwLCAwXSxcclxuICAgICAgWzAsIHYueSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCB2LnosIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICBtYXRyT3J0aG8obCwgciwgYiwgdCwgbiwgZikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsyIC8gKHIgLSBsKSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAyIC8gKHQgLSBiKSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAtMiAvIChmIC0gbiksIDBdLFxyXG4gICAgICBbLShyICsgbCkgLyAociAtIGwpLCAtKHQgKyBiKSAvICh0IC0gYiksIC0oZiArIG4pIC8gKGYgLSBuKSwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRyRGV0ZXJtM3gzKGExMSwgYTEyLCBhMTMsIGEyMSwgYTIyLCBhMjMsIGEzMSwgYTMyLCBhMzMpIHtcclxuICByZXR1cm4gKFxyXG4gICAgYTExICogYTIyICogYTMzICtcclxuICAgIGExMiAqIGEyMyAqIGEzMSArXHJcbiAgICBhMTMgKiBhMjEgKiBhMzIgLVxyXG4gICAgYTExICogYTIzICogYTMyIC1cclxuICAgIGExMiAqIGEyMSAqIGEzMyAtXHJcbiAgICBhMTMgKiBhMjIgKiBhMzFcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRyRGV0ZXJtKG0pIHtcclxuICBsZXQgZCA9XHJcbiAgICArbS5hWzBdWzBdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMV0sXHJcbiAgICAgICAgbS5hWzFdWzJdLFxyXG4gICAgICAgIG0uYVsxXVszXSxcclxuICAgICAgICBtLmFbMl1bMV0sXHJcbiAgICAgICAgbS5hWzJdWzJdLFxyXG4gICAgICAgIG0uYVsyXVszXSxcclxuICAgICAgICBtLmFbM11bMV0sXHJcbiAgICAgICAgbS5hWzNdWzJdLFxyXG4gICAgICAgIG0uYVszXVszXVxyXG4gICAgICApICtcclxuICAgIC1tLmFbMF1bMV0gKlxyXG4gICAgICBtYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIG0uYVsxXVswXSxcclxuICAgICAgICBtLmFbMV1bMl0sXHJcbiAgICAgICAgbS5hWzFdWzNdLFxyXG4gICAgICAgIG0uYVsyXVswXSxcclxuICAgICAgICBtLmFbMl1bMl0sXHJcbiAgICAgICAgbS5hWzJdWzNdLFxyXG4gICAgICAgIG0uYVszXVswXSxcclxuICAgICAgICBtLmFbM11bMl0sXHJcbiAgICAgICAgbS5hWzNdWzNdXHJcbiAgICAgICkgK1xyXG4gICAgK20uYVswXVsyXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzBdLFxyXG4gICAgICAgIG0uYVsxXVsxXSxcclxuICAgICAgICBtLmFbMV1bM10sXHJcbiAgICAgICAgbS5hWzJdWzBdLFxyXG4gICAgICAgIG0uYVsyXVsxXSxcclxuICAgICAgICBtLmFbMl1bM10sXHJcbiAgICAgICAgbS5hWzNdWzBdLFxyXG4gICAgICAgIG0uYVszXVsxXSxcclxuICAgICAgICBtLmFbM11bM11cclxuICAgICAgKSArXHJcbiAgICAtbS5hWzBdWzNdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMF0sXHJcbiAgICAgICAgbS5hWzFdWzFdLFxyXG4gICAgICAgIG0uYVsxXVsyXSxcclxuICAgICAgICBtLmFbMl1bMF0sXHJcbiAgICAgICAgbS5hWzJdWzFdLFxyXG4gICAgICAgIG0uYVsyXVsyXSxcclxuICAgICAgICBtLmFbM11bMF0sXHJcbiAgICAgICAgbS5hWzNdWzFdLFxyXG4gICAgICAgIG0uYVszXVsyXVxyXG4gICAgICApO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF0NCgpIHtcclxuICByZXR1cm4gbmV3IF9tYXQ0KCk7XHJcbn1cclxuIiwiY2xhc3MgX3ZlYzMge1xyXG4gIGNvbnN0cnVjdG9yKHgsIHksIHopIHtcclxuICAgIGlmICh0eXBlb2YoeCkgIT0gXCJudW1iZXJcIikge1xyXG4gICAgICBpZiAoeCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgKHRoaXMueCA9IHgueCksICh0aGlzLnkgPSB4LnkpLCAodGhpcy56ID0geC56KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHkgIT0gdW5kZWZpbmVkICYmIHogIT0gdW5kZWZpbmVkKVxyXG4gICAgICAodGhpcy54ID0geCksICh0aGlzLnkgPSB5KSwgKHRoaXMueiA9IHopO1xyXG4gICAgZWxzZSAodGhpcy54ID0geCksICh0aGlzLnkgPSB4KSwgKHRoaXMueiA9IHgpO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIGFkZCBhbm90aGVyXHJcbiAgdmVjM0FkZFZlYzModikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyh0aGlzLnggKyB2LngsIHRoaXMueSArIHYueSwgdGhpcy56ICsgdi56KTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBzdWJzdHJhY3QgYW5vdGhlclxyXG4gIHZlYzNTdWJWZWMzKHYpIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54IC0gdi54LCB0aGlzLnkgLSB2LnksIHRoaXMueiAtIHYueik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgbXVsdGlwbGljYXRlZCBieSBudW1iZXJcclxuICB2ZWMzTXVsTnVtKG4pIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54ICogbiwgdGhpcy55ICogbiwgdGhpcy56ICogbik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgZGV2aWRlZCBieSBudW1iZXJcclxuICB2ZWMzRGl2TnVtKG4pIHtcclxuICAgIGlmIChuID09IDApIHJldHVybjtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54IC8gbiwgdGhpcy55IC8gbiwgdGhpcy56IC8gbik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgTmVnYXRpdmVcclxuICB2ZWMzTmVnKCkge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMygtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56KTtcclxuICB9XHJcblxyXG4gIC8vVHdvIHZlY3RvcnMzIGRvdCBwcm9kdWN0XHJcbiAgdmVjM0RvdFZlYzModikge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSArIHRoaXMueiAqIHYuejtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBMZW5naHQgZXZhbHVhdGlvblxyXG4gIHZlYzNMZW4oKSB7XHJcbiAgICBsZXQgbGVuID0gdGhpcy52ZWMzRG90VmVjMyh0aGlzKTtcclxuICAgIGlmIChsZW4gPT0gMCB8fCBsZW4gPT0gMSkgcmV0dXJuIGxlbjtcclxuICAgIHJldHVybiBNYXRoLnNxcnQobGVuKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBOb3JtYWxpemVcclxuICB2ZWMzTm9ybWFsaXplKCkge1xyXG4gICAgbGV0IGxlbiA9IHRoaXMudmVjM0RvdFZlYzModGhpcyk7XHJcblxyXG4gICAgaWYgKGxlbiA9PSAxIHx8IGxlbiA9PSAwKSByZXR1cm4gdGhpcztcclxuICAgIHJldHVybiB0aGlzLnZlYzNEaXZOdW0oTWF0aC5zcXJ0KGxlbikpO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIHRyYW5zZm9tYXRpb25cclxuICB2ZWMzVHJhbnNmb3JtKG0pIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzMoXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIHRoaXMueiAqIG0uYVsyXVswXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgdGhpcy56ICogbS5hWzJdWzFdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyB0aGlzLnogKiBtLmFbMl1bMl1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgYnkgbWF0cml4IG11bHRpcGxpY2F0aW9uICh3aXRoIGhvbW9nZW5pb3VzIGRldmlkZSlcclxuICB2ZWMzTXVsTWF0cihtKSB7XHJcbiAgICBsZXQgdyA9XHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVszXSArIHRoaXMueSAqIG0uYVsxXVszXSArIHRoaXMueiAqIG0uYVsyXVszXSArIG0uYVszXVszXTtcclxuXHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKFxyXG4gICAgICAoVi5YICogbS5hWzBdWzBdICsgdGhpcy55ICogbS5hWzFdWzBdICsgVi5aICogbS5hWzJdWzBdICsgbS5hWzNdWzBdKSAvIHcsXHJcbiAgICAgIChWLlggKiBtLmFbMF1bMV0gKyB0aGlzLnkgKiBtLmFbMV1bMV0gKyBWLlogKiBtLmFbMl1bMV0gKyBtLmFbM11bMV0pIC8gdyxcclxuICAgICAgKFYuWCAqIG0uYVswXVsyXSArIHRoaXMueSAqIG0uYVsxXVsyXSArIFYuWiAqIG0uYVsyXVsyXSArIG0uYVszXVsyXSkgLyB3XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy9Dcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzXHJcbiAgdmVjM0Nyb3NzVmVjMyh2KSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKFxyXG4gICAgICB0aGlzLnkgKiB2LnogLSB0aGlzLnogKiB2LnksXHJcbiAgICAgIHRoaXMueiAqIHYueCAtIHRoaXMueCAqIHYueixcclxuICAgICAgdGhpcy54ICogdi55IC0gdGhpcy55ICogdi54XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy9Qb2ludCBieSBtYXRyaXggdHJhbnNmb3JtYXRpb25cclxuICBwb2ludFRyYW5zZm9ybShtKSB7XHJcbiAgICBsZXQgdiA9IG5ldyBfdmVjMyhcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzBdICsgdGhpcy55ICogbS5hWzFdWzBdICsgVi5aICogbS5hWzJdWzBdICsgbS5hWzNdWzBdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMV0gKyB0aGlzLnkgKiBtLmFbMV1bMV0gKyBWLlogKiBtLmFbMl1bMV0gKyBtLmFbM11bMV0sXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVsyXSArIHRoaXMueSAqIG0uYVsxXVsyXSArIFYuWiAqIG0uYVsyXVsyXSArIG0uYVszXVsyXVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gdjtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2ZWMzKHgsIHksIHopIHtcclxuICByZXR1cm4gbmV3IF92ZWMzKHgsIHksIHopO1xyXG59XHJcbiIsImltcG9ydCB7IGluZGV4X2J1ZmZlciwgdmVydGV4X2J1ZmZlciB9IGZyb20gXCIuLi9VQk8vdWJvLmpzXCI7XHJcbmltcG9ydCB7IGN1YmVDcmVhdGUgfSBmcm9tIFwiLi9jdWJlLmpzXCI7XHJcbmltcG9ydCB7IHNoYWRlciB9IGZyb20gXCIuLi9zaGQvc2hhZGVyLmpzXCI7XHJcbmltcG9ydCB7IG1hdDQgfSBmcm9tIFwiLi4vbXRoL21hdDQuanNcIjtcclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuLi9tdGgvdmVjMy5qc1wiO1xyXG5cclxuY2xhc3MgX21hdGVyaWFsIHtcclxuICBjb25zdHJ1Y3RvcihzaGQsIHVibykge1xyXG4gICAgdGhpcy5zaGFkZXIgPSBzaGQ7XHJcbiAgICB0aGlzLnVibyA9IHVibztcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIF9wcmltIHtcclxuICBjb25zdHJ1Y3RvcihnbCwgbmFtZSwgdHlwZSwgc2hkX25hbWUsIHBvcywgVkJ1ZiwgSUJ1ZiwgVkEsIG5vb2ZJLCBub29mViwgc2lkZSkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICh0aGlzLlZCdWYgPSBWQnVmKSwgKHRoaXMuSUJ1ZiA9IElCdWYpLCAodGhpcy5WQSA9IFZBKTsgLyogcmVuZGVyIGluZm8gKi9cclxuICAgIHRoaXMudHlwZSA9IHR5cGU7IC8qIHBsYXRvbiBmaWd1cmUgdHlwZSAqL1xyXG4gICAgdGhpcy5wb3MgPSBwb3M7IC8qIHBvc2l0aW9uICovXHJcblxyXG4gICAgdGhpcy5zaWRlID0gc2lkZTtcclxuICAgIGxldCBzaGQgPSBzaGFkZXIoc2hkX25hbWUsIGdsKTtcclxuICAgIHRoaXMubXRsID0gbmV3IF9tYXRlcmlhbChzaGQsIG51bGwpO1xyXG4gICAgdGhpcy5zaGRJc0xvYWRlZCA9IG51bGw7XHJcbiAgICB0aGlzLm5vb2ZJID0gbm9vZkk7XHJcbiAgICB0aGlzLm5vb2ZWID0gbm9vZlY7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgfVxyXG5cclxuICB1cGRhdGVQcmltRGF0YSgpIHtcclxuICAgIC8vbGV0IG1yID0gbWF0NCgpLm1hdHJSb3RhdGVYKDMwKTtcclxuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgbGV0IHQgPVxyXG4gICAgICBkYXRlLmdldE1pbnV0ZXMoKSAqIDYwICtcclxuICAgICAgZGF0ZS5nZXRTZWNvbmRzKCkgK1xyXG4gICAgICBkYXRlLmdldE1pbGxpc2Vjb25kcygpIC8gMTAwMDtcclxuXHJcbiAgICBsZXQgbXIgPSBtYXQ0KCkubWF0clNjYWxlKHZlYzModGhpcy5zaWRlKSk7XHJcbiAgICBsZXQgbTEgPSBtYXQ0KCkubWF0clRyYW5zbGF0ZSh0aGlzLnBvcykubWF0ck11bE1hdHIyKG1yKS5tYXRyTXVsTWF0cjIobWF0NCgpLm1hdHJSb3RhdGVZKDMwICogdCkpO1xyXG4gICAgbGV0IGFycjEgPSBtMS50b0FycmF5KCk7XHJcbiAgICBsZXQgbVdMb2MgPSB0aGlzLm10bC5zaGFkZXIudW5pZm9ybXNbXCJtYXRyV29ybGRcIl0ubG9jO1xyXG4gICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KG1XTG9jLCBmYWxzZSwgYXJyMSk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgaWYgKHRoaXMubm9vZkkgIT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5tdGwuc2hkSXNMb2FkZWQgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJpbURhdGEoKTtcclxuICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDI0LCAwKTtcclxuICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Ob3JtYWxcIl0ubG9jLCAyNCwgMTIpO1xyXG4gICAgICAgIHRoaXMubXRsLnNoYWRlci51cGRhdGVTaGFkZXJEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuVkJ1Zi5pZCk7XHJcbiAgICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBLmlkKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5JQnVmLmlkKTtcclxuICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLm5vb2ZJLCBnbC5VTlNJR05FRF9JTlQsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMubXRsLnNoZElzTG9hZGVkID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByaW1EYXRhKCk7XHJcbiAgICAgICAgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluUG9zaXRpb25cIl0ubG9jLCAyNCwgMCk7XHJcbiAgICAgICAgdGhpcy5WQnVmLmFwcGx5KHRoaXMubXRsLnNoYWRlci5hdHRyc1tcIkluTm9ybWFsXCJdLmxvYywgMjQsIDEyKTtcclxuICAgICAgICB0aGlzLm10bC5zaGFkZXIudXBkYXRlU2hhZGVyRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBLmlkKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuVkJ1Zi5pZCk7XHJcbiAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMubm9vZlYpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgX3ZlcnRleCB7XHJcbiAgY29uc3RydWN0b3IocG9zLCBub3JtKSB7XHJcbiAgICAodGhpcy5wb3MgPSBwb3MpLCAodGhpcy5ub3JtID0gbm9ybSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdnJ0KHBvcywgbm9ybSkge1xyXG4gIHJldHVybiBuZXcgX3ZlcnRleChwb3MsIG5vcm0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJpbUNyZWF0ZShuYW1lLCB0eXBlLCBtdGwsIHBvcywgc2lkZT0zLCBnbCkge1xyXG4gIGxldCB2aTtcclxuICBpZiAodHlwZSA9PSBcImN1YmVcIikgdmkgPSBjdWJlQ3JlYXRlKCk7XHJcbiAgbGV0IHZlcnQgPSB2aVswXSxcclxuICAgIGluZCA9IHZpWzFdO1xyXG5cclxuICBsZXQgdmVydGV4QXJyYXkgPSBnbC5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xyXG4gIGdsLmJpbmRWZXJ0ZXhBcnJheSh2ZXJ0ZXhBcnJheSk7XHJcbiAgbGV0IHZlcnRleEJ1ZmZlciA9IHZlcnRleF9idWZmZXIodmVydCwgZ2wpO1xyXG5cclxuICBsZXQgaW5kZXhCdWZmZXIgPSBpbmRleF9idWZmZXIoaW5kLCBnbCk7XHJcblxyXG4gIHJldHVybiBuZXcgX3ByaW0oXHJcbiAgICBnbCxcclxuICAgIG5hbWUsXHJcbiAgICB0eXBlLFxyXG4gICAgbXRsLFxyXG4gICAgcG9zLFxyXG4gICAgdmVydGV4QnVmZmVyLFxyXG4gICAgaW5kZXhCdWZmZXIsXHJcbiAgICB2ZXJ0ZXhBcnJheSxcclxuICAgIGluZC5sZW5ndGgsXHJcbiAgICB2ZXJ0Lmxlbmd0aCxcclxuICAgIHNpZGVcclxuICApO1xyXG59IiwiaW1wb3J0IHsgcHJpbUNyZWF0ZSB9IGZyb20gXCIuLi9wcmltcy9wcmltLmpzXCI7XHJcbmltcG9ydCB7IG1hdDQgfSBmcm9tIFwiLi4vbXRoL21hdDQuanNcIjtcclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuLi9tdGgvdmVjMy5qc1wiO1xyXG5cclxuY2xhc3MgX3JlbmRlciB7XHJcbiAgY29uc3RydWN0b3IoY2FudmFzKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMuZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiKTtcclxuICAgIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuREVQVEhfVEVTVCk7XHJcbiAgICB0aGlzLmdsLmNsZWFyQ29sb3IoMC45LCAwLjcsIDAuNywgMSk7XHJcbiAgICB0aGlzLnByZyA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICAgIHRoaXMucHJpbXMgPSBbXTtcclxuICB9XHJcblxyXG4gIHByaW1BdHRhY2gobmFtZSwgdHlwZSwgc2hkX25hbWUsIHBvcywgc2lkZT0zKSB7XHJcbiAgICBsZXQgcCA9IHByaW1DcmVhdGUobmFtZSwgdHlwZSwgc2hkX25hbWUsIHBvcywgc2lkZSwgdGhpcy5nbCk7XHJcbiAgICB0aGlzLnByaW1zW3RoaXMucHJpbXMubGVuZ3RoXSA9IHA7XHJcbiAgfVxyXG5cclxuICBwcm9ncmFtVW5pZm9ybXMoc2hkKSB7XHJcbiAgICBsZXQgbSA9IG1hdDQoKS5tYXRyVmlldyh2ZWMzKDUsIDMsIDUpLCB2ZWMzKDAsIDAsIDApLCB2ZWMzKDAsIDEsIDApKTtcclxuICAgIGxldCBhcnIgPSBtLnRvQXJyYXkoKTtcclxuICAgIGxldCBtVkxvYyA9IHNoZC51bmlmb3Jtc1tcIm1hdHJWaWV3XCJdLmxvYztcclxuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihtVkxvYywgZmFsc2UsIGFycik7XHJcblxyXG4gICAgbGV0IG0xID0gbWF0NCgpLk1hdHJGcnVzdHVtKC0wLjA4LCAwLjA4LCAtMC4wOCwgMC4wOCwgMC4xLCAyMDApO1xyXG4gICAgLy9sZXQgbTEgPSBtYXQ0KCkubWF0ck9ydGhvKC0zLCAzLCAtMywgMywgLTMsIDMpO1xyXG4gICAgbGV0IGFycjEgPSBtMS50b0FycmF5KCk7XHJcbiAgICBsZXQgbVBMb2MgPSBzaGQudW5pZm9ybXNbXCJtYXRyUHJvalwiXS5sb2M7XHJcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobVBMb2MsIGZhbHNlLCBhcnIxKTtcclxuICB9XHJcblxyXG4gIHRyYW5zZm9ybVByb2dyYW1Vbmlmb3JtcyhzaGQpIHtcclxuICAgIGlmIChzaGQudW5pZm9ybXNbXCJUaW1lXCJdID09IHVuZGVmaW5lZClcclxuICAgICAgcmV0dXJuO1xyXG4gICAgbGV0IHRpbWVMb2MgPSBzaGQudW5pZm9ybXNbXCJUaW1lXCJdLmxvYztcclxuXHJcbiAgICBpZiAodGltZUxvYyAhPSAtMSkge1xyXG4gICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgbGV0IHQgPVxyXG4gICAgICAgIGRhdGUuZ2V0TWludXRlcygpICogNjAgK1xyXG4gICAgICAgIGRhdGUuZ2V0U2Vjb25kcygpICtcclxuICAgICAgICBkYXRlLmdldE1pbGxpc2Vjb25kcygpIC8gMTAwMDtcclxuICAgICAgdGhpcy5nbC51bmlmb3JtMWYodGltZUxvYywgdCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICB0aGlzLmdsLmNsZWFyKHRoaXMuZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XHJcbiAgICBcclxuICAgIGZvciAoY29uc3QgcCBvZiB0aGlzLnByaW1zKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICBwLm10bC5zaGFkZXIuaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgIHAubXRsLnNoYWRlci5zaGFkZXJzWzBdLmlkICE9IG51bGwgJiZcclxuICAgICAgICBwLm10bC5zaGFkZXIuc2hhZGVyc1sxXS5pZCAhPSBudWxsICYmXHJcbiAgICAgICAgcC5zaGRJc0xvYWRlZCA9PSBudWxsXHJcbiAgICAgICkge1xyXG4gICAgICAgIHAubXRsLnNoYWRlci5hcHBseSgpO1xyXG4gICAgICAgIHRoaXMucHJvZ3JhbVVuaWZvcm1zKHAubXRsLnNoYWRlcik7XHJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Qcm9ncmFtVW5pZm9ybXMocC5tdGwuc2hhZGVyKTtcclxuICAgICAgICBwLnJlbmRlcigpO1xyXG4gICAgICAgIHAuc2hkSXNMb2FkZWQgPSAxO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBpZiAocC5zaGRJc0xvYWRlZCA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtUHJvZ3JhbVVuaWZvcm1zKHAubXRsLnNoYWRlcik7XHJcbiAgICAgIHAucmVuZGVyKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ3JlYXRlKGNhbnZhcykge1xyXG4gIHJldHVybiBuZXcgX3JlbmRlcihjYW52YXMpO1xyXG59XHJcbiIsImltcG9ydCB7IHJlbmRlckNyZWF0ZSB9IGZyb20gXCIuL3JlbmRlci9yZW5kZXJcIjtcclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuL210aC92ZWMzXCI7XHJcbmxldCBybmQ7XHJcblxyXG4vL0NvbW1vbiB1bmlmb3JtIHZhcmlhYmxlc1xyXG4vL2xldCBtYXRyVmlldyA9IG1hdDQoKS5tYXRyVmlldyh2ZWMzKDUsIDUsIDUpLCB2ZWMzKDAsIDAsIDApLCB2ZWMzKDAsIDEsIDApKTtcclxuLy9sZXQgbWF0clByb2ogPSBtYXQ0KCkubWF0ck9ydGhvKC0zLCAzLCAtMywgMywgLTMsIDMpO1xyXG5cclxuLy8gT3BlbkdMIGluaXRpYWxpemF0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0R0woKSB7XHJcbiAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG4gIHJuZCA9IHJlbmRlckNyZWF0ZShjYW52YXMsIFwiZGVmYXVsdFwiKTtcclxuXHJcbiAgcm5kLnByaW1BdHRhY2goXCJjdWJlUHJpbVwiLCBcImN1YmVcIiwgXCJkZWZhdWx0XCIsIHZlYzMoMCwgMCwgMCkpO1xyXG4gIC8vZm9yIChjb25zdCBwIG9mIHJuZC5wcmltcykgcm5kLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGQpO1xyXG59IC8vIEVuZCBvZiAnaW5pdEdMJyBmdW5jdGlvblxyXG5cclxuLy8gUmVuZGVyIGZ1bmN0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgcm5kLmdsLmNsZWFyKHJuZC5nbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuXHJcbiAgcm5kLnJlbmRlcigpO1xyXG59XHJcblxyXG5jb25zb2xlLmxvZyhcImxpYnJhcnkuanMgd2FzIGltcG9ydGVkXCIpO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcclxuICBpbml0R0woKTtcclxuXHJcbiAgY29uc3QgZHJhdyA9ICgpID0+IHtcclxuICAgIHJlbmRlcigpO1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhdyk7XHJcbiAgfTtcclxuICBkcmF3KCk7XHJcbn0pO1xyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0VBQUEsTUFBTSxPQUFPLENBQUM7RUFDZCxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtFQUM5QixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0VBQ3JCLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDckIsSUFB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QUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0VBQ3JCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0VBQ3BCLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztFQUNuQixJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztFQUNwQixJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDO0VBQ3JCLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDO0VBQ3BCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7RUFDckIsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDO0VBQ3RCLEdBQUcsQ0FBQztBQUNKO0VBQ0EsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDZixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNkLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNiLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNmLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNmLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNoQixHQUFHLENBQUM7RUFDSixFQUFFLElBQUksUUFBUSxHQUFHLEVBQUU7RUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ1YsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7RUFDaEIsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDbEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUM7RUFDUCxNQUFNLENBQUM7RUFDUCxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQztFQUNQLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQztFQUNQLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDO0VBQ1AsTUFBTSxDQUFDO0VBQ1AsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsS0FBSyxDQUFDO0VBQ04sSUFBSSxDQUFDLEVBQUUsQ0FBQztFQUNSLEdBQUc7RUFDSCxFQUFFLElBQUksR0FBRyxHQUFHO0VBQ1osSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7RUFDN0UsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDekIsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLFFBQVEsR0FBRztFQUNiLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElB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LENBQUM7RUFDWixFQUFFLFdBQVcsR0FBRztFQUNoQixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUc7RUFDYixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLEtBQUssQ0FBQztFQUNOLEdBQUc7QUFDSDtFQUNBLEVBQUUsT0FBTyxHQUFHO0VBQ1osSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ25CLElBQUksT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xFLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFO0VBQ25CLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3hCLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRTtFQUNsQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFO0VBQ3ZCLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQzFELEdBQUc7QUFDSDtFQUNBLEVBQUUsV0FBVyxHQUFHO0VBQ2hCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLElBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QjtFQUNBLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzNCO0VBQ0E7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENB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Q0FBQztFQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3RFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDekMsS0FBSyxDQUFDO0VBQ04sSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxhQUFhLEdBQUc7RUFDbEIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3hCO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3ZELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbkQsSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxXQUFXLENBQUMsYUFBYSxFQUFFO0VBQzdCLElBQUksSUFBSSxDQUFDLEdBQUcsYUFBYSxHQUFHLGtCQUFrQixHQUFHLEdBQUc7RUFDcEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUN0QjtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztFQUNWLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDckIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixLQUFLLENBQUM7RUFDTixJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFdBQVcsQ0FBQyxhQUFhLEVBQUU7RUFDN0IsSUFBSSxJQUFJLENBQUMsR0FBRyxhQUFhLEdBQUcsa0JBQWtCLEdBQUcsR0FBRztFQUNwRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0QixNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3RCO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0VBQ1YsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ3JCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUNwQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLGFBQWEsRUFBRTtFQUM3QixJQUFJLElBQUksQ0FBQyxHQUFHLGFBQWEsR0FBRyxrQkFBa0IsR0FBRyxHQUFHO0VBQ3BELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3RCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3RCLE1BQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDdEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3BCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNyQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsS0FBSyxDQUFDO0VBQ04sSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxTQUFTLENBQUMsQ0FBQyxFQUFFO0VBQ2YsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3hCO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0VBQ1YsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDcEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDcEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDcEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixLQUFLLENBQUM7RUFDTixJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0EsRUFBRSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDOUIsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ3hCO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0VBQ1YsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDNUIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDNUIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3JFLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ0EsU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7RUFDcEUsRUFBRTtFQUNGLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0VBQ25CLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0VBQ25CLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0VBQ25CLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0VBQ25CLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0VBQ25CLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0VBQ25CLElBQUk7RUFDSixDQUFDO0FBQ0Q7RUFDQSxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUU7RUFDdkIsRUFBRSxJQUFJLENBQUM7RUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDZCxNQUFNLGFBQWE7RUFDbkIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsT0FBTztFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixPQUFPO0VBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2QsTUFBTSxhQUFhO0VBQ25CLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLE9BQU87RUFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDZCxNQUFNLGFBQWE7RUFDbkIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsT0FBTyxDQUFDO0VBQ1IsRUFBRSxPQUFPLENBQUMsQ0FBQztFQUNYLENBQUM7QUFDRDtFQUNPLFNBQVMsSUFBSSxHQUFHO0VBQ3ZCLEVBQUUsT0FBTyxJQUFJLEtBQUssRUFBRSxDQUFDO0VBQ3JCOztFQ3BqQkEsTUFBTSxLQUFLLENBQUM7RUFDWixFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUN2QixJQUFJLElBQUksT0FBTyxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUU7RUFDL0IsTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTLEVBQUU7RUFDMUIsUUFBUSxPQUFPO0VBQ2YsT0FBTztFQUNQLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3JELEtBQUs7RUFDTCxTQUFTLElBQUksQ0FBQyxJQUFJLFNBQVMsSUFBSSxDQUFDLElBQUksU0FBUztFQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUMvQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNsRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMvRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMvRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUNoQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN6RCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUNoQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPO0VBQ3ZCLElBQUksT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3pELEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxPQUFPLEdBQUc7RUFDWixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNoRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdEQsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLE9BQU8sR0FBRztFQUNaLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNyQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0VBQ3pDLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxhQUFhLEdBQUc7RUFDbEIsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDO0VBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQztFQUMxQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDM0MsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLGFBQWEsQ0FBQyxDQUFDLEVBQUU7RUFDbkIsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLElBQUksQ0FBQztFQUNULE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRTtFQUNBLElBQUksT0FBTyxJQUFJLEtBQUs7RUFDcEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUM5RSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQzlFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDOUUsS0FBSyxDQUFDO0VBQ04sR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLGFBQWEsQ0FBQyxDQUFDLEVBQUU7RUFDbkIsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDakMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNqQyxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtFQUNwQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSztFQUNyQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDM0UsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRSxLQUFLLENBQUM7QUFDTjtFQUNBLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ08sU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDOUIsRUFBRSxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxD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LEVBQUU7RUFDaEQsSUFBSSxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDakUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3RDLEdBQUc7QUFDSDtFQUNBLEVBQUUsZUFBZSxDQUFDLEdBQUcsRUFBRTtFQUN2QixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3pFLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0VBQzFCLElBQUksSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDN0MsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDaEQ7RUFDQSxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztFQUNwRTtFQUNBLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0VBQzVCLElBQUksSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDN0MsSUFBSSxJ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
