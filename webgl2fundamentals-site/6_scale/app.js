'use strict';

(() => {
   let canvas = document.querySelector('canvas');
   let gl = canvas.getContext('webgl2');
   if (!gl) return;

   let source = document.querySelector('#vertex-shader').innerHTML;
   let vertexShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertexShader, source);
   gl.compileShader(vertexShader);

   source = document.querySelector('#fragment-shader').innerHTML;
   let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fragmentShader, source);
   gl.compileShader(fragmentShader);
   let program = gl.createProgram();

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

   let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');

   let resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
   let colorLocation = gl.getUniformLocation(program, 'u_color');
   let translationLocation = gl.getUniformLocation(program, 'u_translation');
   let rotationLocation = gl.getUniformLocation(program, 'u_rotation');

   let positionBuffer = gl.createBuffer();
   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   gl.enableVertexAttribArray(positionAttributeLocation);

   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   setGeometry(gl);

   let size = 2; //points per iteration
   let type = gl.FLOAT;
   let normalize = false;
   let stride = 0; // 0 = move forward size * sizeof(type)
                  // each iteration to get the next position
   let offset = 0;
   gl.vertexAttribPointer(positionAttributeLocation,
       size, type, normalize, stride, offset)

   //variables for translation
   let translation = [150,100];
   let rotation = [0,1];
   let color = [Math.random(), Math.random(), Math.random(), 1];

   drawScene();

   //setup a ui
   webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: 800});
   webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: 600});
   webglLessonsUI.setupSlider("#angle", {slide: updateAngle, max: 360});

   $("#rotation").gmanUnitCircle({
      width: 200,
      height: 200,
      value: 0,
      slide: function(e, u) {
         rotation[0] = u.x;
         rotation[1] = u.y;
         drawScene();
      },
   });

   function updatePosition(index) {
      return function (event, ui) {
         translation[index] = ui.value;
         drawScene();
      };
   }
   function updateAngle(event, ui) {
      let angleInDegrees = 360 - ui.value;
      let angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);
      drawScene();
   }

   function drawScene() {
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0,0, canvas.width, canvas.height);

      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

      gl.uniform4fv(colorLocation, color);
      gl.uniform2fv(translationLocation, translation);
      gl.uniform2fv(rotationLocation, rotation);

      let primitiveType = gl.TRIANGLES;
      let offset = 0;
      let count = 18;
      gl.drawArrays(primitiveType, offset, count)
   }

})();



function setGeometry(gl) {
   gl.bufferData(
       gl.ARRAY_BUFFER,
       new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90]),
       gl.STATIC_DRAW);

}

function printSineAndCosineForAnAngle(angleInDegrees) {
   var angleInRadians = angleInDegrees * Math.PI / 180;
   var s = Math.sin(angleInRadians);
   var c = Math.cos(angleInRadians);
   console.log("s = " + s + " c = " + c);
}
