import { render } from '@testing-library/react';
import createProgramFromSources from '../js/webglUtils';
import {
    createProgramInfo,
    createBufferInfoFromArrays,
    resizeCanvasToDisplaySize,
    drawBufferInfo,
    setUniforms,
    setBuffersAndAttributes,
    createTextures,
    createTexture,
    createFramebufferInfo,
    bindFramebufferInfo,
} from 'twgl.js';

var WebGLDebugUtil = require('webgl-debug');

// vertex shader function that is just a function to accompany the fragment shader
function getXY(points) {
    let XYs = [];
    for (let i in points) {
        XYs[i] = points[i].r;
    }
    return XYs;
}

const renderPatterns = (setup, canvas, points, radius) => {
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

    const getFragmentShader = (length) => {
        const fs = `#version 300 es
        precision highp float;
    
        in vec2 v_position;
    
        uniform float u_time;
        uniform vec2 u_points[${length}];
        uniform float u_thickness[${length}];
        uniform vec2 u_resolution; 
        uniform float u_radius;
        uniform bool u_copyTexture;
        uniform bool u_init;
        uniform sampler2D u_texture;
    
        out vec4 outColor;

        bool shouldIColour(vec2 v_position){
            for (int i = 0; i < ${length}; i++){
                if(distance(v_position, u_points[i])<=u_thickness[i]) return true;
            }
            return false;
        }
    
        void main(){
            vec2 v_oldPosition = vec2(v_position.x, u_resolution.y-v_position.y);

            // outColor = vec4(.5, 0.1, 0.15, .2);
            // if(distance(v_position, u_mouse)<=10.){
            //     outColor = vec4(1.0, 1.0, 1.0, 1.0);
            // }else if(distance(v_position, u_mouse)<=13.){
            //     outColor = vec4(0., 0., 0., 0.);
            // }
            
            outColor = vec4(0., 0., 0., 0.);
            if(u_copyTexture){
                outColor = texture(u_texture, gl_FragCoord.xy);
            }
            else{
                if(shouldIColour(v_position)){
                    outColor = vec4(1.0, 1.0, 1.0, 1.0);
                }
                if(!u_init){
                    outColor = max(outColor, texture(u_texture, gl_FragCoord.xy));
                    // outColor = max(vec4(0.4,0.0,0.0,1.0), texture(u_texture, gl_FragCoord.xy));
                }
            }
        }
    
        `;
        return fs;
    };

    // console.log(points);
    // accessing WebGL2 context from canvas
    let shouldIReturnASetup = false;
    if (setup == null) {
        setup = {};
        shouldIReturnASetup = true;
        setup.gl = canvas.getContext('webgl2', {
            antialias: true,
            preserveDrawingBuffer: true,
        });
        const ctx = WebGLDebugUtil.makeDebugContext(setup.gl);
        // resizing canvas context to canvas width set by CSS
        canvas.width = canvas.offsetWidth * 1;
        canvas.height = canvas.offsetHeight * 1;

        setup.programInfo = createProgramInfo(setup.gl, [
            getVertexShader(),
            getFragmentShader(points.length),
        ]);
    }
    const arrays = {
        a_position: {
            numComponents: 2,
            // prettier-ignore
            data: [
                       0, canvas.height, 
            canvas.width, 0, 
            canvas.width, canvas.height, 
                       0, 0, 
            canvas.width, 0, 
                       0, canvas.height
        ]
        },
    };
    const bufferInfo = createBufferInfoFromArrays(setup.gl, arrays);
    resizeCanvasToDisplaySize(setup.gl.canvas);
    setup.gl.viewport(0, 0, setup.gl.canvas.width, setup.gl.canvas.height);
    // setup.gl.clear(setup.gl.DEPTH_BUFFER_BIT);
    setup.gl.clear(setup.gl.COLOR_BUFFER_BIT);
    setup.gl.useProgram(setup.programInfo.program);
    setBuffersAndAttributes(setup.gl, setup.programInfo, bufferInfo);
    if (shouldIReturnASetup) {
        const tracers = [];
        const frameBuffers = [];
        for (let i = 0; i < 2; i++) {
            let tex = createTexture(setup.gl, {
                width: canvas.width,
                height: canvas.height,
            });
            let fb = createFramebufferInfo(setup.gl, [{ attachment: tex }]);
            tracers.push(tex);
            frameBuffers.push(fb);
        }
        setup.tracers = tracers;
        setup.frameBuffers = frameBuffers;
        setup.nextTexture = 0;
    } else {
        setup.gl.activeTexture(setup.gl.TEXTURE0 + 0);
        setup.gl.bindTexture(
            setup.gl.TEXTURE_2D,
            setup.tracers[setup.nextTexture % 2]
        );
    }
    const uniforms = {
        u_resolution: [canvas.width, canvas.height],
        u_time: 1,
        u_points: points ? getXY(points).flat() : [100, 100],
        u_thickness: points.map(({ thickness }) => thickness),
        u_init: shouldIReturnASetup,
        u_copyTexture: false,
        u_texture: setup.tracers[setup.nextTexture++ % 2],
    };
    setUniforms(setup.programInfo, uniforms);
    bindFramebufferInfo(setup.gl, setup.frameBuffers[setup.nextTexture % 2]);
    drawBufferInfo(setup.gl, bufferInfo, setup.gl.TRIANGLES);
    uniforms.u_copyTexture = false;
    setUniforms(setup.programInfo, uniforms);
    setup.gl.bindTexture(
        setup.gl.TEXTURE_2D,
        setup.tracers[setup.nextTexture % 2]
    );
    bindFramebufferInfo(setup.gl, null);
    setup.gl.viewport(0, 0, setup.gl.canvas.width, setup.gl.canvas.height);
    setup.gl.clearColor(0, 0, 0, 0);
    setup.gl.clear(setup.gl.COLOR_BUFFER_BIT | setup.gl.DEPTH_BUFFER_BIT);
    drawBufferInfo(setup.gl, bufferInfo, setup.gl.TRIANGLES);

    // console.log(setup.programInfo);
    // storing locations of attributes and uniforms (state variables)
    // const locations = {
    //     position: setup.gl.getAttribLocation(setup.programInfo, 'a_position'),
    //     resolution: setup.gl.getUniformLocation(setup.programInfo, 'u_resolution'),
    //     time: setup.gl.getUniformLocation(setup.programInfo, 'u_time'),
    //     points: setup.gl.getUniformLocation(setup.programInfo, 'u_points'),
    //     thickness: setup.gl.getUniformLocation(setup.programInfo, 'u_thickness'),
    // };

    // creating a position buffer to load the entire clipspace into webgl buffer
    // var positionBuffer = setup.gl.createBuffer();
    // setup.gl.bindBuffer(setup.gl.ARRAY_BUFFER, positionBuffer);

    // var positions = [
    //                0, canvas.height,
    //     canvas.width, 0,
    //     canvas.width, canvas.height,
    //                0, 0,
    //     canvas.width, 0,
    //                0, canvas.height
    // ];
    // loading positions array to graphics buffer
    // setup.gl.bufferData(setup.gl.ARRAY_BUFFER, new Float32Array(positions), setup.gl.STATIC_DRAW);

    // // creating vertex array object that will attach the positionBuffer to the attributes
    // var vao = setup.gl.createVertexArray();
    // // binding current vertex array to vao
    // setup.gl.bindVertexArray(vao);
    // // connecting vao to a_position attribute
    // setup.gl.enableVertexAttribArray(locations.position);
    // // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    // var size = 2; // 2 components per iteration (x, y)
    // var type = setup.gl.FLOAT; // the data is 32bit floats
    // var normalize = false; // don't normalize the data
    // var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position (consecutive elemets)
    // var offset = 0; // start at the beginning of the buffer
    // // attach vao to the current ARRAY_BUFFER (positionBuffer) and pass instructions on how to interpret the data
    // setup.gl.vertexAttribPointer(
    //     locations.position,
    //     size,
    //     type,
    //     normalize,
    //     stride,
    //     offset
    // );

    // resizing canvas to fit the fill clipspace - not sure why since we already did canvas.width = offsetWidth and all...

    // if (points) uniforms.u_points = getXY(points).flat();
    // else uniforms.u_points = [100, 100];
    // generating arrays that will be sent to uniforms

    // setting uniforms
    // setup.gl.uniform2f(locations.resolution, canvas.width, canvas.height);
    // // console.log(points);
    // if (points) setup.gl.uniform2fv(locations.points, getXY(points).flat());
    // else setup.gl.uniform2fv(locations.points, ...[100, 100]);
    // setup.gl.uniform1f(locations.time, 1);
    // // console.log(points.map(({ thickness }) => thickness));
    // // console.log(points[0].thickness);
    // setup.gl.uniform1fv(
    //     locations.thickness,
    //     points.map(({ thickness }) => thickness)
    // );

    // drawwwww
    // var primType = setup.gl.TRIANGLES;
    // offset = 0;
    // var count = positions.length / size;
    // setup.gl.drawArrays(primType, offset, count);
    // requestAnimationFrame(renderPatterns);

    // simply reading the data
    // var results = new Uint8Array(canvas.width * canvas.height * 4);
    // setup.gl.readPixels(
    //     0,
    //     0,
    //     canvas.width,
    //     canvas.height,
    //     setup.gl.RGBA,
    //     setup.gl.UNSIGNED_BYTE,
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
    if (shouldIReturnASetup) return setup;
};

