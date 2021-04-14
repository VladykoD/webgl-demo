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

   let colorLocation = gl.getUniformLocation(program, 'u_color');
   let matrixLocation = gl.getUniformLocation(program, 'u_matrix');

   let positionBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   let positions = [
      -2, -2,
      2,  2
   ];
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   gl.enableVertexAttribArray(positionAttributeLocation);

   let size = 2;
   let type = gl.FLOAT;
   let normalize = false;
   let stride = 0;
   let offset = 0;
   gl.vertexAttribPointer(positionAttributeLocation,
       size, type, normalize, stride, offset);

   requestAnimationFrame(drawScene);

   function drawScene(now) {
      resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0,0,gl.canvas.width, gl.canvas.height)

      now *= 0.001;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      let matrix = m3.rotation(now);
      gl.uniformMatrix3fv(matrixLocation, false, matrix);
      gl.uniform4fv(colorLocation, [0, 1, 0, 1]);

      let primitiveType = gl.LINES;
      let offset = 0;
      let count = 2;
      gl.drawArrays(primitiveType, offset, count);

      requestAnimationFrame(drawScene);
   }


   const canvasToDisplaySizeMap = new Map([[canvas, [300, 150]]]);
   function onResize(entries) {
      for (const entry of entries) {
         let width, height;
         let dpr = window.devicePixelRatio;

         if (entry.devicePixelContentBoxSize) {
            width = entry.devicePixelContentBoxSize[0].inlineSize;
            height = entry.devicePixelContentBoxSize[0].blockSize;
            dpr = 1;
         } else if(entry.contentBoxSize) {
            if(entry.contentBoxSize[0]) {
               width = entry.contentBoxSize[0].inlineSize;
               height = entry.contentBoxSize[0].blockSize;
            } else {
               width = entry.contentBoxSize.inlineSize;
               height = entry.contentBoxSize.blockSize;
            }
         } else {
            width = entry.contentRect.width;
            height = entry.contentRect.height;
         }

         const displayWidth = Math.round(width * dpr);
         const displayHeight = Math.round(height * dpr);

         canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight])
      }
   }

   const resizeObserver = new ResizeObserver(onResize);
   resizeObserver.observe(canvas, {box: 'content-box'});

   function resizeCanvasToDisplaySize(canvas) {
      const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

      const needResize = canvas.width !== displayWidth
          || canvas.height !== displayHeight;

      if (needResize) {
         canvas.width = displayWidth;
         canvas.height = displayHeight;
      }

      return needResize;
   }

})();


