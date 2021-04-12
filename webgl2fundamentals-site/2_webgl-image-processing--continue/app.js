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
   image.width = window.innerWidth;
   image.height = window.innerHeight;
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
   let flipYLocation = gl.getUniformLocation(program, 'u_flipY');

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
   gl.vertexAttribPointer(
       positionAttributeLocation,
       size, type, normalize, stride, offset);

   let texCoordBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
   ]), gl.STATIC_DRAW);

   gl.enableVertexAttribArray(texCoordAttributeLocation);

   gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);


   function createAndSetupTexture(gl) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      return texture;
   }

   //create a texture and put the image in it
   let originalImageTexture = createAndSetupTexture(gl);

   //upload the image into the texture
   let mipLevel = 0;
   let internalFormat = gl.RGBA;
   let srcFormat = gl.RGBA;
   let srcType = gl.UNSIGNED_BYTE;
   gl.texImage2D(gl.TEXTURE_2D,
       mipLevel,
       internalFormat,
       srcFormat,
       srcType,
       image);

   //create 2 textures and attach them to framebuffers
   let textures = [];
   let framebuffers = [];
   for (let ii=0; ii<2; ++ii) {
      let texture = createAndSetupTexture(gl);
      textures.push(texture);

      //make the texture the same size as the image
      let mipLevel = 0; //largest mip
      let internalFormat = gl.RGBA; //what we want in the texture
      let border = 0; //must be 0
      let srcFormat = gl.RGBA; //format of data we are supplying
      let srcType = gl.UNSIGNED_BYTE; //type of data we are supplying
      let data = null; // no data = create a blank texture
      gl.texImage2D(
          gl.TEXTURE_2D,
          mipLevel,
          internalFormat,
          image.width,
          image.height,
          border,
          srcFormat,
          srcType,
          data);

      //create a framebuffer
      let fbo = gl.createFramebuffer();
      framebuffers.push(fbo);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      //attach a texture to it
      let attachmentPoint = gl.COLOR_ATTACHMENT0;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
   }

   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   setRectangle(gl, 0,0, image.width, image.height);

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

   var effects = [
      { name: "normal" },
      { name: "gaussianBlur" },
      { name: "gaussianBlur2", on: true },
      { name: "gaussianBlur3", on: true },
      { name: "unsharpen" },
      { name: "sharpness", on: true },
      { name: "sharpen" },
      { name: "edgeDetect" },
      { name: "edgeDetect2" },
      { name: "edgeDetect3"},
      { name: "edgeDetect4" },
      { name: "edgeDetect5" },
      { name: "edgeDetect6" },
      { name: "sobelHorizontal" },
      { name: "sobelVertical" },
      { name: "previtHorizontal" },
      { name: "previtVertical" },
      { name: "boxBlur" },
      { name: "triangleBlur" },
      { name: "emboss" },
   ];

   let ui = document.querySelector('#ui');
   let table = document.createElement('table');
   let tbody = document.createElement('tbody');

   for (let ii=0; ii<effects.length; ++ii) {
      let effect = effects[ii];
      let tr = document.createElement('tr');
      let td = document.createElement('td');
      let chk = document.createElement('input');
      let label = document.createElement('label');
      chk.id = effect.name;
      chk.value = effect.name;
      chk.type = 'checkbox';
      label.setAttribute('for', effect.name);

      if (effect.on) {
         chk.checked = 'true';
      }
      chk.onchange = drawEffects;
      td.appendChild(chk);
      label.appendChild(document.createTextNode(effect.name));
      td.appendChild(label);
      tr.appendChild(td);
      tbody.appendChild(tr);
   }
   table.appendChild(tbody);
   ui.appendChild(table);
   //$("#ui table").tableDnD({onDrop: drawEffects});

   drawEffects();


   function computeKernelWeight(kernel) {
      let weight = kernel.reduce(function (prev, curr) {
         return prev + curr;
      });
      return weight <= 0 ? 1 : weight;
   }


   function drawEffects() {
      resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      //start with the original image on unit 0
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

      // Tell the shader to get the texture from texture unit 0
      gl.uniform1i(imageLocation, 0);

      //tell the shader to get the texture from texture unit 0
      gl.uniform1f(flipYLocation, 1);

      //loop through each effect we want to apply
      let count = 0;
      for (let ii = 0; ii < tbody.rows.length; ++ii) {
         let checkbox = tbody.rows[ii].firstChild.firstChild;

         if (checkbox.checked) {
            //setup to draw into one of the framebuffer
            setFramebuffer(framebuffers[count % 2], image.width, image.height);

            drawWithKernel(checkbox.value);

            // for the next draw, use the texture we just rendered to.
            gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

            ++count;
         }
      }

      //finally draw the result to the canvas
      gl.uniform1f(flipYLocation, -1);
      setFramebuffer(null, gl.canvas.width, gl.canvas.height);

      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      drawWithKernel("normal");
   }

   function setFramebuffer(fbo, width, height) {
      //make this the framebuffer we are rendering to
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      //tell the shader the resolution of the framebuffer
      gl.uniform2f(resolutionLocation, width, height);

      //tell webgl how to convert from clip space to pixels
      gl.viewport(0,0,width,height)
   }

   function drawWithKernel(name) {
      gl.uniform1fv(kernelLocation, kernels[name]);
      gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

      let primitiveType = gl.TRIANGLES;
      let count = 6;
      let offset = 0;
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

function resizeCanvasToDisplaySize(canvas, multiplier) {
   multiplier = multiplier || 1;
   const width  = canvas.clientWidth  * multiplier | 0;
   const height = canvas.clientHeight * multiplier | 0;
   if (canvas.width !== width ||  canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
      return true;
   }
   return false;
}
