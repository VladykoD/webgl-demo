const CANVAS = document.getElementById('canvas');
const GL = CANVAS.getContext('webgl');

let PROGRAM;

let is_active = true;
let intensity = 1;


main();

function main() {
   clearCanvas();
   createPlane();
   createProgram();
   createTexture();
   updateCanvasSize();
   initEventListeners();
   draw();
}


function clearCanvas() {
   GL.clearColor(0.26, 1, 0.93, 1.0);
   GL.clear(GL.COLOR_BUFFER_BIT);
}


function createPlane() {
   GL.bindBuffer(GL.ARRAY_BUFFER, GL.createBuffer());
   GL.bufferData(
       GL.ARRAY_BUFFER,
       new Float32Array([
          -1, -1,
          -1,  1,
          1, -1,
          1,  1
       ]),
       GL.STATIC_DRAW
   );
}


function createProgram() {

   let source = document.querySelector('#vertex-shader').innerHTML;
   let vertexShader = GL.createShader(GL.VERTEX_SHADER);
   GL.shaderSource(vertexShader, source);
   GL.compileShader(vertexShader);

   if(!GL.getShaderParameter(vertexShader, GL.COMPILE_STATUS)) {
      console.error('ERROR! compiling vertex shader', GL.getShaderInfoLog(vertexShader))
      return;
   }

   source = document.querySelector('#fragment-shader').innerHTML;
   let fragmentShader = GL.createShader(GL.FRAGMENT_SHADER);
   GL.shaderSource(fragmentShader, source);
   GL.compileShader(fragmentShader);

   if(!GL.getShaderParameter(fragmentShader, GL.COMPILE_STATUS)) {
      console.error('ERROR! compiling fragment shader', GL.getShaderInfoLog(fragmentShader))
      return;
   }

   PROGRAM = GL.createProgram();

   GL.attachShader(PROGRAM, vertexShader);
   GL.attachShader(PROGRAM, fragmentShader);
   GL.linkProgram(PROGRAM);

   if (!GL.getProgramParameter(PROGRAM, GL.LINK_STATUS)) {
      let linkErrLog = GL.getProgramInfoLog(PROGRAM);
      console.log('Shader program did not link successfully. Error log: \n' + linkErrLog)
      return;
   }

   GL.detachShader(PROGRAM, vertexShader);
   GL.detachShader(PROGRAM, fragmentShader);

   GL.deleteShader(vertexShader)
   GL.deleteShader(fragmentShader)


   const vertexPositionAttribute = GL.getAttribLocation(PROGRAM, 'a_position');

   GL.enableVertexAttribArray(vertexPositionAttribute);
   GL.vertexAttribPointer(vertexPositionAttribute, 2, GL.FLOAT, false, 0, 0);

   GL.useProgram(PROGRAM);
}

function createTexture() {
   const image = new Image();

   image.crossOrigin = 'anonymous';

   image.onload = () => {
      const texture = GL.createTexture();

      GL.activeTexture(GL.TEXTURE0);
      GL.bindTexture(GL.TEXTURE_2D, texture);
      GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, GL.RGB, GL.UNSIGNED_BYTE, image);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);

      GL.uniform1i(GL.getUniformLocation(PROGRAM, 'u_texture'), 0);
   };

   image.src = './img1.jpg';
}



function updateCanvasSize() {

   CANVAS.height = window.innerHeight;
   CANVAS.width = window.innerWidth;

   GL.viewport(0, 0, GL.canvas.width, GL.canvas.height);
   GL.uniform1f(GL.getUniformLocation(PROGRAM, 'u_canvas_size'),
       Math.max(CANVAS.height, CANVAS.width));
}


function initEventListeners() {
   window.addEventListener('resize', updateCanvasSize);

   CANVAS.addEventListener('mouseover', () => {
      is_active = false;
   })
   CANVAS.addEventListener('mouseout', () => {
      is_active = true;
   })
}


function draw(timeStamp) {
   GL.uniform1f(GL.getUniformLocation(PROGRAM, 'u_time'), timeStamp / 1000.0);
   GL.uniform1f(GL.getUniformLocation(PROGRAM, 'u_intensity'), intensity);

   if (is_active) {
      GL.drawArrays(GL.TRIANGLE_STRIP, 0,4);

      if (intensity < 1) {
         intensity += 0.01;
      }
   } else {
      if (intensity > 0) {
         intensity -= 0.05;
         GL.drawArrays(GL.TRIANGLE_STRIP,0,4)
      }
   }

   GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);

   requestAnimationFrame(draw);
}
