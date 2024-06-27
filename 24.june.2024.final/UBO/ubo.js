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
export function buffer(...args) {
  return new _buffer(...args);
} // End of 'buffer' function

class _ubo_buffer extends _buffer {
  constructor(name, size, bindPoint) {
    super(this.gl.UNIFORM_BUFFER, size);
    this.name = name;
    this.bindPoint = bindPoint; // Buffer GPU binding point
  }
  apply(shd) {
    if (
      shd == undefined ||
      shd.id == undefined ||
      shd.uniformBlocks[this.name] == undefined
    )
      return;
    gl.uniformBlockBinding(
      shd.id,
      shd.uniformBlocks[this.name].index,
      this.bindPoint
    );
    gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.bindPoint, this.id);
  }
}
export function ubo_buffer(...args) {
  return new _ubo_buffer(...args);
} // End of 'ubo_buffer' function

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
export function vertex_buffer(...args) {
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
export function index_buffer(...args) {
  return new _index_buffer(...args);
} // End of 'ubo_buffer' function
