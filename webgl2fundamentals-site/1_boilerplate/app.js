/**
 * Creates a shader from the content of a script tag.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} scriptId The id of the script tag.
 * @param {string} opt_shaderType. The type of shader to create.
 *     If not passed in will use the type attribute from the
 *     script tag.
 * @return {!WebGLShader} A shader.
 */
function createShaderFromScript(gl, scriptId, opt_shaderType) {
   let shaderScript = document.getElementById(scriptId);
   if(!shaderScript) {
      throw ('ERROR: unknown script element' + scriptId);
   }

   let shaderSource = shaderScript.text;
   if (!opt_shaderType) {
      if (shaderScript.type == 'x-shader/x-vertex') {
         opt_shaderType = gl.VERTEX_SHADER;
      } else if (shaderScript.type == 'x-shader/x-fragment') {
         opt_shaderType = gl.FRAGMENT_SHADER;
      } else if (!opt_shaderType) {
         throw ('ERROR: shader type not set');
      }
   }

   return compileShader(gl, shaderSource, opt_shaderType);
}

/**
 * Creates a program from 2 script tags.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} vertexShaderId The id of the vertex shader script tag.
 * @param {string} fragmentShaderId The id of the fragment shader script tag.
 * @return {!WebGLProgram} A program
 */
function createProgramFromScripts(gl, vertexShaderId, fragmentShaderId) {
   let vertexShader = createShaderFromScript(gl, vertexShaderId, gl.VERTEX_SHADER);
   let fragmentShader = createShaderFromScript(gl, fragmentShaderId, gl.FRAGMENT_SHADER);

   return createProgram(gl, vertexShader, fragmentShader)
}

// var program = webglUtils.createProgramFromScripts(
//   gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);








/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
function createProgram(gl, vertexShader, fragmentShader) {
   let program = gl.createProgram();

   gl.attachShader(program, vertexShader);
   gl.attachShader(program, fragmentShader);

   gl.linkProgram(program);

   let success = gl.getProgramParameter(program, gl.LINK_STATUS);
   if (!success) {
      throw ("program filed to link:" + gl.getProgramInfoLog (program));
   }

   return program;
}

/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
function compileShader(gl, shaderSource, shaderType) {
   let shader = gl.createShader(shaderType);
   gl.shaderSource(shader, shaderSource);
   gl.compileShader(shader);

   let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
   if(!success) {
      throw "couldn't compile shader: " + gl.getShaderInfoLog(shader);
   }

   return shader;
}
