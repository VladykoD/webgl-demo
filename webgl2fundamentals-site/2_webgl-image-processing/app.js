'use strict'

let vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec2 a_texCoord;

//resolution of the canvas
uniform vec2 u_resolution;
uniform float u_flipY;

//pass the texture coordinates to the fragment shader
out vec2 v_texCoord;
 
// all shaders have a main function
void main() {
   vec2 zeroToOne = a_position / u_resolution;
   vec2 zeroToTwo = zeroToOne * 2.0;
   vec2 clipSpace = zeroToTwo - 1.0;
   
   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
   v_texCoord = a_texCoord;
}
`;

let fragmentShaderSource = `#version 300 es
 
precision highp float;

//our texture
uniform sampler2D u_image;

uniform float u_kernel[9];
uniform float u_kernelWeight;

in vec2 v_texCoord;

out vec4 outColor;
 
void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
 
  vec4 colorSum =
      texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  outColor = vec4((colorSum / u_kernelWeight).rgb, 1);
}
`;


/*
   //change canals on image
   outColor = texture(u_image, v_texCoord).bgra;


//simple motion effect
precision highp float;
uniform sampler2D u_image;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
   vec2 onePixel = vec2(4) / vec2(textureSize(u_image,0));

  outColor = (
      texture(u_image, v_texCoord) +
      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
 */


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
   let kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
   let kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");

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
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   setRectangle(gl, 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight);

   // Define several convolution kernels
   let kernels = {
      normal: [
         0, 0, 0,
         0, 1, 0,
         0, 0, 0,
      ],
      gaussianBlur: [
         0.045, 0.122, 0.045,
         0.122, 0.332, 0.122,
         0.045, 0.122, 0.045,
      ],
      gaussianBlur2: [
         1, 2, 1,
         2, 4, 2,
         1, 2, 1,
      ],
      gaussianBlur3: [
         0, 1, 0,
         1, 1, 1,
         0, 1, 0,
      ],
      unsharpen: [
         -1, -1, -1,
         -1,  9, -1,
         -1, -1, -1,
      ],
      sharpness: [
         0, -1,  0,
         -1,  5, -1,
         0, -1,  0,
      ],
      sharpen: [
         -1, -1, -1,
         -1, 16, -1,
         -1, -1, -1,
      ],
      edgeDetect: [
         -0.125, -0.125, -0.125,
         -0.125,  1,     -0.125,
         -0.125, -0.125, -0.125,
      ],
      edgeDetect2: [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1,
      ],
      edgeDetect3: [
         -5, 0, 0,
         0, 0, 0,
         0, 0, 5,
      ],
      edgeDetect4: [
         -1, -1, -1,
         0,  0,  0,
         1,  1,  1,
      ],
      edgeDetect5: [
         -1, -1, -1,
         2,  2,  2,
         -1, -1, -1,
      ],
      edgeDetect6: [
         -5, -5, -5,
         -5, 39, -5,
         -5, -5, -5,
      ],
      sobelHorizontal: [
         1,  2,  1,
         0,  0,  0,
         -1, -2, -1,
      ],
      sobelVertical: [
         1,  0, -1,
         2,  0, -2,
         1,  0, -1,
      ],
      previtHorizontal: [
         1,  1,  1,
         0,  0,  0,
         -1, -1, -1,
      ],
      previtVertical: [
         1,  0, -1,
         1,  0, -1,
         1,  0, -1,
      ],
      boxBlur: [
         0.111, 0.111, 0.111,
         0.111, 0.111, 0.111,
         0.111, 0.111, 0.111,
      ],
      triangleBlur: [
         0.0625, 0.125, 0.0625,
         0.125,  0.25,  0.125,
         0.0625, 0.125, 0.0625,
      ],
      emboss: [
         -2, -1,  0,
         -1,  1,  1,
         0,  1,  2,
      ],
   };

   let initialSelection = 'emboss';

   let ui = document.querySelector('#ui');
   let select = document.createElement('select');
   for(let name in kernels) {
      let option = document.createElement('option');
      option.value = name;

      if(name === initialSelection) {
         option.selected = true;
      }
      option.appendChild(document.createTextNode(name));
      select.appendChild(option);
   }
   select.onchange = function () {
      drawWithKernel(this.options[this.selectedIndex].value);
   };
   ui.appendChild(select);

   drawWithKernel(initialSelection);


   function computeKernelWeight(kernel) {
      let weight = kernel.reduce(function (prev, curr) {
         return prev + curr;
      });
      return weight <= 0 ? 1 : weight;
   }

   function drawWithKernel(name) {
      gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1i(imageLocation, 0);

      gl.uniform1fv(kernelLocation, kernels[name]);
      gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));


      let primitiveType = gl.TRIANGLES;
      let count = 6;
      gl.drawArrays(primitiveType, offset, count);
   }
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

