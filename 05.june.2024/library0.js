let canvas, gl, timeLoc;

// OpenGL initialization
export function initGL() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl2");
    gl.clearColor(0.9, 0.70, 0.7, 1);
    
    // Shader creation
    let vs_txt =
    `#version 300 es
    precision highp float;
    in vec3 InPosition;
        
    out vec2 DrawPos;
    uniform float Time;
    
    void main( void )
    {
        gl_Position = vec4(InPosition, 1);
        //gl_Position.x += 0.1 * sin(Time);
        DrawPos = InPosition.xy * 1.5;
    }
    `;
    let fs_txt =
    `#version 300 es
    precision highp float;
    out vec4 OutColor;
    
    in vec2 DrawPos;
    uniform float Time;
    
    float get_fractal(float x, float y)
    {
        int n = 0;
        float x1 = x, y1 = y;

        //x = x / 300.0 * 0.5 - 1.0;
        //y = y / 300.0 * 0.5 - 1.0;

        while (sqrt(x * x + y * y) < 2.0 && n < 255)
        {
            x1 = x;
            x = (x + y) * (x - y);
            y = 2.0 * x1 * y * cos(Time * 0.4) + 0.397 * sin(Time * 0.02) * cos(Time * 0.029);
            x += 0.34, n++;
            //n = 100 + n * 20;
        }

        return float(n) / 255.0;
    }

    void main( void )
    {
        float n = get_fractal(DrawPos.x, DrawPos.y);
        OutColor = vec4(n, n * 0.76, n * 0.7, 1);
    }
    `;
    let 
      vs = loadShader(gl.VERTEX_SHADER, vs_txt),
      fs = loadShader(gl.FRAGMENT_SHADER, fs_txt),
      prg = gl.createProgram();
    
    gl.attachShader(prg, vs);
    gl.attachShader(prg, fs);
    gl.linkProgram(prg);
    
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
        let buf = gl.getProgramInfoLog(prg);
        console.log('Shader program link failed: ' + buf);
    }

     // Vertex buffer creation
    const size = 0.8;
    const vertexes = [-size, size, 0, -size, -size, 0, size, size, 0, size, -size, 0];
    const posLoc = gl.getAttribLocation(prg, "InPosition");
    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexes), gl.STATIC_DRAW);
    if (posLoc != -1) {
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);
    }

    // Uniform data
    timeLoc = gl.getUniformLocation(prg, "Time");
    gl.useProgram(prg);
} // End of 'initGL' function

// Load and compile shaders function
function loadShader(shaderType, shaderSource) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let buf = gl.getShaderInfoLog(shader);
        console.log('Shader was not compiled: ' + buf);
    }
    return shader;
}


// Render functions
export function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (timeLoc != -1) {
        const date = new Date();
        let t = date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000;
        gl.uniform1f(timeLoc, t);
    }
    else {
        console.log('timeLoc is -1');
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

console.log("library.js was imported");