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
   let translationLocation = gl.getUniformLocation(program, 'u_translation');
   let colorLocation = gl.getUniformLocation(program, 'u_color');

   let positionBuffer = gl.createBuffer();
   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   gl.enableVertexAttribArray(positionAttributeLocation);

   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

   let size = 2; //points per iteration
   let type = gl.FLOAT;
   let normalize = false;
   let stride = 0; // 0 = move forward size * sizeof(type)
                  // each iteration to get the next position
   let offset = 0;
   gl.vertexAttribPointer(positionAttributeLocation,
       size, type, normalize, stride, offset)

   //variables for translation
   let translation = [0,0];
   let width = 200;
   let height = 200;
   let color = [Math.random(), Math.random(), Math.random(), 1];

   //setup a ui
   webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: 800});
   webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: 600});

   function updatePosition(index) {
      return function (event, ui) {
         translation[index] = ui.value;
         drawScene();
      };
   }

   function drawScene() {
      resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0,0, canvas.width, canvas.height);

      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      setGeometry(gl, translation[0], translation[1], width, height )
      //setRectangle(gl, translation[0], translation[1], width, height);

      gl.uniform4fv(colorLocation, color);
      gl.uniform2fv(translationLocation, translation);

      let primitiveType = gl.TRIANGLES;
      let offset = 0;
      let count = 18;
      gl.drawArrays(primitiveType, offset, count)

      //requestAnimationFrame(drawScene);
   }


   const canvasToDisplaySizeMap = new Map([[canvas, [500, 500]]]);
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

   function setRectangle(gl, x,y,width, height) {
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
      ]), gl.STATIC_DRAW);
   }

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


   setGeometry(gl);
   drawScene();

})();


