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
export function shader(name, gl) {
  return new _shader(name, gl);
}
/*
let src = document.getElementById("shdVertSrc").value;
shd.shaders[0].src = src;
shd.updateShadersSource();
*/
