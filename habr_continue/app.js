const IDs = {
   canvas: 'canvas',
   shaders: {
      vertex: 'vertex-shader',
      fragment: 'fragment-shader'
   }
};


const URLS = {
   textures: [
      'red.jpg',
      'orange.jpg',
      'yellow.jpg',
   ]
};


const CANVAS = document.getElementById(IDs.canvas);
const GL = canvas.getContext('webgl');

let PROGRAM;

const NUMBER_OF_POINTS = 20;
let POINTS = [];


main();


function main() {
   clearCanvas();
   createPlane();
   createProgram();
   createTextures();
   updateCanvasSize();
   initEventListeners();
   createPoints();
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
   const shaders = getShaders();

   PROGRAM = GL.createProgram();

   GL.attachShader(PROGRAM, shaders.vertex);
   GL.attachShader(PROGRAM, shaders.fragment);
   GL.linkProgram(PROGRAM);

   const vertexPositionAttribute = GL.getAttribLocation(PROGRAM, 'a_position');

   GL.enableVertexAttribArray(vertexPositionAttribute);
   GL.vertexAttribPointer(vertexPositionAttribute, 2, GL.FLOAT, false, 0, 0);

   GL.useProgram(PROGRAM);
}


function getShaders() {
   return {
      vertex: compileShader(
          GL.VERTEX_SHADER,
          document.getElementById(IDs.shaders.vertex).textContent
      ),
      fragment: compileShader(
          GL.FRAGMENT_SHADER,
          document.getElementById(IDs.shaders.fragment).textContent
      )
   };
}


function compileShader(type, source) {
   const shader = GL.createShader(type);

   GL.shaderSource(shader, source);
   GL.compileShader(shader);

   console.log(GL.getShaderInfoLog(shader));

   return shader;
}


function createTextures() {
   for (let i = 0; i < URLS.textures.length; i++) {
      createTexture(i);
   }
}


function createTexture(index) {
   const image = new Image();

   image.crossOrigin = 'anonymous';

   image.onload = () => {
      const texture = GL.createTexture();

      GL.activeTexture(GL['TEXTURE' + index]);
      GL.bindTexture(GL.TEXTURE_2D, texture);
      GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, GL.RGB, GL.UNSIGNED_BYTE, image);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);

      GL.uniform1i(GL.getUniformLocation(PROGRAM, 'u_textures[' + index + ']'), index);
   };

   image.src = URLS.textures[index];
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
}


function createPoints() {
   for (let i = 0; i < NUMBER_OF_POINTS; i++) {
      POINTS.push([Math.random(), Math.random()]);
   }
}


function movePoints(timeStamp) {
   if (timeStamp) {
      for (let i = 0; i < NUMBER_OF_POINTS; i++) {
         POINTS[i][0] += Math.sin(i * timeStamp / 5000) / 500;
         POINTS[i][1] += Math.cos(i * timeStamp / 5000) / 500;
      }


      for (let i = 0; i < NUMBER_OF_POINTS; i++) {
         for (let j = i; j < NUMBER_OF_POINTS; j++) {
            let deltaX = POINTS[i][0] - POINTS[j][0];
            let deltaY = POINTS[i][1] - POINTS[j][1];
            let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < 0.1) {
               POINTS[i][0] += 0.001 * Math.sign(deltaX);
               POINTS[i][1] += 0.001 * Math.sign(deltaY);
               POINTS[j][0] -= 0.001 * Math.sign(deltaX);
               POINTS[j][1] -= 0.001 * Math.sign(deltaY);
            }
         }
      }
   }
}


function draw(timeStamp) {
   GL.uniform1f(GL.getUniformLocation(PROGRAM, 'u_time'), timeStamp / 1000.0);

   movePoints(timeStamp);

   for (let i = 0; i < NUMBER_OF_POINTS; i++) {
      GL.uniform2fv(GL.getUniformLocation(PROGRAM, 'u_points[' + i + ']'), POINTS[i]);
   }

   GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);

   requestAnimationFrame(draw);
}
