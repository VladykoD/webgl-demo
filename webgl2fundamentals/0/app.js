'use strict'

window.addEventListener('load', setupWebGL, false);

let vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
uniform vec2 u_resolution;
 
// all shaders have a main function
void main() {
   // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

let fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 u_color;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  outColor = u_color;
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

   let resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')
   let colorLocation = gl.getUniformLocation(program, 'u_color');

   let positionBuffer = gl.createBuffer();

   //vao = Vertex Array Object
   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   gl.enableVertexAttribArray(positionAttributeLocation);

   //First you bind a resource to a bind point.
   // Then, all other functions refer to the resource
   // through the bind point.
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

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
   gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);


   for (let ii = 0; ii < 50; ++ii) {
      setRectangle(
          gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300)
      );

      gl.uniform4f(colorLocation, Math.random(),Math.random(),Math.random(),1 )

      let primitiveType = gl.TRIANGLES;
      let offset = 0;
      let count = 6;
      gl.drawArrays(primitiveType, offset, count);
   }


}

function randomInt(range) {
   return Math.floor(Math.random() * range);
}

function setRectangle(gl, x, y, width, height) {
   let x1 = x;
   let x2 = x + width;
   let y1 = y;
   let y2 = y + height;

   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2]), gl.STATIC_DRAW)
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
