'use strict'

window.addEventListener('load', setupWebGL, false);

let gl, program;
let vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`;

let fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  outColor = vec4(1, 0, 0.5, 1);
}
`;

function setupWebGL(evt) {
   let canvas = document.querySelector('canvas');

   let gl = canvas.getContext('webgl2');
   if (!gl) {
      console.log("Failed to get WebGL context. \nYour browser or device may not support WebGL.");
      return null;
   }

   let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
   let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

   let program = createProgram(gl, vertexShader, fragmentShader);

   // Looking up attribute locations (and uniform locations)
   // is something you should do during initialization,
   // not in your render loop.
   let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
   let positionBuffer = gl.createBuffer();

   //First you bind a resource to a bind point.
   // Then, all other functions refer to the resource
   // through the bind point.
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   let positions = [
       0, 0,
       0, 0.5,
       0.7, 0,
   ];
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

   //vao = Vertex Array Object
   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   gl.enableVertexAttribArray(positionAttributeLocation);

   //pull the data out
   let size = 2;  // 2 components per iteration
   let type = gl.FLOAT;
   let normalize = false;
   let stride = 0; // 0 = move forward size * sizeof(type)
                   // each iteration to get the next position
   let offset = 0;
   gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

   canvas.width = canvas.clientWidth;
   canvas.height = canvas.clientHeight;

   gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight)
   gl.clearColor(0, 0, 0, 0);
   gl.clear(gl.COLOR_BUFFER_BIT);

   gl.useProgram(program);
   gl.bindVertexArray(vao);

   let primitiveType = gl.TRIANGLES;
   let count = 3;
   gl.drawArrays(primitiveType, offset, count);





}


function createShader(gl, type, source) {
   let shader = gl.createShader(type);
   gl.shaderSource(shader, source);
   gl.compileShader(shader);
   let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
   if (success) {
      return shader;
   }

   console.log(gl.getShaderInfoLog(shader));
   gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
   let program = gl.createProgram();

   gl.attachShader(program, vertexShader);
   gl.attachShader(program, fragmentShader);

   gl.linkProgram(program);
   let success = gl.getProgramParameter(program, gl.LINK_STATUS);
   if (success) return program;

   console.log(gl.getShaderInfoLog(program));
   gl.deleteProgram(program)
}
