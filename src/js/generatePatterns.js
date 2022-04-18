import { render } from '@testing-library/react';
import createProgramFromSources, {
    resizeCanvasToDisplaySize,
} from '../js/webglUtils';

var WebGLDebugUtil = require('webgl-debug');

// vertex shader function that is just a function to accompany the fragment shader
const getVertexShader = () => {
    const vs = `#version 300 es
    in vec2 a_position;
    precision highp float;

    uniform vec2 u_resolution;

    out vec2 v_position;

    void main(){
        gl_Position = vec4(a_position/u_resolution * 2.-1., 0, 1);
        v_position = vec2(a_position.x, u_resolution.y-a_position.y);
    }
    `;
    return vs;
};

const getFragmentShader = () => {
    const fs = `#version 300 es
    precision highp float;

    in vec2 v_position;

    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;  

    out vec4 outColor;

    void main(){
        vec2 v_oldPosition = vec2(v_position.x, u_resolution.y-v_position.y);
        outColor = vec4(.3, 0., 0., 1.);
        if(distance(v_position, u_mouse)<=10.){
            outColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    }

    `;
    return fs;
};

const renderPatterns = (canvas, mouse) => {
    // accessing WebGL2 context from canvas
    const gl = canvas.getContext('webgl2');
    const ctx = WebGLDebugUtil.makeDebugContext(gl);

    // resizing canvas context to canvas width set by CSS
    canvas.width = canvas.offsetWidth * 1;
    canvas.height = canvas.offsetHeight * 1;

    // creating program using the vs and fs functions above
    const program = createProgramFromSources(gl, [
        getVertexShader(),
        getFragmentShader(),
    ]);
    // console.log(program);
    // storing locations of attributes and uniforms (state variables)
    const locations = {
        position: gl.getAttribLocation(program, 'a_position'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        mouse: gl.getUniformLocation(program, 'u_mouse'),
    };

    // creating a position buffer to load the entire clipspace into webgl buffer
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // clipspace is formed using two (anticlockwise) triangles
    // prettier-ignore
    var positions = [
                   0, canvas.height, 
        canvas.width, 0, 
        canvas.width, canvas.height, 
                   0, 0, 
        canvas.width, 0, 
                   0, canvas.height
    ];
    // loading positions array to graphics buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // creating vertex array object that will attach the positionBuffer to the attributes
    var vao = gl.createVertexArray();
    // binding current vertex array to vao
    gl.bindVertexArray(vao);
    // connecting vao to a_position attribute
    gl.enableVertexAttribArray(locations.position);
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration (x, y)
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position (consecutive elemets)
    var offset = 0; // start at the beginning of the buffer
    // attach vao to the current ARRAY_BUFFER (positionBuffer) and pass instructions on how to interpret the data
    gl.vertexAttribPointer(
        locations.position,
        size,
        type,
        normalize,
        stride,
        offset
    );

    // resizing canvas to fit the fill clipspace - not sure why since we already did canvas.width = offsetWidth and all...
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Telling WebGL to use our program (with the pair of shaders)
    gl.useProgram(program);

    // generating arrays that will be sent to uniforms

    // setting uniforms
    gl.uniform2f(locations.resolution, canvas.width, canvas.height);
    // console.log(mouse);
    if (mouse) gl.uniform2f(locations.mouse, ...mouse);
    else gl.uniform2f(locations.mouse, ...[100, 100]);
    gl.uniform1f(locations.time, 1);

    // drawwwww
    var primType = gl.TRIANGLES;
    offset = 0;
    var count = positions.length / size;
    gl.drawArrays(primType, offset, count);
    // requestAnimationFrame(renderPatterns);

    // simply reading the data
    // var results = new Uint8Array(canvas.width * canvas.height * 4);
    // gl.readPixels(
    //     0,
    //     0,
    //     canvas.width,
    //     canvas.height,
    //     gl.RGBA,
    //     gl.UNSIGNED_BYTE,
    //     results
    // );
    // var resultsB = [];
    // for (let i = 0; i < canvas.width * canvas.height; i++) {
    //     resultsB.push({
    //         r: results[4 * i],
    //         g: results[4 * i + 1],
    //         b: results[4 * i + 2],
    //         a: results[4 * i + 3],
    //     });
    // }
    // console.log(results.slice(0, 4));
    // console.log(resultsB);
};

export default renderPatterns;
