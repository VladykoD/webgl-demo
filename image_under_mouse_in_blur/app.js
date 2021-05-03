"use strict";
const BLUR = [
   -1, -1, -1,
   -1,  8, -1,
   -1, -1, -1
];

/*
0.111, 0.111, 0.111,
   0.111, 0.111, 0.111,
   0.111, 0.111, 0.111
 */

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");
let program;

let is_active = true;
//let intensity = 1;

function main() {
   var image = new Image();
   image.src = "./img1.jpg";
   image.onload = function() {
      render(image);
   };
}

function render(image) {
   // Get A WebGL context
   /** @type {HTMLCanvasElement} */

   // setup GLSL program
   program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);


   // look up where the vertex data needs to go.
   var positionLocation = gl.getAttribLocation(program, "a_position");
   var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

   // Create a buffer to put three 2d clip space points in
   var positionBuffer = gl.createBuffer();
   // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
   // Set a rectangle the same size as the image.


   setRectangle( gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

   // provide texture coordinates for the rectangle.
   var texcoordBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
   ]), gl.STATIC_DRAW);

   // Create a texture.
   var texture = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, texture);

   // Set the parameters so we can render any size image.
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

   // Upload the image into the texture.
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

   // lookup uniforms
   var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
   var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
   var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
   var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");

   // Define several convolution kernels


   updateCanvasSize();
   // Setup UI to pick kernels.

   drawWithKernel();

   function computeKernelWeight(kernel) {
      var weight = kernel.reduce(function(prev, curr) {
         return prev + curr;
      });
      return weight <= 0 ? 1 : weight;
   }

   function drawWithKernel() {
      gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Turn on the texcoord attribute
      gl.enableVertexAttribArray(texcoordLocation);

      // bind the texcoord buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

      // set the resolution
      gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

      // set the size of the image
      gl.uniform2f(textureSizeLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

      // set the kernel and it's weight
      gl.uniform1fv(kernelLocation, BLUR);
      gl.uniform1f(kernelWeightLocation, computeKernelWeight(BLUR));

      // Draw the rectangle.
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
   }

   initEventListeners();
   draw();
}

function setRectangle(gl, x, y, width, height) {
   var x1 = x;
   var x2 = x + width;
   var y1 = y;
   var y2 = y + height;
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2,
   ]), gl.STATIC_DRAW);
}

main();

function updateCanvasSize() {
   canvas.height = window.innerHeight;
   canvas.width = window.innerWidth;

   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
   gl.uniform1f(gl.getUniformLocation(program, 'u_canvas_size'),
       Math.max(canvas.height, canvas.width));
}

function initEventListeners() {
   window.addEventListener('resize', updateCanvasSize);

   canvas.addEventListener('mouseover', () => {
      is_active = true;
   })
   canvas.addEventListener('mouseout', () => {
      is_active = false;
   })

   canvas.addEventListener('mousemove', (e) => {
      let rect = canvas.getBoundingClientRect();

      let mouse_position = [
         e.clientX - rect.left,
         rect.height - (e.clientY - rect.top)
      ];

      gl.uniform2fv(gl.getUniformLocation(program, 'u_mouse_position'), mouse_position)
   })

}

let intensity = 1;
function draw(timeStamp) {
   gl.uniform1f(gl.getUniformLocation(program, 'u_time'), timeStamp / 1000.0);
   gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), intensity);

   if (is_active) {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0,6);

      if (intensity < 1) {
         intensity += 0.01;
      }
   } else {
      if (intensity > 0) {
         intensity -= 0.05;
         gl.drawArrays(gl.TRIANGLE_STRIP,0,6)
      }
   }

   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);

   requestAnimationFrame(draw);
}
