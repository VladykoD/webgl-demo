const vertexShaderText = [
    'precision mediump float;',
    'attribute vec2 vertPosition;',
    'attribute vec3 vertColor;',
    'varying vec3 fragColor;',
    '',
    'void main() {',
       'fragColor = vertColor;',
       'gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '}'
].join('\n');

const fragmentShaderText = [
   'precision mediump float;',
   '',
   'varying vec3 fragColor;',
   'void main() {',
      'gl_FragColor = vec4(fragColor, 1.0);',
   '}'
].join('\n');


const InitDemo = function () {
   //init webgl
   const canvas = document.getElementById('surface');
   let gl = canvas.getContext('webgl');

   if(!gl) {
      console.log('WebGl not supported, falling back on experimental-webgl')
      gl = canvas.getContext('experimental-webgl')
   }

   //set color
   gl.clearColor(0.75, 0.85, 0.8, 1.0); //rgba
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   //vertex && fragment shaders
   //create
   const vertexShader = gl.createShader(gl.VERTEX_SHADER);
   const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

   gl.shaderSource(vertexShader, vertexShaderText);
   gl.shaderSource(fragmentShader, fragmentShaderText);

   gl.compileShader(vertexShader)
   if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('ERROR! compiling vertex shader', gl.getShaderInfoLog(vertexShader))
      return;
   }
   gl.compileShader(fragmentShader);
   if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('ERROR! compiling fragment shader', gl.getShaderInfoLog(fragmentShader))
      return;
   }

   //graphics pipeline
   const program = gl.createProgram();
   gl.attachShader(program, vertexShader);
   gl.attachShader(program, fragmentShader);
   gl.linkProgram(program)
   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ERROR! Linking program', gl.getProgramInfoLog(program))
      return;
   }

   //validation of program
   gl.validateProgram(program)
   if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      console.error('ERROR! Validating program', gl.getProgramInfoLog(program))
      return;
   }

   //create buffer
   const triangleVertices = [
       //x,y - counter clock direction      R, G, B
       0.0,  0.5,   1.0, 1.0, 0.0,
      -0.5, -0.5,   0.7, 0.0, 1.0,
       0.5, -0.5,   0.1, 1.0, 0.6,
   ];

   const triangleVertexBufferObject = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);


   //inform that we have vertex
   const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition')
   const colorAttribLocation = gl.getAttribLocation(program, 'vertColor')
   gl.vertexAttribPointer(
       positionAttribLocation, //attribute location
       2,  //number of elements per attr
       gl.FLOAT, //type of el
       gl.FALSE,
       5 * Float32Array.BYTES_PER_ELEMENT, //size of an indiv vertex
       0  // offset from the beginning of a single vertex to this attribute
   );
   gl.vertexAttribPointer(
       colorAttribLocation, //attribute location
       3,  //number of elements per attr
       gl.FLOAT, //type of el
       gl.FALSE,
       5 * Float32Array.BYTES_PER_ELEMENT, //size of an indiv vertex
       2 * Float32Array.BYTES_PER_ELEMENT  // offset from the beginning of a single vertex to this attribute
   );

   gl.enableVertexAttribArray(positionAttribLocation)
   gl.enableVertexAttribArray(colorAttribLocation)

   //main render loop
   gl.useProgram(program);
   gl.drawArrays(gl.TRIANGLES, 0, 3);




}
