'use strict'

let vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec2 a_texCoord;

//resolution of the canvas
uniform vec2 u_resolution;

//pass the texture coordinates to the fragment shader
out vec2 v_texCoord;
 
// all shaders have a main function
void main() {
   vec2 zeroToOne = a_position / u_resolution;
   vec2 zeroToTwo = zeroToOne * 2.0;
   vec2 clipSpace = zeroToTwo - 1.0;
   
   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
   v_texCoord = a_texCoord;
}
`;

let fragmentShaderSource = `#version 300 es
 
precision highp float;

//our texture
uniform sampler2D u_image;

in vec2 v_texCoord;
out vec4 outColor;
 
void main() {
  outColor = texture(u_image, v_texCoord);
}
`;


let image = new Image();
image.src = './image_tex.jpg';
image.onload = function () {
   render(image);
};


function render(image) {
   let canvas = document.querySelector('canvas');

   let gl = canvas.getContext('webgl2');
   if (!gl) {
      console.log("Failed to get WebGL context. \nYour browser or device may not support WebGL.");
      return null;
   }

   let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
   let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

   let program = createProgram(gl, vertexShader, fragmentShader);

   //needed data for vertext
   let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
   let texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');

   //uniforms
   let resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
   let imageLocation = gl.getUniformLocation(program, 'u_image');

   //vao = Vertex Array Object
   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   let positionBuffer = gl.createBuffer();
   gl.enableVertexAttribArray(positionAttributeLocation);
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   //pull the data out
   let size = 2;  // 2 components per iteration
   let type = gl.FLOAT;
   let normalize = false;
   let stride = 0;
   let offset = 0;
   gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

   let texCoordBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1.0, 0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
   ]), gl.STATIC_DRAW);

   gl.enableVertexAttribArray(texCoordAttributeLocation);

   gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);

   let texture = gl.createTexture();
   gl.activeTexture(gl.TEXTURE0 + 0);

   gl.bindTexture(gl.TEXTURE_2D, texture);

   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

   let mipLevel = 0; //largest mip
   let internalFormat = gl.RGBA; //format we want in the texture
   let srcFormat = gl.RGBA;
   let srcType = gl.UNSIGNED_BYTE;
   gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat,
       srcFormat, srcType, image);

   canvas.width = canvas.clientWidth;
   canvas.height = canvas.clientHeight;

   gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight)
   gl.clearColor(0, 0, 0, 0);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   gl.useProgram(program);
   gl.bindVertexArray(vao);

   gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

   gl.uniform1i(imageLocation, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   setRectangle(gl, 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight);

   let primitiveType = gl.TRIANGLES;
   let count = 6;
   gl.drawArrays(primitiveType, offset, count);
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
       x2, y2,
   ]), gl.STATIC_DRAW)
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
