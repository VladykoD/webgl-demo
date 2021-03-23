'use strict'

window.addEventListener('load', setupWebGL, false);

let gl, program;

function setupWebGL(evt) {
   window.removeEventListener(evt.type, setupWebGL, false);

   if (!(gl = getRenderingContext())) return

   let source = document.querySelector('#vertex-shader').innerHTML;
   let vertexShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertexShader, source);
   gl.compileShader(vertexShader);

   source = document.querySelector('#fragment-shader').innerHTML;
   let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fragmentShader, source);
   gl.compileShader(fragmentShader);
   program = gl.createProgram();

   gl.attachShader(program, vertexShader);
   gl.attachShader(program, fragmentShader);
   gl.linkProgram(program);

   gl.detachShader(program, vertexShader);
   gl.detachShader(program, fragmentShader);

   gl.deleteShader(vertexShader)
   gl.deleteShader(fragmentShader)

   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      let linkErrLog = gl.getProgramInfoLog(program);
      cleanup();
      console.log('Shader program did not link successfully. Error log: \n' + linkErrLog)
      return;
   }

   initializeAttributes();

   gl.useProgram(program);
   gl.drawArrays(gl.POINTS, 0, 1);

   cleanup();
}


let buffer;
function initializeAttributes() {
   gl.enableVertexAttribArray(0);
   buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.vertexAttribPointer(0,1,gl.FLOAT, false, 0,0)
}

function cleanup() {
   gl.useProgram(null);
   if(buffer) gl.deleteBuffer(buffer)
   if(program) gl.deleteProgram(program)
}

function getRenderingContext() {
   let canvas = document.querySelector('canvas');
   canvas.width = canvas.clientWidth;
   canvas.height = canvas.clientHeight;

   let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
   if (!gl) {
      console.log("Failed to get WebGL context. \nYour browser or device may not support WebGL.");
      return null;
   }

   gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight)
   gl.clearColor(0.0, 0.0, 0.0, 1.0);
   gl.clear(gl.COLOR_BUFFER_BIT);
   return gl;

}
