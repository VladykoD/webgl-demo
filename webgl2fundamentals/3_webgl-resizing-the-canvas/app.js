'use strict'

var vs = `#version 300 es
in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
`;

var fs = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
   outColor = u_color;
}
`;

(() => {
   let canvas = document.querySelector('canvas');
   let gl = canvas.getContext('webgl2');
   if (!gl) return;

   var program = webglUtils.createProgramFromSources(gl, [vs, fs]);
   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ERROR! Linking program', gl.getProgramInfoLog(program))
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
      now *= 0.001;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      let matrix = m3.rotation(now);
      gl.uniformMatrix3fv(matrixLocation, false, matrix);
      gl.uniform4fv(colorLocation, [1, 1, 0, 1]);

      let primitiveType = gl.LINES;
      let offset = 0;
      let count = 2;
      gl.drawArrays(primitiveType, offset, count);

      requestAnimationFrame(drawScene);
   }
})();
