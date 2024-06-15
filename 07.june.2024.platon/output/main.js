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

  class _vec3 {
    constructor(x, y, z) {
      if (typeof x != "number") {
        if (x == undefined) {
          return;
        }
        (this.x = obj.x), (this.y = obj.y), (this.z = obj.z);
      }
      if (typeof y != undefined && typeof z != undefined)
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

  function cubeCreate(pos, side) {
    /* let sx = 0 + side,
      sy = pos.y + side,
      sz = pos.z - side; */
    let p = [
      [pos.x, pos.y, pos.z],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, -1],
      [1, 1, -1],
      [1, 0, -1],
      [0, 0, -1],
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
      14, 17, 18, 13, 7, 10,
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

    return [vertexes, ind, 27, 24];
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
      /*
      this.shaders.forEach((s) => {
        if (s.id != null) this.gl.attachShader(this.id, s.id);
      });
      */
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

  class _material {
    constructor(shd, ubo) {
      this.shader = shd;
      this.ubo = ubo;
    }
  }

  class _prim {
    constructor(gl, name, type, shd_name, pos, VBuf, IBuf, VA, side = 5) {
      this.name = name;
      (this.VBuf = VBuf), (this.IBuf = IBuf), (this.VA = VA); /* render info */
      this.type = type; /* platon figure type */
      this.side = side; /* platon figure side lenght */
      this.pos = pos; /* position */

      let shd = shader(shd_name, gl);
      this.shdIsLoaded = null;
      this.mtl = new _material(shd, null);
    }

    render(gl) {
      if (this.noofI != null) {
        if (this.mtl.shdIsLoaded == null) {
          this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
          this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
        gl.bindVertexArray(this.VA.id);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBuf.id);
        gl.drawElements(gl.TRIANGLE_STRIP, this.noofI, gl.UNSIGNED_INT, 0);
      } else {
        if (this.mtl.shdIsLoaded == null) {
          this.VBuf.apply(this.mtl.shader.attrs["InPosition"].loc, 24, 0);
          this.VBuf.apply(this.mtl.shader.attrs["InNormal"].loc, 24, 12);
        }
        gl.bindVertexArray(this.VA.id);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBuf.id);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.noofV);
      }
    }
  }

  function primCreate(name, type, mtl, pos, side = 5, gl) {
    let vi;
    if (type == "cube") vi = cubeCreate(pos);
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
      side
    );
  }

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
      let a = D2R(angle),
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
    MatrRotateX(angleInDegree) {
      let a = Math.D2R(angleInDegree),
        si = Math.sin(a),
        co = Math.cos(a),
        m = new _mat4();

      m.a = [
        [1, 0, 0, 0],
        [0, co, si, 0],
        [0, -si, co, 0],
        [0, 0, 0, 1],
      ];
    }

    //Rotation by Y matrix
    MatrRotateY(angleInDegree) {
      let a = Math.D2R(angleInDegree),
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
    MatrRotateY(angleInDegree) {
      let a = Math.D2R(angleInDegree),
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

  class _render {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext("webgl2");
      this.gl.clearColor(0.9, 0.7, 0.7, 1);
      this.prg = this.gl.createProgram();

      this.prims = [];
    }

    primAttach(name, type, shd_name, pos, side = 5) {
      let p = primCreate(name, type, shd_name, pos, side, this.gl);
      this.prims[this.prims.length] = p;
    }

    programUniforms(shd) {
      let m = mat4().matrView(vec3(5, 5, 5), vec3(0, 0, 0), vec3(0, 1, 0));
      let arr = m.toArray();
      let mVLoc = shd.uniforms["matrView"].loc;
      this.gl.uniformMatrix4fv(mVLoc, false, arr);

      let m1 = mat4().matrOrtho(-3, 3, -3, 3, -3, 3);
      let arr1 = m1.toArray();
      let mPLoc = shd.uniforms["matrProj"].loc;
      this.gl.uniformMatrix4fv(mPLoc, false, arr1);

      /*
      let timeLoc = shd.uniforms["Time"].loc;

      if (timeLoc != -1) {
        const date = new Date();
        let t =
          date.getMinutes() * 60 +
          date.getSeconds() +
          date.getMilliseconds() / 1000;
        gl.uniform1f(timeLoc, t);
      }
      */
      shd.updateShaderData();
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
          p.render(this.gl);
          this.programUniforms(p.mtl.shader);
          p.shdIsLoaded = 1;
        }
        if (p.shdIsLoaded == null) return;
        p.render(this.gl);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vVUJPL3Viby5qcyIsIi4uL210aC92ZWMzLmpzIiwiLi4vcHJpbXMvY3ViZS5qcyIsIi4uL3NoZC9zaGFkZXIuanMiLCIuLi9wcmltcy9wcmltLmpzIiwiLi4vbXRoL21hdDQuanMiLCIuLi9yZW5kZXIvcmVuZGVyLmpzIiwiLi4vbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih0eXBlLCBzaXplLCBnbCkge1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTsgLy8gQnVmZmVyIHR5cGUgKGdsLioqKl9CVUZGRVIpXHJcbiAgICB0aGlzLnNpemUgPSBzaXplOyAvLyBCdWZmZXIgc2l6ZSBpbiBieXRlc1xyXG4gICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICBpZiAoc2l6ZSA9PSAwIHx8IHR5cGUgPT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKHR5cGUsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YSh0eXBlLCBzaXplLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgfVxyXG4gIHVwZGF0ZShkYXRhKSB7fVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBidWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ2J1ZmZlcicgZnVuY3Rpb25cclxuXHJcbmNsYXNzIF91Ym9fYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IobmFtZSwgc2l6ZSwgYmluZFBvaW50KSB7XHJcbiAgICBzdXBlcih0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCBzaXplKTtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmJpbmRQb2ludCA9IGJpbmRQb2ludDsgLy8gQnVmZmVyIEdQVSBiaW5kaW5nIHBvaW50XHJcbiAgfVxyXG4gIGFwcGx5KHNoZCkge1xyXG4gICAgaWYgKFxyXG4gICAgICBzaGQgPT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgIHNoZC5pZCA9PSB1bmRlZmluZWQgfHxcclxuICAgICAgc2hkLnVuaWZvcm1CbG9ja3NbdGhpcy5uYW1lXSA9PSB1bmRlZmluZWRcclxuICAgIClcclxuICAgICAgcmV0dXJuO1xyXG4gICAgZ2wudW5pZm9ybUJsb2NrQmluZGluZyhcclxuICAgICAgc2hkLmlkLFxyXG4gICAgICBzaGQudW5pZm9ybUJsb2Nrc1t0aGlzLm5hbWVdLmluZGV4LFxyXG4gICAgICB0aGlzLmJpbmRQb2ludFxyXG4gICAgKTtcclxuICAgIGdsLmJpbmRCdWZmZXJCYXNlKHRoaXMuZ2wuVU5JRk9STV9CVUZGRVIsIHRoaXMuYmluZFBvaW50LCB0aGlzLmlkKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHVib19idWZmZXIoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3Vib19idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG5cclxuY2xhc3MgX3ZlcnRleF9idWZmZXIgZXh0ZW5kcyBfYnVmZmVyIHtcclxuICBjb25zdHJ1Y3Rvcih2QXJyYXksIGdsKSB7XHJcbiAgICBjb25zdCBuID0gdkFycmF5Lmxlbmd0aDtcclxuICAgIHN1cGVyKGdsLkFSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgdGhpcy5nbC5BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkodkFycmF5KSxcclxuICAgICAgdGhpcy5nbC5TVEFUSUNfRFJBV1xyXG4gICAgKTtcclxuICB9XHJcbiAgYXBwbHkoTG9jLCBzaXplLCBvZmZzZXQpIHtcclxuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihMb2MsIDMsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCBzaXplLCBvZmZzZXQpO1xyXG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShMb2MpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gdmVydGV4X2J1ZmZlciguLi5hcmdzKSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVydGV4X2J1ZmZlciguLi5hcmdzKTtcclxufSAvLyBFbmQgb2YgJ3ZlcnRleF9idWZmZXInIGZ1bmN0aW9uXHJcblxyXG5jbGFzcyBfaW5kZXhfYnVmZmVyIGV4dGVuZHMgX2J1ZmZlciB7XHJcbiAgY29uc3RydWN0b3IoaUFycmF5LCBnbCkge1xyXG4gICAgY29uc3QgbiA9IGlBcnJheS5sZW5ndGg7XHJcbiAgICBzdXBlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbiAqIDQsIGdsKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaWQpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBVaW50MzJBcnJheShpQXJyYXkpLFxyXG4gICAgICB0aGlzLmdsLlNUQVRJQ19EUkFXXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhfYnVmZmVyKC4uLmFyZ3MpIHtcclxuICByZXR1cm4gbmV3IF9pbmRleF9idWZmZXIoLi4uYXJncyk7XHJcbn0gLy8gRW5kIG9mICd1Ym9fYnVmZmVyJyBmdW5jdGlvblxyXG4iLCJjbGFzcyBfdmVjMyB7XHJcbiAgY29uc3RydWN0b3IoeCwgeSwgeikge1xyXG4gICAgaWYgKHR5cGVvZiB4ICE9IFwibnVtYmVyXCIpIHtcclxuICAgICAgaWYgKHggPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgICh0aGlzLnggPSBvYmoueCksICh0aGlzLnkgPSBvYmoueSksICh0aGlzLnogPSBvYmoueik7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHkgIT0gdW5kZWZpbmVkICYmIHR5cGVvZiB6ICE9IHVuZGVmaW5lZClcclxuICAgICAgKHRoaXMueCA9IHgpLCAodGhpcy55ID0geSksICh0aGlzLnogPSB6KTtcclxuICAgIGVsc2UgKHRoaXMueCA9IHgpLCAodGhpcy55ID0geCksICh0aGlzLnogPSB4KTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyBhZGQgYW5vdGhlclxyXG4gIHZlYzNBZGRWZWMzKHYpIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzModGhpcy54ICsgdi54LCB0aGlzLnkgKyB2LnksIHRoaXMueiArIHYueik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgc3Vic3RyYWN0IGFub3RoZXJcclxuICB2ZWMzU3ViVmVjMyh2KSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55LCB0aGlzLnogLSB2LnopO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIG11bHRpcGxpY2F0ZWQgYnkgbnVtYmVyXHJcbiAgdmVjM011bE51bShuKSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCAqIG4sIHRoaXMueSAqIG4sIHRoaXMueiAqIG4pO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIGRldmlkZWQgYnkgbnVtYmVyXHJcbiAgdmVjM0Rpdk51bShuKSB7XHJcbiAgICBpZiAobiA9PSAwKSByZXR1cm47XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKHRoaXMueCAvIG4sIHRoaXMueSAvIG4sIHRoaXMueiAvIG4pO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIE5lZ2F0aXZlXHJcbiAgdmVjM05lZygpIHtcclxuICAgIHJldHVybiBuZXcgX3ZlYzMoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XHJcbiAgfVxyXG5cclxuICAvL1R3byB2ZWN0b3JzMyBkb3QgcHJvZHVjdFxyXG4gIHZlYzNEb3RWZWMzKHYpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2Lno7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgTGVuZ2h0IGV2YWx1YXRpb25cclxuICB2ZWMzTGVuKCkge1xyXG4gICAgbGV0IGxlbiA9IHRoaXMudmVjM0RvdFZlYzModGhpcyk7XHJcbiAgICBpZiAobGVuID09IDAgfHwgbGVuID09IDEpIHJldHVybiBsZW47XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGxlbik7XHJcbiAgfVxyXG5cclxuICAvL1ZlY3RvcjMgTm9ybWFsaXplXHJcbiAgdmVjM05vcm1hbGl6ZSgpIHtcclxuICAgIGxldCBsZW4gPSB0aGlzLnZlYzNEb3RWZWMzKHRoaXMpO1xyXG5cclxuICAgIGlmIChsZW4gPT0gMSB8fCBsZW4gPT0gMCkgcmV0dXJuIHRoaXM7XHJcbiAgICByZXR1cm4gdGhpcy52ZWMzRGl2TnVtKE1hdGguc3FydChsZW4pKTtcclxuICB9XHJcblxyXG4gIC8vVmVjdG9yMyB0cmFuc2ZvbWF0aW9uXHJcbiAgdmVjM1RyYW5zZm9ybShtKSB7XHJcbiAgICByZXR1cm4gbmV3IF92ZWMzKFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMF0gKyB0aGlzLnkgKiBtLmFbMV1bMF0gKyB0aGlzLnogKiBtLmFbMl1bMF0sXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVsxXSArIHRoaXMueSAqIG0uYVsxXVsxXSArIHRoaXMueiAqIG0uYVsyXVsxXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzJdICsgdGhpcy55ICogbS5hWzFdWzJdICsgdGhpcy56ICogbS5hWzJdWzJdXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy9WZWN0b3IzIGJ5IG1hdHJpeCBtdWx0aXBsaWNhdGlvbiAod2l0aCBob21vZ2VuaW91cyBkZXZpZGUpXHJcbiAgdmVjM011bE1hdHIobSkge1xyXG4gICAgbGV0IHcgPVxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bM10gKyB0aGlzLnkgKiBtLmFbMV1bM10gKyB0aGlzLnogKiBtLmFbMl1bM10gKyBtLmFbM11bM107XHJcblxyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyhcclxuICAgICAgKFYuWCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIFYuWiAqIG0uYVsyXVswXSArIG0uYVszXVswXSkgLyB3LFxyXG4gICAgICAoVi5YICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgVi5aICogbS5hWzJdWzFdICsgbS5hWzNdWzFdKSAvIHcsXHJcbiAgICAgIChWLlggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyBWLlogKiBtLmFbMl1bMl0gKyBtLmFbM11bMl0pIC8gd1xyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vQ3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9yc1xyXG4gIHZlYzNDcm9zc1ZlYzModikge1xyXG4gICAgcmV0dXJuIG5ldyBfdmVjMyhcclxuICAgICAgdGhpcy55ICogdi56IC0gdGhpcy56ICogdi55LFxyXG4gICAgICB0aGlzLnogKiB2LnggLSB0aGlzLnggKiB2LnosXHJcbiAgICAgIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vUG9pbnQgYnkgbWF0cml4IHRyYW5zZm9ybWF0aW9uXHJcbiAgcG9pbnRUcmFuc2Zvcm0obSkge1xyXG4gICAgbGV0IHYgPSBuZXcgX3ZlYzMoXHJcbiAgICAgIHRoaXMueCAqIG0uYVswXVswXSArIHRoaXMueSAqIG0uYVsxXVswXSArIFYuWiAqIG0uYVsyXVswXSArIG0uYVszXVswXSxcclxuICAgICAgdGhpcy54ICogbS5hWzBdWzFdICsgdGhpcy55ICogbS5hWzFdWzFdICsgVi5aICogbS5hWzJdWzFdICsgbS5hWzNdWzFdLFxyXG4gICAgICB0aGlzLnggKiBtLmFbMF1bMl0gKyB0aGlzLnkgKiBtLmFbMV1bMl0gKyBWLlogKiBtLmFbMl1bMl0gKyBtLmFbM11bMl1cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmVjMyh4LCB5LCB6KSB7XHJcbiAgcmV0dXJuIG5ldyBfdmVjMyh4LCB5LCB6KTtcclxufVxyXG4iLCJpbXBvcnQgeyB2ZWMzIH0gZnJvbSBcIi4uL210aC92ZWMzLmpzXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3ViZUNyZWF0ZShwb3MsIHNpZGUpIHtcclxuICAvKiBsZXQgc3ggPSAwICsgc2lkZSxcclxuICAgIHN5ID0gcG9zLnkgKyBzaWRlLFxyXG4gICAgc3ogPSBwb3MueiAtIHNpZGU7ICovXHJcbiAgbGV0IHAgPSBbXHJcbiAgICBbcG9zLngsIHBvcy55LCBwb3Muel0sXHJcbiAgICBbMSwgMCwgMF0sXHJcbiAgICBbMSwgMSwgMF0sXHJcbiAgICBbMCwgMSwgMF0sXHJcbiAgICBbMCwgMSwgLTFdLFxyXG4gICAgWzEsIDEsIC0xXSxcclxuICAgIFsxLCAwLCAtMV0sXHJcbiAgICBbMCwgMCwgLTFdLFxyXG4gIF07XHJcblxyXG4gIGxldCBuID0gW1xyXG4gICAgWy0xLCAtMSwgMV0sXHJcbiAgICBbMSwgLTEsIDFdLFxyXG4gICAgWzEsIDEsIDFdLFxyXG4gICAgWy0xLCAxLCAxXSxcclxuICAgIFstMSwgMSwgLTFdLFxyXG4gICAgWzEsIDEsIC0xXSxcclxuICAgIFsxLCAtMSwgLTFdLFxyXG4gICAgWy0xLCAtMSwgLTFdLFxyXG4gIF07XHJcbiAgbGV0IHZlcnRleGVzID0gW10sXHJcbiAgICBqID0gMDtcclxuICB3aGlsZSAoaiA8IDgpIHtcclxuICAgIHZlcnRleGVzW2pdID0gW1xyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICBuW2pdWzBdLFxyXG4gICAgICAwLFxyXG4gICAgICAwLFxyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICAwLFxyXG4gICAgICBuW2pdWzFdLFxyXG4gICAgICAwLFxyXG4gICAgICAuLi5wW2pdLFxyXG4gICAgICAwLFxyXG4gICAgICAwLFxyXG4gICAgICBuW2pdWzJdLFxyXG4gICAgXTtcclxuICAgIGorKztcclxuICB9XHJcbiAgbGV0IGluZCA9IFtcclxuICAgIDIsIDExLCA1LCA4LCA2LCAzLCAxNSwgMTgsIDE5LCAyMiwgNCwgMSwgMCwgOSwgMjEsIDEyLCAxNCwgMTcsIDIzLCAyMCwgMjMsXHJcbiAgICAxNCwgMTcsIDE4LCAxMywgNywgMTAsXHJcbiAgXTtcclxuXHJcbiAgdmVydGV4ZXMgPSBbXHJcbiAgICAuLi52ZXJ0ZXhlc1swXSxcclxuICAgIC4uLnZlcnRleGVzWzFdLFxyXG4gICAgLi4udmVydGV4ZXNbMl0sXHJcbiAgICAuLi52ZXJ0ZXhlc1szXSxcclxuICAgIC4uLnZlcnRleGVzWzRdLFxyXG4gICAgLi4udmVydGV4ZXNbNV0sXHJcbiAgICAuLi52ZXJ0ZXhlc1s2XSxcclxuICAgIC4uLnZlcnRleGVzWzddLFxyXG4gIF07XHJcblxyXG4gIHJldHVybiBbdmVydGV4ZXMsIGluZCwgMjcsIDI0XTtcclxufVxyXG4iLCJjbGFzcyBfc2hhZGVyIHtcclxuICBhc3luYyBfaW5pdChuYW1lLCBnbCkge1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgdGhpcy5zaGFkZXJzID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgdHlwZTogdGhpcy5nbC5WRVJURVhfU0hBREVSLFxyXG4gICAgICAgIG5hbWU6IFwidmVydFwiLFxyXG4gICAgICAgIHNyYzogXCJcIixcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIHR5cGU6IHRoaXMuZ2wuRlJBR01FTlRfU0hBREVSLFxyXG4gICAgICAgIG5hbWU6IFwiZnJhZ1wiLFxyXG4gICAgICAgIHNyYzogXCJcIixcclxuICAgICAgfSxcclxuICAgIF07XHJcbiAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zaGFkZXJzKSB7XHJcbiAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBiaW4vc2hhZGVycy8ke25hbWV9LyR7cy5uYW1lfS5nbHNsYCk7XHJcbiAgICAgIGxldCBzcmMgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgIGlmICh0eXBlb2Ygc3JjID09IFwic3RyaW5nXCIgJiYgc3JjICE9IFwiXCIpIHMuc3JjID0gc3JjO1xyXG4gICAgfVxyXG4gICAgLy8gcmVjb21waWxlIHNoYWRlcnNcclxuICAgIHRoaXMudXBkYXRlU2hhZGVyc1NvdXJjZSgpO1xyXG4gIH1cclxuICB1cGRhdGVTaGFkZXJzU291cmNlKCkge1xyXG4gICAgdGhpcy5zaGFkZXJzWzBdLmlkID0gbnVsbDtcclxuICAgIHRoaXMuc2hhZGVyc1sxXS5pZCA9IG51bGw7XHJcbiAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgIGlmICh0aGlzLnNoYWRlcnNbMF0uc3JjID09IFwiXCIgfHwgdGhpcy5zaGFkZXJzWzFdLnNyYyA9PSBcIlwiKSByZXR1cm47XHJcbiAgICBmb3IgKGNvbnN0IHMgb2YgdGhpcy5zaGFkZXJzKSB7XHJcbiAgICAgIHMuaWQgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcihzLnR5cGUpO1xyXG4gICAgICB0aGlzLmdsLnNoYWRlclNvdXJjZShzLmlkLCBzLnNyYyk7XHJcbiAgICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcihzLmlkKTtcclxuICAgICAgaWYgKCF0aGlzLmdsLmdldFNoYWRlclBhcmFtZXRlcihzLmlkLCB0aGlzLmdsLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgICAgIGxldCBidWYgPSB0aGlzLmdsLmdldFNoYWRlckluZm9Mb2cocy5pZCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFNoYWRlciAke3RoaXMubmFtZX0vJHtzLm5hbWV9IGNvbXBpbGUgZmFpbDogJHtidWZ9YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuaWQgPSB0aGlzLmdsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgIC8qXHJcbiAgICB0aGlzLnNoYWRlcnMuZm9yRWFjaCgocykgPT4ge1xyXG4gICAgICBpZiAocy5pZCAhPSBudWxsKSB0aGlzLmdsLmF0dGFjaFNoYWRlcih0aGlzLmlkLCBzLmlkKTtcclxuICAgIH0pO1xyXG4gICAgKi9cclxuICAgIGZvciAoY29uc3QgcyBvZiB0aGlzLnNoYWRlcnMpIHtcclxuICAgICAgaWYgKHMuaWQgIT0gbnVsbCkgdGhpcy5nbC5hdHRhY2hTaGFkZXIodGhpcy5pZCwgcy5pZCk7XHJcbiAgICB9XHJcbiAgICBsZXQgcHJnID0gdGhpcy5pZDtcclxuICAgIHRoaXMuZ2wubGlua1Byb2dyYW0ocHJnKTtcclxuICAgIGlmICghdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByZywgdGhpcy5nbC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgbGV0IGJ1ZiA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJnKTtcclxuICAgICAgY29uc29sZS5sb2coYFNoYWRlciBwcm9ncmFtICR7dGhpcy5uYW1lfSBsaW5rIGZhaWw6ICR7YnVmfWApO1xyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGVTaGFkZXJEYXRhKCk7XHJcbiAgfVxyXG4gIHVwZGF0ZVNoYWRlckRhdGEoKSB7XHJcbiAgICAvLyBTaGFkZXIgYXR0cmlidXRlc1xyXG4gICAgdGhpcy5hdHRycyA9IHt9O1xyXG4gICAgY29uc3QgY291bnRBdHRycyA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihcclxuICAgICAgdGhpcy5pZCxcclxuICAgICAgdGhpcy5nbC5BQ1RJVkVfQVRUUklCVVRFU1xyXG4gICAgKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnRBdHRyczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdsLmdldEFjdGl2ZUF0dHJpYih0aGlzLmlkLCBpKTtcclxuICAgICAgdGhpcy5hdHRyc1tpbmZvLm5hbWVdID0ge1xyXG4gICAgICAgIG5hbWU6IGluZm8ubmFtZSxcclxuICAgICAgICB0eXBlOiBpbmZvLnR5cGUsXHJcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxyXG4gICAgICAgIGxvYzogdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmlkLCBpbmZvLm5hbWUpLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNoYWRlciB1bmlmb3Jtc1xyXG4gICAgdGhpcy51bmlmb3JtcyA9IHt9O1xyXG4gICAgY29uc3QgY291bnRVbmlmb3JtcyA9IHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihcclxuICAgICAgdGhpcy5pZCxcclxuICAgICAgdGhpcy5nbC5BQ1RJVkVfVU5JRk9STVNcclxuICAgICk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50VW5pZm9ybXM7IGkrKykge1xyXG4gICAgICBjb25zdCBpbmZvID0gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtKHRoaXMuaWQsIGkpO1xyXG4gICAgICB0aGlzLnVuaWZvcm1zW2luZm8ubmFtZV0gPSB7XHJcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxyXG4gICAgICAgIHR5cGU6IGluZm8udHlwZSxcclxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXHJcbiAgICAgICAgbG9jOiB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmlkLCBpbmZvLm5hbWUpLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNoYWRlciB1bmlmb3JtIGJsb2Nrc1xyXG4gICAgdGhpcy51bmlmb3JtQmxvY2tzID0ge307XHJcbiAgICBjb25zdCBjb3VudFVuaWZvcm1CbG9ja3MgPSB0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIoXHJcbiAgICAgIHRoaXMuaWQsXHJcbiAgICAgIHRoaXMuZ2wuQUNUSVZFX1VOSUZPUk1fQkxPQ0tTXHJcbiAgICApO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudFVuaWZvcm1CbG9ja3M7IGkrKykge1xyXG4gICAgICBjb25zdCBibG9ja19uYW1lID0gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtQmxvY2tOYW1lKHRoaXMuaWQsIGkpO1xyXG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybUJsb2NrSW5kZXgodGhpcy5pZCwgYmxvY2tfbmFtZSk7XHJcbiAgICAgIHRoaXMudW5pZm9ybUJsb2Nrc1tibG9ja19uYW1lXSA9IHtcclxuICAgICAgICBuYW1lOiBibG9ja19uYW1lLFxyXG4gICAgICAgIGluZGV4OiBpbmRleCxcclxuICAgICAgICBzaXplOiB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja1BhcmFtZXRlcihcclxuICAgICAgICAgIHRoaXMuaWQsXHJcbiAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICB0aGlzLmdsLlVOSUZPUk1fQkxPQ0tfREFUQV9TSVpFXHJcbiAgICAgICAgKSxcclxuICAgICAgICBiaW5kOiB0aGlzLmdsLmdldEFjdGl2ZVVuaWZvcm1CbG9ja1BhcmFtZXRlcihcclxuICAgICAgICAgIHRoaXMuaWQsXHJcbiAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICB0aGlzLmdsLlVOSUZPUk1fQkxPQ0tfQklORElOR1xyXG4gICAgICAgICksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0cnVjdG9yKG5hbWUsIGdsKSB7XHJcbiAgICB0aGlzLl9pbml0KG5hbWUsIGdsKTtcclxuICB9XHJcbiAgYXBwbHkoKSB7XHJcbiAgICBpZiAodGhpcy5pZCAhPSBudWxsKSB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5pZCk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzaGFkZXIobmFtZSwgZ2wpIHtcclxuICByZXR1cm4gbmV3IF9zaGFkZXIobmFtZSwgZ2wpO1xyXG59XHJcbi8qXHJcbmxldCBzcmMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNoZFZlcnRTcmNcIikudmFsdWU7XHJcbnNoZC5zaGFkZXJzWzBdLnNyYyA9IHNyYztcclxuc2hkLnVwZGF0ZVNoYWRlcnNTb3VyY2UoKTtcclxuKi9cclxuIiwiaW1wb3J0IHsgaW5kZXhfYnVmZmVyLCB2ZXJ0ZXhfYnVmZmVyIH0gZnJvbSBcIi4uL1VCTy91Ym8uanNcIjtcclxuaW1wb3J0IHsgY3ViZUNyZWF0ZSB9IGZyb20gXCIuL2N1YmUuanNcIjtcclxuaW1wb3J0IHsgc2hhZGVyIH0gZnJvbSBcIi4uL3NoZC9zaGFkZXIuanNcIjtcclxuXHJcbmNsYXNzIF9tYXRlcmlhbCB7XHJcbiAgY29uc3RydWN0b3Ioc2hkLCB1Ym8pIHtcclxuICAgIHRoaXMuc2hhZGVyID0gc2hkO1xyXG4gICAgdGhpcy51Ym8gPSB1Ym87XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBfcHJpbSB7XHJcbiAgY29uc3RydWN0b3IoZ2wsIG5hbWUsIHR5cGUsIHNoZF9uYW1lLCBwb3MsIFZCdWYsIElCdWYsIFZBLCBzaWRlID0gNSkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICh0aGlzLlZCdWYgPSBWQnVmKSwgKHRoaXMuSUJ1ZiA9IElCdWYpLCAodGhpcy5WQSA9IFZBKTsgLyogcmVuZGVyIGluZm8gKi9cclxuICAgIHRoaXMudHlwZSA9IHR5cGU7IC8qIHBsYXRvbiBmaWd1cmUgdHlwZSAqL1xyXG4gICAgdGhpcy5zaWRlID0gc2lkZTsgLyogcGxhdG9uIGZpZ3VyZSBzaWRlIGxlbmdodCAqL1xyXG4gICAgdGhpcy5wb3MgPSBwb3M7IC8qIHBvc2l0aW9uICovXHJcblxyXG4gICAgbGV0IHNoZCA9IHNoYWRlcihzaGRfbmFtZSwgZ2wpO1xyXG4gICAgdGhpcy5zaGRJc0xvYWRlZCA9IG51bGw7XHJcbiAgICB0aGlzLm10bCA9IG5ldyBfbWF0ZXJpYWwoc2hkLCBudWxsKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcihnbCkge1xyXG4gICAgaWYgKHRoaXMubm9vZkkgIT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5tdGwuc2hkSXNMb2FkZWQgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuVkJ1Zi5hcHBseSh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJblBvc2l0aW9uXCJdLmxvYywgMjQsIDApO1xyXG4gICAgICAgIHRoaXMuVkJ1Zi5hcHBseSh0aGlzLm10bC5zaGFkZXIuYXR0cnNbXCJJbk5vcm1hbFwiXS5sb2MsIDI0LCAxMik7XHJcbiAgICAgIH1cclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuVkJ1Zi5pZCk7XHJcbiAgICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBLmlkKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5JQnVmLmlkKTtcclxuICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLm5vb2ZJLCBnbC5VTlNJR05FRF9JTlQsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMubXRsLnNoZElzTG9hZGVkID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Qb3NpdGlvblwiXS5sb2MsIDI0LCAwKTtcclxuICAgICAgICB0aGlzLlZCdWYuYXBwbHkodGhpcy5tdGwuc2hhZGVyLmF0dHJzW1wiSW5Ob3JtYWxcIl0ubG9jLCAyNCwgMTIpO1xyXG4gICAgICB9XHJcbiAgICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBLmlkKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuVkJ1Zi5pZCk7XHJcbiAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMubm9vZlYpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgX3ZlcnRleCB7XHJcbiAgY29uc3RydWN0b3IocG9zLCBub3JtKSB7XHJcbiAgICAodGhpcy5wb3MgPSBwb3MpLCAodGhpcy5ub3JtID0gbm9ybSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdnJ0KHBvcywgbm9ybSkge1xyXG4gIHJldHVybiBuZXcgX3ZlcnRleChwb3MsIG5vcm0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJpbUNyZWF0ZShuYW1lLCB0eXBlLCBtdGwsIHBvcywgc2lkZSA9IDUsIGdsKSB7XHJcbiAgbGV0IHZpO1xyXG4gIGlmICh0eXBlID09IFwiY3ViZVwiKSB2aSA9IGN1YmVDcmVhdGUocG9zLCBzaWRlKTtcclxuICBsZXQgdmVydCA9IHZpWzBdLFxyXG4gICAgaW5kID0gdmlbMV07XHJcblxyXG4gIGxldCB2ZXJ0ZXhBcnJheSA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgZ2wuYmluZFZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcclxuICBsZXQgdmVydGV4QnVmZmVyID0gdmVydGV4X2J1ZmZlcih2ZXJ0LCBnbCk7XHJcblxyXG4gIGxldCBpbmRleEJ1ZmZlciA9IGluZGV4X2J1ZmZlcihpbmQsIGdsKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBfcHJpbShcclxuICAgIGdsLFxyXG4gICAgbmFtZSxcclxuICAgIHR5cGUsXHJcbiAgICBtdGwsXHJcbiAgICBwb3MsXHJcbiAgICB2ZXJ0ZXhCdWZmZXIsXHJcbiAgICBpbmRleEJ1ZmZlcixcclxuICAgIHZlcnRleEFycmF5LFxyXG4gICAgc2lkZVxyXG4gICk7XHJcbn1cclxuIiwiLy9pbXBvcnQge3ZlYzN9IGZyb20gXCIuL3ByaW1zL3ZlYzNcIlxyXG5cclxuY2xhc3MgX21hdDQge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgdG9BcnJheSgpIHtcclxuICAgIGxldCB0ID0gdGhpcy5hO1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdCh0WzBdKS5jb25jYXQodFsxXSkuY29uY2F0KHRbMl0pLmNvbmNhdCh0WzNdKTtcclxuICB9XHJcblxyXG4gIC8vVHJhbnNsYXRlIG1hdHJpeFxyXG4gIG1hdHJUcmFuc2xhdGUodikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgWzEsIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAxLCAwXSxcclxuICAgICAgW3YueCwgdi55LCB2LnosIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9NdWx0aXBseWluZyB0d28gbWF0cml4ZXNcclxuICBtYXRyTXVsTWF0cjIobSkge1xyXG4gICAgbGV0IHIgPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzBdWzFdID1cclxuICAgICAgdGhpcy5hWzBdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzBdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVswXVsyXSA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVswXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICB0aGlzLmFbMF1bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbMF1bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgci5hWzFdWzBdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzBdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzBdO1xyXG5cclxuICAgIHIuYVsxXVsxXSA9XHJcbiAgICAgIHRoaXMuYVsxXVswXSAqIG0uYVswXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsxXSAqIG0uYVsxXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVsyXSAqIG0uYVsyXVsxXSArXHJcbiAgICAgIHRoaXMuYVsxXVszXSAqIG0uYVszXVsxXTtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICB0aGlzLmFbMV1bMF0gKiBtLmFbMF1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMV0gKiBtLmFbMV1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bMl0gKiBtLmFbMl1bMl0gK1xyXG4gICAgICB0aGlzLmFbMV1bM10gKiBtLmFbM11bMl07XHJcblxyXG4gICAgci5hWzFdWzNdID1cclxuICAgICAgdGhpcy5hWzFdWzBdICogbS5hWzBdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzFdICogbS5hWzFdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzJdICogbS5hWzJdWzNdICtcclxuICAgICAgdGhpcy5hWzFdWzNdICogbS5hWzNdWzNdO1xyXG5cclxuICAgIHIuYVsyXVswXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVswXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVswXTtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICB0aGlzLmFbMl1bMF0gKiBtLmFbMF1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMV0gKiBtLmFbMV1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bMl0gKiBtLmFbMl1bMV0gK1xyXG4gICAgICB0aGlzLmFbMl1bM10gKiBtLmFbM11bMV07XHJcblxyXG4gICAgci5hWzJdWzJdID1cclxuICAgICAgdGhpcy5hWzJdWzBdICogbS5hWzBdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzFdICogbS5hWzFdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzJdICogbS5hWzJdWzJdICtcclxuICAgICAgdGhpcy5hWzJdWzNdICogbS5hWzNdWzJdO1xyXG5cclxuICAgIHIuYVsyXVszXSA9XHJcbiAgICAgIHRoaXMuYVsyXVswXSAqIG0uYVswXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsxXSAqIG0uYVsxXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVsyXSAqIG0uYVsyXVszXSArXHJcbiAgICAgIHRoaXMuYVsyXVszXSAqIG0uYVszXVszXTtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bMF0gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bMF07XHJcblxyXG4gICAgci5hWzNdWzFdID1cclxuICAgICAgdGhpcy5hWzNdWzBdICogbS5hWzBdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzFdICogbS5hWzFdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzJdICogbS5hWzJdWzFdICtcclxuICAgICAgdGhpcy5hWzNdWzNdICogbS5hWzNdWzFdO1xyXG5cclxuICAgIHIuYVszXVsyXSA9XHJcbiAgICAgIHRoaXMuYVszXVswXSAqIG0uYVswXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsxXSAqIG0uYVsxXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVsyXSAqIG0uYVsyXVsyXSArXHJcbiAgICAgIHRoaXMuYVszXVszXSAqIG0uYVszXVsyXTtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICB0aGlzLmFbM11bMF0gKiBtLmFbMF1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMV0gKiBtLmFbMV1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bMl0gKiBtLmFbMl1bM10gK1xyXG4gICAgICB0aGlzLmFbM11bM10gKiBtLmFbM11bM107XHJcblxyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICAvL011bHRpcGx5aW5nIHRocmVlIG1hdHJpeGVzXHJcbiAgbWF0ck11bE1hdHIzKG0xLCBtMikge1xyXG4gICAgcmV0dXJuIHRoaXMubWF0ck11bE1hdHIyKG1hdHJNdWxNYXRyKHRoaXMuYSwgbTEpLCBtMik7XHJcbiAgfVxyXG5cclxuICBNYXRySW52ZXJzZSgpIHtcclxuICAgIGxldCByID0gbmV3IF9tYXQ0KCk7XHJcbiAgICBsZXQgZGV0ID0gbWF0ckRldGVybShNKTtcclxuXHJcbiAgICBpZiAoZGV0ID09IDApIHJldHVybiByO1xyXG5cclxuICAgIC8qIGJ1aWxkIGFkam9pbnQgbWF0cml4ICovXHJcbiAgICByLmFbMF1bMF0gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVswXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzBdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bMF0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVswXVsxXSA9XHJcbiAgICAgIC1tYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzFdWzFdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMl1bMV0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVszXVsxXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzBdWzJdID1cclxuICAgICAgK21hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMV1bMl0gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsyXVsyXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzNdWzJdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbMF1bM10gPVxyXG4gICAgICAtbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHIuYVsxXVszXSA9XHJcbiAgICAgICttYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgci5hWzJdWzNdID1cclxuICAgICAgLW1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bM11cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByLmFbM11bM10gPVxyXG4gICAgICArbWF0ckRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgLy9Sb3RhdGlvbiBtYXRyaXhcclxuICBtYXRyUm90YXRlKGFuZ2xlLCB2KSB7XHJcbiAgICBsZXQgYSA9IEQyUihhbmdsZSksXHJcbiAgICAgIHMgPSBNYXRoLnNpbihhKSxcclxuICAgICAgYyA9IE1hdGguY29zKGEpO1xyXG5cclxuICAgIGxldCByID0gbmV3IF9tYXQ0KCk7XHJcbiAgICByLmEgPSBbXHJcbiAgICAgIFtcclxuICAgICAgICBjICsgdi5YICogdi5YICogKDEgLSBjKSxcclxuICAgICAgICB2LlkgKiB2LlggKiAoMSAtIGMpIC0gdi5aICogcyxcclxuICAgICAgICB2LlogKiB2LlggKiAoMSAtIGMpICsgdi5ZICogcyxcclxuICAgICAgICAwLFxyXG4gICAgICBdLFxyXG4gICAgICBbXHJcbiAgICAgICAgdi5YICogdi5ZICogKDEgLSBjKSArIHYuWiAqIHMsXHJcbiAgICAgICAgYyArIHYuWSAqIHYuWSAqICgxIC0gYyksXHJcbiAgICAgICAgdi5aICogdi5ZICogKDEgLSBjKSAtIHYuWCAqIHMsXHJcbiAgICAgICAgMCxcclxuICAgICAgXSxcclxuICAgICAgW1xyXG4gICAgICAgIHYuWCAqIHYuWiAqICgxIC0gYykgLSB2LlkgKiBzLFxyXG4gICAgICAgIHYuWSAqIHYuWiAqICgxIC0gYykgKyB2LlggKiBzLFxyXG4gICAgICAgIGMgKyB2LlogKiB2LlogKiAoMSAtIGMpLFxyXG4gICAgICAgIDAsXHJcbiAgICAgIF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIC8vVmlldyBtYXRyaXhcclxuICBtYXRyVmlldyhsb2MsIGF0LCB1cDEpIHtcclxuICAgIGxldCBkaXIgPSBhdC52ZWMzU3ViVmVjMyhsb2MpLnZlYzNOb3JtYWxpemUoKSxcclxuICAgICAgcmlnaHQgPSBkaXIudmVjM0Nyb3NzVmVjMyh1cDEpLnZlYzNOb3JtYWxpemUoKSxcclxuICAgICAgdXAgPSByaWdodC52ZWMzQ3Jvc3NWZWMzKGRpcikudmVjM05vcm1hbGl6ZSgpO1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuICAgIG0uYSA9IFtcclxuICAgICAgW3JpZ2h0LngsIHVwLngsIC1kaXIueCwgMF0sXHJcbiAgICAgIFtyaWdodC55LCB1cC55LCAtZGlyLnksIDBdLFxyXG4gICAgICBbcmlnaHQueiwgdXAueiwgLWRpci56LCAwXSxcclxuICAgICAgWy1sb2MudmVjM0RvdFZlYzMocmlnaHQpLCAtbG9jLnZlYzNEb3RWZWMzKHVwKSwgbG9jLnZlYzNEb3RWZWMzKGRpciksIDFdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9GcnVzdHVtIG1hdHJpeFxyXG4gIE1hdHJGcnVzdHVtKGwsIHIsIGIsIHQsIG4sIGYpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsoMiAqIG4pIC8gKHIgLSBsKSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAoMiAqIG4pIC8gKHQgLSBiKSwgMCwgMF0sXHJcbiAgICAgIFsociArIGwpIC8gKHIgLSBsKSwgKHQgKyBiKSAvICh0IC0gYiksIC0oKGYgKyBuKSAvIChmIC0gbikpLCAtMV0sXHJcbiAgICAgIFswLCAwLCAtKCgyICogbiAqIGYpIC8gKGYgLSBuKSksIDBdLFxyXG4gICAgXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9UcmFuc3Bvc2UgbWF0cml4XHJcbiAgbWF0clRyYW5zcG9zZSgpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgKG0uYSA9IFttLmFbMF1bMF0sIG0uYVsxXVswXSwgbS5hWzJdWzBdLCBtLmFbM11bMF1dKSxcclxuICAgICAgW20uYVswXVsxXSwgbS5hWzFdWzFdLCBtLmFbMl1bMV0sIG0uYVszXVsxXV0sXHJcbiAgICAgIFttLmFbMF1bMl0sIG0uYVsxXVsyXSwgbS5hWzJdWzJdLCBtLmFbM11bMl1dLFxyXG4gICAgICBbbS5hWzBdWzNdLCBtLmFbMV1bM10sIG0uYVsyXVszXSwgbS5hWzNdWzNdXTtcclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuXHJcbiAgLy9SYXRhdGlvbiBieSBYIG1hdHJpeFxyXG4gIE1hdHJSb3RhdGVYKGFuZ2xlSW5EZWdyZWUpIHtcclxuICAgIGxldCBhID0gTWF0aC5EMlIoYW5nbGVJbkRlZ3JlZSksXHJcbiAgICAgIHNpID0gTWF0aC5zaW4oYSksXHJcbiAgICAgIGNvID0gTWF0aC5jb3MoYSksXHJcbiAgICAgIG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsxLCAwLCAwLCAwXSxcclxuICAgICAgWzAsIGNvLCBzaSwgMF0sXHJcbiAgICAgIFswLCAtc2ksIGNvLCAwXSxcclxuICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8vUm90YXRpb24gYnkgWSBtYXRyaXhcclxuICBNYXRyUm90YXRlWShhbmdsZUluRGVncmVlKSB7XHJcbiAgICBsZXQgYSA9IE1hdGguRDJSKGFuZ2xlSW5EZWdyZWUpLFxyXG4gICAgICBzaSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjbyA9IE1hdGguY29zKGEpLFxyXG4gICAgICBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbY28sIDAsIC1zaSwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgW3NpLCAwLCBjbywgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vUm90YXRpb24gYnkgWiBtYXRyaXhcclxuICBNYXRyUm90YXRlWShhbmdsZUluRGVncmVlKSB7XHJcbiAgICBsZXQgYSA9IE1hdGguRDJSKGFuZ2xlSW5EZWdyZWUpLFxyXG4gICAgICBzaSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjbyA9IE1hdGguY29zKGEpLFxyXG4gICAgICBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbY28sIHNpLCAwLCAwXSxcclxuICAgICAgWy1zaSwgY28sIDAsIDBdLFxyXG4gICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gbTtcclxuICB9XHJcblxyXG4gIC8vU2NhbGUgbWF0cml4XHJcbiAgbWF0clNjYWxlKHYpIHtcclxuICAgIGxldCBtID0gbmV3IF9tYXQ0KCk7XHJcblxyXG4gICAgbS5hID0gW1xyXG4gICAgICBbdi54LCAwLCAwLCAwXSxcclxuICAgICAgWzAsIHYueSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCB2LnosIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG5cclxuICBtYXRyT3J0aG8obCwgciwgYiwgdCwgbiwgZikge1xyXG4gICAgbGV0IG0gPSBuZXcgX21hdDQoKTtcclxuXHJcbiAgICBtLmEgPSBbXHJcbiAgICAgIFsyIC8gKHIgLSBsKSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAyIC8gKHQgLSBiKSwgMCwgMF0sXHJcbiAgICAgIFswLCAwLCAtMiAvIChmIC0gbiksIDBdLFxyXG4gICAgICBbLShyICsgbCkgLyAociAtIGwpLCAtKHQgKyBiKSAvICh0IC0gYiksIC0oZiArIG4pIC8gKGYgLSBuKSwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRyRGV0ZXJtM3gzKGExMSwgYTEyLCBhMTMsIGEyMSwgYTIyLCBhMjMsIGEzMSwgYTMyLCBhMzMpIHtcclxuICByZXR1cm4gKFxyXG4gICAgYTExICogYTIyICogYTMzICtcclxuICAgIGExMiAqIGEyMyAqIGEzMSArXHJcbiAgICBhMTMgKiBhMjEgKiBhMzIgLVxyXG4gICAgYTExICogYTIzICogYTMyIC1cclxuICAgIGExMiAqIGEyMSAqIGEzMyAtXHJcbiAgICBhMTMgKiBhMjIgKiBhMzFcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRyRGV0ZXJtKG0pIHtcclxuICBsZXQgZCA9XHJcbiAgICArbS5hWzBdWzBdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMV0sXHJcbiAgICAgICAgbS5hWzFdWzJdLFxyXG4gICAgICAgIG0uYVsxXVszXSxcclxuICAgICAgICBtLmFbMl1bMV0sXHJcbiAgICAgICAgbS5hWzJdWzJdLFxyXG4gICAgICAgIG0uYVsyXVszXSxcclxuICAgICAgICBtLmFbM11bMV0sXHJcbiAgICAgICAgbS5hWzNdWzJdLFxyXG4gICAgICAgIG0uYVszXVszXVxyXG4gICAgICApICtcclxuICAgIC1tLmFbMF1bMV0gKlxyXG4gICAgICBtYXRyRGV0ZXJtM3gzKFxyXG4gICAgICAgIG0uYVsxXVswXSxcclxuICAgICAgICBtLmFbMV1bMl0sXHJcbiAgICAgICAgbS5hWzFdWzNdLFxyXG4gICAgICAgIG0uYVsyXVswXSxcclxuICAgICAgICBtLmFbMl1bMl0sXHJcbiAgICAgICAgbS5hWzJdWzNdLFxyXG4gICAgICAgIG0uYVszXVswXSxcclxuICAgICAgICBtLmFbM11bMl0sXHJcbiAgICAgICAgbS5hWzNdWzNdXHJcbiAgICAgICkgK1xyXG4gICAgK20uYVswXVsyXSAqXHJcbiAgICAgIG1hdHJEZXRlcm0zeDMoXHJcbiAgICAgICAgbS5hWzFdWzBdLFxyXG4gICAgICAgIG0uYVsxXVsxXSxcclxuICAgICAgICBtLmFbMV1bM10sXHJcbiAgICAgICAgbS5hWzJdWzBdLFxyXG4gICAgICAgIG0uYVsyXVsxXSxcclxuICAgICAgICBtLmFbMl1bM10sXHJcbiAgICAgICAgbS5hWzNdWzBdLFxyXG4gICAgICAgIG0uYVszXVsxXSxcclxuICAgICAgICBtLmFbM11bM11cclxuICAgICAgKSArXHJcbiAgICAtbS5hWzBdWzNdICpcclxuICAgICAgbWF0ckRldGVybTN4MyhcclxuICAgICAgICBtLmFbMV1bMF0sXHJcbiAgICAgICAgbS5hWzFdWzFdLFxyXG4gICAgICAgIG0uYVsxXVsyXSxcclxuICAgICAgICBtLmFbMl1bMF0sXHJcbiAgICAgICAgbS5hWzJdWzFdLFxyXG4gICAgICAgIG0uYVsyXVsyXSxcclxuICAgICAgICBtLmFbM11bMF0sXHJcbiAgICAgICAgbS5hWzNdWzFdLFxyXG4gICAgICAgIG0uYVszXVsyXVxyXG4gICAgICApO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF0NCgpIHtcclxuICByZXR1cm4gbmV3IF9tYXQ0KCk7XHJcbn1cclxuIiwiaW1wb3J0IHsgcHJpbUNyZWF0ZSB9IGZyb20gXCIuLi9wcmltcy9wcmltLmpzXCI7XHJcbmltcG9ydCB7IG1hdDQgfSBmcm9tIFwiLi4vbXRoL21hdDQuanNcIjtcclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuLi9tdGgvdmVjMy5qc1wiO1xyXG5cclxuY2xhc3MgX3JlbmRlciB7XHJcbiAgY29uc3RydWN0b3IoY2FudmFzKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMuZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiKTtcclxuICAgIHRoaXMuZ2wuY2xlYXJDb2xvcigwLjksIDAuNywgMC43LCAxKTtcclxuICAgIHRoaXMucHJnID0gdGhpcy5nbC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgdGhpcy5wcmltcyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgcHJpbUF0dGFjaChuYW1lLCB0eXBlLCBzaGRfbmFtZSwgcG9zLCBzaWRlID0gNSkge1xyXG4gICAgbGV0IHAgPSBwcmltQ3JlYXRlKG5hbWUsIHR5cGUsIHNoZF9uYW1lLCBwb3MsIHNpZGUsIHRoaXMuZ2wpO1xyXG4gICAgdGhpcy5wcmltc1t0aGlzLnByaW1zLmxlbmd0aF0gPSBwO1xyXG4gIH1cclxuXHJcbiAgcHJvZ3JhbVVuaWZvcm1zKHNoZCkge1xyXG4gICAgbGV0IG0gPSBtYXQ0KCkubWF0clZpZXcodmVjMyg1LCA1LCA1KSwgdmVjMygwLCAwLCAwKSwgdmVjMygwLCAxLCAwKSk7XHJcbiAgICBsZXQgYXJyID0gbS50b0FycmF5KCk7XHJcbiAgICBsZXQgbVZMb2MgPSBzaGQudW5pZm9ybXNbXCJtYXRyVmlld1wiXS5sb2M7XHJcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobVZMb2MsIGZhbHNlLCBhcnIpO1xyXG5cclxuICAgIGxldCBtMSA9IG1hdDQoKS5tYXRyT3J0aG8oLTMsIDMsIC0zLCAzLCAtMywgMyk7XHJcbiAgICBsZXQgYXJyMSA9IG0xLnRvQXJyYXkoKTtcclxuICAgIGxldCBtUExvYyA9IHNoZC51bmlmb3Jtc1tcIm1hdHJQcm9qXCJdLmxvYztcclxuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihtUExvYywgZmFsc2UsIGFycjEpO1xyXG5cclxuICAgIC8qXHJcbiAgICBsZXQgdGltZUxvYyA9IHNoZC51bmlmb3Jtc1tcIlRpbWVcIl0ubG9jO1xyXG5cclxuICAgIGlmICh0aW1lTG9jICE9IC0xKSB7XHJcbiAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICBsZXQgdCA9XHJcbiAgICAgICAgZGF0ZS5nZXRNaW51dGVzKCkgKiA2MCArXHJcbiAgICAgICAgZGF0ZS5nZXRTZWNvbmRzKCkgK1xyXG4gICAgICAgIGRhdGUuZ2V0TWlsbGlzZWNvbmRzKCkgLyAxMDAwO1xyXG4gICAgICBnbC51bmlmb3JtMWYodGltZUxvYywgdCk7XHJcbiAgICB9XHJcbiAgICAqL1xyXG4gICAgc2hkLnVwZGF0ZVNoYWRlckRhdGEoKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcigpIHtcclxuICAgIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5wcmltcykge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgcC5tdGwuc2hhZGVyLmlkICE9IG51bGwgJiZcclxuICAgICAgICBwLm10bC5zaGFkZXIuc2hhZGVyc1swXS5pZCAhPSBudWxsICYmXHJcbiAgICAgICAgcC5tdGwuc2hhZGVyLnNoYWRlcnNbMV0uaWQgIT0gbnVsbCAmJlxyXG4gICAgICAgIHAuc2hkSXNMb2FkZWQgPT0gbnVsbFxyXG4gICAgICApIHtcclxuICAgICAgICBwLm10bC5zaGFkZXIuYXBwbHkoKTtcclxuICAgICAgICBwLnJlbmRlcih0aGlzLmdsKTtcclxuICAgICAgICB0aGlzLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGFkZXIpO1xyXG4gICAgICAgIHAuc2hkSXNMb2FkZWQgPSAxO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwLnNoZElzTG9hZGVkID09IG51bGwpIHJldHVybjtcclxuICAgICAgcC5yZW5kZXIodGhpcy5nbCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ3JlYXRlKGNhbnZhcykge1xyXG4gIHJldHVybiBuZXcgX3JlbmRlcihjYW52YXMpO1xyXG59XHJcbiIsImltcG9ydCB7IHJlbmRlckNyZWF0ZSB9IGZyb20gXCIuL3JlbmRlci9yZW5kZXJcIjtcclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuL210aC92ZWMzXCI7XHJcbmxldCBybmQ7XHJcblxyXG4vL0NvbW1vbiB1bmlmb3JtIHZhcmlhYmxlc1xyXG4vL2xldCBtYXRyVmlldyA9IG1hdDQoKS5tYXRyVmlldyh2ZWMzKDUsIDUsIDUpLCB2ZWMzKDAsIDAsIDApLCB2ZWMzKDAsIDEsIDApKTtcclxuLy9sZXQgbWF0clByb2ogPSBtYXQ0KCkubWF0ck9ydGhvKC0zLCAzLCAtMywgMywgLTMsIDMpO1xyXG5cclxuLy8gT3BlbkdMIGluaXRpYWxpemF0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0R0woKSB7XHJcbiAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG4gIHJuZCA9IHJlbmRlckNyZWF0ZShjYW52YXMsIFwiZGVmYXVsdFwiKTtcclxuXHJcbiAgcm5kLnByaW1BdHRhY2goXCJjdWJlUHJpbVwiLCBcImN1YmVcIiwgXCJkZWZhdWx0XCIsIHZlYzMoMCwgMCwgMCkpO1xyXG4gIC8vZm9yIChjb25zdCBwIG9mIHJuZC5wcmltcykgcm5kLnByb2dyYW1Vbmlmb3JtcyhwLm10bC5zaGQpO1xyXG59IC8vIEVuZCBvZiAnaW5pdEdMJyBmdW5jdGlvblxyXG5cclxuLy8gUmVuZGVyIGZ1bmN0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgcm5kLmdsLmNsZWFyKHJuZC5nbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuXHJcbiAgcm5kLnJlbmRlcigpO1xyXG59XHJcblxyXG5jb25zb2xlLmxvZyhcImxpYnJhcnkuanMgd2FzIGltcG9ydGVkXCIpO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcclxuICBpbml0R0woKTtcclxuXHJcbiAgY29uc3QgZHJhdyA9ICgpID0+IHtcclxuICAgIHJlbmRlcigpO1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhdyk7XHJcbiAgfTtcclxuICBkcmF3KCk7XHJcbn0pO1xyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0VBQUEsTUFBTSxPQUFPLENBQUM7RUFDZCxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtFQUM5QixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0VBQ3JCLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztFQUNuQixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2pCLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxTQUFTLEVBQUUsT0FBTztFQUMvQyxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0VBQ2hDLElBQUksRUFBRSxD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QUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDM0QsS0FBSztFQUNMLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxTQUFTLElBQUksT0FBTyxDQUFDLElBQUksU0FBUztFQUN0RCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUMvQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNsRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMvRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMvRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUNoQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN6RCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRTtFQUNoQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPO0VBQ3ZCLElBQUksT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3pELEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxPQUFPLEdBQUc7RUFDWixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNoRCxHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdEQsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLE9BQU8sR0FBRztFQUNaLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNyQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0VBQ3pDLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxhQUFhLEdBQUc7RUFDbEIsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDO0VBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQztFQUMxQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDM0MsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLGFBQWEsQ0FBQyxDQUFDLEVBQUU7RUFDbkIsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRSxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFBRTtFQUNqQixJQUFJLElBQUksQ0FBQztFQUNULE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRTtFQUNBLElBQUksT0FBTyxJQUFJLEtBQUs7RUFDcEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUM5RSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQzlFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDOUUsS0FBSyxDQUFDO0VBQ04sR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLGFBQWEsQ0FBQyxDQUFDLEVBQUU7RUFDbkIsSUFBSSxPQUFPLElBQUksS0FBSztFQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDakMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNqQyxLQUFLLENBQUM7RUFDTixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtFQUNwQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSztFQUNyQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDM0UsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRSxLQUFLLENBQUM7QUFDTjtFQUNBLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ08sU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDOUIsRUFBRSxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDNUI7O0VDckdPLFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUU7RUFDdEM7RUFDQTtFQUNBO0VBQ0EsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN6QixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDYixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDYixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDYixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNkLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDZCxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNkLEdBQUcsQ0FBQztBQUNKO0VBQ0EsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDZixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNkLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNiLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNmLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2QsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNmLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNoQixHQUFHLENBQUM7RUFDSixFQUFFLElBQUksUUFBUSxHQUFHLEVBQUU7RUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ1YsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7RUFDaEIsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDbEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUM7RUFDUCxNQUFNLENBQUM7RUFDUCxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQztFQUNQLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQztFQUNQLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDO0VBQ1AsTUFBTSxDQUFDO0VBQ1AsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsS0FBSyxDQUFDO0VBQ04sSUFBSSxDQUFDLEVBQUUsQ0FBQztFQUNSLEdBQUc7RUFDSCxFQUFFLElBQUksR0FBRyxHQUFHO0VBQ1osSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7RUFDN0UsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDekIsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLFFBQVEsR0FBRztFQUNiLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLEdBQUcsQ0FBQztBQUNKO0VBQ0EsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDakM7O0VDL0RBLE1BQU0sT0FBTyxDQUFDO0VBQ2QsRUFBRSxNQUFNLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0VBQ3hCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0VBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRztFQUNuQixNQUFNO0VBQ04sUUFBUSxFQUFFLEVBQUUsSUFBSTtFQUNoQixRQUFRLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWE7RUFDbkMsUUFBUSxJQUFJLEVBQUUsTUFBTTtFQUNwQixRQUFRLEdBQUcsRUFBRSxFQUFFO0VBQ2YsT0FBTztFQUNQLE1BQU07RUFDTixRQUFRLEVBQUUsRUFBRSxJQUFJO0VBQ2hCLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZTtFQUNyQyxRQUFRLElBQUksRUFBRSxNQUFNO0VBQ3BCLFFBQVEsR0FBRyxFQUFFLEVBQUU7RUFDZixPQUFPO0VBQ1AsS0FBSyxDQUFDO0VBQ04sSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7RUFDbEMsTUFBTSxJQUFJLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUN2RSxNQUFNLElBQUksR0FBRyxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0VBQ3RDLE1BQU0sSUFBSSxPQUFPLEdBQUcsSUFBSSxRQUFRLElBQUksR0FBRyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztFQUMzRCxLQUFLO0VBQ0w7RUFDQSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0VBQy9CLEdBQUc7RUFDSCxFQUFFLG1CQUFtQixHQUFHO0VBQ3hCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0VBQzlCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0VBQzlCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7RUFDbkIsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsT0FBTztFQUN2RSxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtFQUNsQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQzFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDeEMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUU7RUFDckUsUUFBUSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNqRCxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzFFLE9BQU87RUFDUCxLQUFLO0VBQ0wsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7RUFDdEM7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0VBQ2xDLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUM1RCxLQUFLO0VBQ0wsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0VBQ3RCLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDN0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRTtFQUNoRSxNQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDL0MsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNuRSxLQUFLO0VBQ0wsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztFQUM1QixHQUFHO0VBQ0gsRUFBRSxnQkFBZ0IsR0FBRztFQUNyQjtFQUNBLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7RUFDcEIsSUFBSSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQjtFQUNsRCxNQUFNLElBQUksQ0FBQyxFQUFFO0VBQ2IsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQjtFQUMvQixLQUFLLENBQUM7RUFDTixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDekMsTUFBTSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3ZELE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUc7RUFDOUIsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7RUFDdkIsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7RUFDdkIsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7RUFDdkIsUUFBUSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7RUFDMUQsT0FBTyxDQUFDO0VBQ1IsS0FBSztBQUNMO0VBQ0E7RUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0VBQ3ZCLElBQUksTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUI7RUFDckQsTUFBTSxJQUFJLENBQUMsRUFBRTtFQUNiLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlO0VBQzdCLEtBQUssQ0FBQztFQUNOLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUM1QyxNQUFNLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUN4RCxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHO0VBQ2pDLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0VBQ3ZCLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0VBQ3ZCLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0VBQ3ZCLFFBQVEsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDO0VBQzNELE9BQU8sQ0FBQztFQUNSLEtBQUs7QUFDTDtFQUNBO0VBQ0EsSUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztFQUM1QixJQUFJLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUI7RUFDMUQsTUFBTSxJQUFJLENBQUMsRUFBRTtFQUNiLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUI7RUFDbkMsS0FBSyxDQUFDO0VBQ04sSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDakQsTUFBTSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDdkUsTUFBTSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7RUFDNUUsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHO0VBQ3ZDLFFBQVEsSUFBSSxFQUFFLFVBQVU7RUFDeEIsUUFBUSxLQUFLLEVBQUUsS0FBSztFQUNwQixRQUFRLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLDhCQUE4QjtFQUNwRCxVQUFVLElBQUksQ0FBQyxFQUFFO0VBQ2pCLFVBQVUsR0FBRztFQUNiLFVBQVUsSUFBSSxDQUFDLEVBQUUsQ0FBQyx1QkFBdUI7RUFDekMsU0FBUztFQUNULFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsOEJBQThCO0VBQ3BELFVBQVUsSUFBSSxDQUFDLEVBQUU7RUFDakIsVUFBVSxHQUFHO0VBQ2IsVUFBVSxJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQjtFQUN2QyxTQUFTO0VBQ1QsT0FBTyxDQUFDO0VBQ1IsS0FBSztFQUNMLEdBQUc7RUFDSCxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0VBQ3hCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDekIsR0FBRztFQUNILEVBQUUsS0FBSyxHQUFHO0VBQ1YsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNyRCxHQUFHO0VBQ0gsQ0FBQztFQUNNLFNBQVMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUU7RUFDakMsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztFQUMvQixDQUFDO0VBQ0Q7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7RUM5SEEsTUFBTSxTQUFTLENBQUM7RUFDaEIsRUFBRSxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUN4QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO0VBQ3RCLElBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7RUFDbkIsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLE1BQU0sS0FBSyxDQUFDO0VBQ1osRUFBRSxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFO0VBQ3ZFLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7RUFDM0QsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0VBQ3JCLElBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDbkI7RUFDQSxJQUFJLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDbkMsSUFBSSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztFQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ3hDLEdBQUc7QUFDSDtFQUNBLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRTtFQUNiLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtFQUM1QixNQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO0VBQ3hDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDeEUsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUN2RSxPQUFPO0VBQ1AsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNuRCxNQUFNLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNyQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDM0QsTUFBTSxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3pFLEtBQUssTUFBTTtFQUNYLE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUU7RUFDeEMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUN4RSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ3ZFLE9BQU87RUFDUCxNQUFNLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNyQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ25ELE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDdEQsS0FBSztFQUNMLEdBQUc7RUFDSCxDQUFDO0FBV0Q7RUFDTyxTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUU7RUFDL0QsRUFBRSxJQUFJLEVBQUUsQ0FBQztFQUNULEVBQUUsSUFBSSxJQUFJLElBQUksTUFBTSxFQUFFLEVBQUUsR0FBRyxVQUFVLENBQUMsR0FBUyxDQUFDLENBQUM7RUFDakQsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2xCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQjtFQUNBLEVBQUUsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7RUFDM0MsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0VBQ2xDLEVBQUUsSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3QztFQUNBLEVBQUUsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMxQztFQUNBLEVBQUUsT0FBTyxJQUFJLEtBQUs7RUFDbEIsSUFBSSxFQUFFO0VBQ04sSUFBSSxJQUFJO0VBQ1IsSUFBSSxJQUFJO0VBQ1IsSUFBSSxHQUFHO0VBQ1AsSUFBSSxHQUFHO0VBQ1AsSUFBSSxZQUFZO0VBQ2hCLElBQUksV0FBVztFQUNmLElBQUksV0FBVztFQUNmLElBQUksSUFBSTtFQUNSLEdBQUcsQ0FBQztFQUNKOztFQy9FQTtBQUNBO0VBQ0EsTUFBTSxLQUFLLENBQUM7RUFDWixFQUFFLFdBQVcsR0FBRztFQUNoQixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUc7RUFDYixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLEtBQUssQ0FBQztFQUNOLEdBQUc7QUFDSDtFQUNBLEVBQUUsT0FBTyxHQUFHO0VBQ1osSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ25CLElBQUksT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xFLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFO0VBQ25CLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNsQixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ3hCLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRTtFQUNsQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0I7RUFDQSxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFO0VBQ3ZCLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQzFELEdBQUc7QUFDSDtFQUNBLEVBQUUsV0FBVyxHQUFHO0VBQ2hCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLElBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QjtFQUNBLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzNCO0VBQ0E7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNiLE1BQU0sQ0FBQyxhQUFhO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtFQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDYixNQUFNLENBQUMsYUFBYTtFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ2Q7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2IsTUFBTSxDQUFDLGFBQWE7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0VBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRTtFQUN2QixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7RUFDdEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QjtFQUNBLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUN4QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDVixNQUFNO0VBQ04sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDL0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNO0VBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMvQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNO0VBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUNyQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0VBQ3JDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQy9CLFFBQVEsQ0FBQztFQUNULE9BQU87RUFDUCxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xCLEtBQUssQ0FBQztFQUNOLElBQUksT0FBTyxDQUFDLENBQUM7RUFDYixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO0VBQ3pCLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLEVBQUU7RUFDakQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLEVBQUU7RUFDcEQsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztFQUNwRCxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7RUFDeEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0VBQ1YsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNoQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDaEMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDOUUsS0FBSyxDQUFDO0VBQ04sSUFBSSxPQUFPLENBQUMsQ0FBQztFQUNiLEdBQUc7QUFDSDtFQUNBO0VBQ0EsRUFBRSxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDaEMsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0VBQ3hCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztFQUNWLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2xDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDdEUsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN6QyxLQUFLLENBQUM7RUFDTixJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLGFBQWEsR0FBRztFQUNsQixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDeEI7RUFDQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdkQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNuRCxJQUFJLE9BQU8sQ0FBQyxDQUFDO0VBQ2IsR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLFdBQVcsQ0FBQyxhQUFhLEVBQUU7RUFDN0IsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQztFQUNuQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0QixNQUFNLENBQUMsR0FBRyxJQUFJ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QUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsT0FBTztFQUNQLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNkLE1BQU0sYUFBYTtFQUNuQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakIsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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