function decodeRGBAToFloat(bits) {
    // console.log(bits);
    var conV;
    conV = bits[2] * 2 ** -15 + bits[3] * 2 ** -23;
    // console.log(conV);
    conV =
        bits[1] > 128
            ? -(conV + (bits[1] - 128) * 2 ** -7 + 1)
            : conV + bits[1] * 2 ** -7 + 1;
    conV *= 2 ** (bits[0] - 127);
    return conV;
}

const computePhysics = (canvas, points, deltaT) => {
    const frag = (x) => x;
    const vert = (x) => x;
    const getVertexShader = () => {
        const vs = `#version 300 es
        in vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0., 1.);
        }
        
        `;
        return vs;
    };
    const getFragmentShader = (length) => {
        const fs = `#version 300 es
        precision highp float;
         
        uniform vec2 u_position[${length}];
        uniform vec2 u_velocity[${length}];
        uniform vec2 u_acceleration[${length}];
        uniform float u_deltaT;
         
        out vec4 outColor;

        const vec4 bitEnc = vec4(1.0,255.0,65535.0,16777215.0);
        const vec4 bitDec = 1./bitEnc;

        vec4 EncodeFloatRGBA (float v) {
            int exponent = int(floor(log(abs(v))/log(2.)));
            float mantissa = v/pow(2.,float(exponent));
            bool neg = (mantissa<0.)?true:false;
            mantissa = abs(mantissa);
            int bits[4]; 
            bits[0] = exponent+127;
            bits[1] = (neg)?int(floor((mantissa-1.)*pow(2.,7.)))+128:int(floor((mantissa-1.)*pow(2.,7.)));
            mantissa = (mantissa-1.)*pow(2.,7.) - floor((mantissa-1.)*pow(2.,7.));
            bits[2] = int(floor((mantissa)*pow(2.,8.)));
            mantissa = (mantissa)*pow(2.,8.) - floor((mantissa)*pow(2.,8.));
            bits[3] = int(floor((mantissa)*pow(2.,8.)));
            return vec4(bits[0],bits[1],bits[2],bits[3]);
        }
         
        void main() {
            ivec2 texelCoord = ivec2(gl_FragCoord.xy);
            vec2 a = u_acceleration[texelCoord.x];
            vec2 v = u_velocity[texelCoord.x];
            vec2 r = u_position[texelCoord.x];
            float pixel;
            if(texelCoord.y==0){
                pixel = r.x + v.x * u_deltaT/25.;
            }
            else if(texelCoord.y==1){
                pixel = r.y + v.y * u_deltaT/25.;
            }
            else if(texelCoord.y==2){
                pixel = v.x + a.x * u_deltaT/25.;
            }
            else if(texelCoord.y==3){
                pixel = v.y + a.y * u_deltaT/25.;
            }

            outColor = EncodeFloatRGBA(pixel)/vec4(255.);
            // outColor = EncodeFloatRGBA(3.1415926)/vec4(255.);
        }
        `;
        return fs;
    };
    try {
        canvas.offsetWidth = points.length;
        canvas.offsetHeight = 4;
        canvas.width = points.length;
        canvas.height = 4;
    } catch {
        canvas.width = points.length;
        canvas.height = 4;
    }
    // console.log(canvas.width, canvas.height, canvas);

    const tex = { r: [], v: [], a: [] };
    for (let point in points) {
        tex.r.push(points[point].r);
        tex.v.push(points[point].v);
        tex.a.push(points[point].a);
        // for (let i = 0; i < 4; i++) {
        //     r[i] /= 100;
        //     v[i] /= 100;
        //     a[i] /= 100;
        // }
        // console.log(r, v, a);
        // tex.r.push(...r);
        // tex.v.push(...v);
        // tex.a.push(...a);
    }

    // console.log(tex);
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    // const setup.programInfo = createProgramFromSources(gl, [
    //     getVertexShader(),
    //     getFragmentShader(points.length),
    // ]);
    // const locations = {
    //     position: gl.getAttribLocation(setup.programInfo, 'a_position'),
    //     deltaT: gl.getUniformLocation(setup.programInfo, 'u_deltaT'),
    //     position: gl.getUniformLocation(setup.programInfo, 'u_position'),
    //     velocity: gl.getUniformLocation(setup.programInfo, 'u_velocity'),
    //     acceleration: gl.getUniformLocation(setup.programInfo, 'u_acceleration'),
    // };

    // var positionBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // // clipspace is formed using two (anticlockwise) triangles

    // var positions = [-1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, 1];
    // // loading positions array to graphics buffer
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // // creating vertex array object that will attach the positionBuffer to the attributes
    // var vao = gl.createVertexArray();
    // // binding current vertex array to vao
    // gl.bindVertexArray(vao);
    // // connecting vao to a_position attribute
    // gl.enableVertexAttribArray(locations.position);
    // // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    // var size = 2; // 2 components per iteration (x, y)
    // var type = gl.FLOAT; // the data is 32bit floats
    // var normalize = false; // don't normalize the data
    // var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position (consecutive elemets)
    // var offset = 0; // start at the beginning of the buffer
    // // attach vao to the current ARRAY_BUFFER (positionBuffer) and pass instructions on how to interpret the data
    // gl.vertexAttribPointer(
    //     locations.position,
    //     size,
    //     type,
    //     normalize,
    //     stride,
    //     offset
    // );
    // resizeCanvasToDisplaySize(gl.canvas);
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // gl.useProgram(setup.programInfo);

    // gl.uniform1f(locations.deltaT, deltaT);
    // gl.uniform2fv(locations.position, tex.r.flat());
    // gl.uniform2fv(locations.velocity, tex.v.flat());
    // gl.uniform2fv(locations.acceleration, tex.a.flat());

    // gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);

    const programInfo = createProgramInfo(gl, [
        getVertexShader(),
        getFragmentShader(points.length),
    ]);

    const arrays = {
        a_position: {
            numComponents: 2,
            // prettier-ignore
            data: [
                -1, 1,
                1, -1,
                1, 1,
                -1, -1,
                1, -1,
                -1, 1
            ]
        },
    };

    const bufferInfo = createBufferInfoFromArrays(gl, arrays);

    // resizing canvas to fit the fill clipspace - not sure why since we already did canvas.width = offsetWidth and all...
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(programInfo.program);
    setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // // const t_r = createTexture(gl, { src: tex.r });
    // const textures = createTextures(gl, {
    //     position: {
    //         format: gl.RGBA32F,
    //         width: 1,
    //         src: tex.r,
    //     },
    //     velocity: {
    //         format: gl.RGBA32F,
    //         width: 1,
    //         src: tex.v,
    //     },
    //     acceleration: {
    //         format: gl.RGBA32F,
    //         width: 1,
    //         src: tex.a,
    //     },
    // });

    const uniforms = {
        u_deltaT: deltaT,
        u_position: tex.r.flat(),
        u_velocity: tex.v.flat(),
        u_acceleration: tex.a.flat(),
    };

    // console.log(uniforms);

    setUniforms(programInfo, uniforms);

    // const locations = {
    //     deltaT: gl.getUniformLocation(programInfo.setup.programInfo, 'u_deltaT'),
    //     position: gl.getUniformLocation(programInfo.setup.programInfo, 'u_position'),
    //     velocity: gl.getUniformLocation(programInfo.setup.programInfo, 'u_velocity'),
    //     acceleration: gl.getUniformLocation(
    //         programInfo.setup.programInfo,
    //         'u_acceleration'
    //     ),
    // };
    // gl.uniform1f(locations.deltaT, uniforms.u_deltaT);
    // gl.uniform2fv(locations.position, uniforms.u_position);
    // gl.uniform2fv(locations.velocity, uniforms.u_velocity);
    // gl.uniform2fv(locations.acceleration, uniforms.u_acceleration);

    drawBufferInfo(gl, bufferInfo, gl.TRIANGLES);
    // console.log(arrays);
    // gl.drawArrays(gl.TRIANGLES, 0, arrays.position.data.length / 2);

    // get the result
    const results = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
    gl.readPixels(
        0,
        0,
        gl.canvas.width,
        gl.canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        results
    );

    // console.log(results);
    // print the results
    // console.log('r', points[0].r);
    // console.log('v', points[i].v);
    // console.log('a', points[i].a);

    // console.log(deltaT);
    var newRV = [];
    for (let i = 0; i < gl.canvas.width; ++i) {
        // console.log(
        //     [
        //         results[i * 4 + gl.canvas.width * 4 * 0],
        //         results[i * 4 + gl.canvas.width * 4 * 1],
        //     ],
        //     [
        //         results[i * 4 + gl.canvas.width * 4 * 2],
        //         results[i * 4 + gl.canvas.width * 4 * 3],
        //     ]
        // );
        // console.log([
        //     [i * 4 + gl.canvas.width * 4 * 0, i * 4 + gl.canvas.width * 4 * 1],
        //     [i * 4 + gl.canvas.width * 4 * 2, i * 4 + gl.canvas.width * 4 * 3],
        // ]);
        // console.log(
        //     new Float32Array(
        //         new Uint8Array([
        //             results[i * 4],
        //             results[i * 4 + 1],
        //             results[i * 4 + 2],
        //             results[i * 4 + 3],
        //         ]).buffer
        //     )[0]
        // );
        // let v = -6.14159;
        // // console.log(new Float32Array([v]).buffer);
        // // console.log(v.toString(2));
        // // console.log(encodeFloat(v));
        // // console.log()
        // function formatText(v) {
        //     if (v.length === 8) return v;
        //     else return formatText('0' + v);
        // }
        // let rep = new Uint8Array(new Float32Array([v]).buffer, 0, 4);
        // // console.log(rep[0], rep[1], rep[2], rep[3]);
        // console.log(
        //     formatText(rep[0].toString(2)) +
        //         formatText(rep[1].toString(2)) +
        //         formatText(rep[2].toString(2)) +
        //         formatText(rep[3].toString(2))
        // );
        newRV.push([
            [
                decodeRGBAToFloat([
                    results[i * 4 + gl.canvas.width * 4 * 0],
                    results[i * 4 + gl.canvas.width * 4 * 0 + 1],
                    results[i * 4 + gl.canvas.width * 4 * 0 + 2],
                    results[i * 4 + gl.canvas.width * 4 * 0 + 3],
                ]),
                decodeRGBAToFloat([
                    results[i * 4 + gl.canvas.width * 4 * 1],
                    results[i * 4 + gl.canvas.width * 4 * 1 + 1],
                    results[i * 4 + gl.canvas.width * 4 * 1 + 2],
                    results[i * 4 + gl.canvas.width * 4 * 1 + 3],
                ]),
            ],
            [
                decodeRGBAToFloat([
                    results[i * 4 + gl.canvas.width * 4 * 2],
                    results[i * 4 + gl.canvas.width * 4 * 2 + 1],
                    results[i * 4 + gl.canvas.width * 4 * 2 + 2],
                    results[i * 4 + gl.canvas.width * 4 * 2 + 3],
                ]),
                decodeRGBAToFloat([
                    results[i * 4 + gl.canvas.width * 4 * 3],
                    results[i * 4 + gl.canvas.width * 4 * 3 + 1],
                    results[i * 4 + gl.canvas.width * 4 * 3 + 2],
                    results[i * 4 + gl.canvas.width * 4 * 3 + 3],
                ]),
            ],
        ]);
    }
    for (let i in newRV) {
        points[i].r = [newRV[i][0][0], newRV[i][0][1]];
        points[i].v = [newRV[i][1][0], newRV[i][1][1]];
    }
    // console.log(points);
    return points;
};

export default renderPatterns;
export { computePhysics, renderPatterns };
