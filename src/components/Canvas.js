import userEvent from '@testing-library/user-event';
import React, { useState, useRef, useEffect } from 'react';
// import { createsetupInfoFromprogramInfo } from 'twgl.js';
import { renderPatterns, computePhysics } from '../js/generatePatterns';

function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

function vectorMath(method, v1, v2) {
    if (method === 'scalar multiply') {
        return [v1[0] * v2, v1[1] * v2];
    } else if (method === 'norm') {
        return (
            v1.reduce((norm, i) => {
                return norm + i ** 2;
            }, 0) ** 0.5
        );
    } else if (method === 'dot') {
        return v1[0] * v2[0] + v1[1] * v2[1];
    } else if (method === 'perpendicular') {
        let n = vectorMath('norm', v1);
        return [v1[1] / n, -v1[0] / n];
    } else if (method === 'add') {
        return [v1[0] + v2[0], v1[1] + v2[1]];
    } else if (method === 'subtract') {
        return [v1[0] - v2[0], v1[1] - v2[1]];
    } else if (method === 'max') {
        return [Math.max(v1[0], v2[0]), Math.max(v1[1], v2[1])];
    } else if (method === 'min') {
        return [Math.min(v1[0], v2[0]), Math.min(v1[1], v2[1])];
    }
}

const Canvas = ({ id, mouseProp }) => {
    const [mouse, setMouse] = useState(mouseProp);
    const [canvas] = useState(useRef(null));
    const [physics] = useState(useRef(null));
    const setup = useRef(null);
    let numberOfPoints = 3;
    function createPoints(numberOfPoints) {
        let R = [];
        let v = [];
        let points = [];
        for (let i = 0; i < numberOfPoints; i++) {
            // console.log(i);
            R.push(Math.random() * 50 + 50);
            v.push([(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10]);
            points.push({
                r: [
                    Math.random() * (window.innerWidth - 40 - 100) + 100,
                    Math.random() * (window.innerHeight - 40 - 100) + 100,
                ],
                R: R[i],
                thickness: Math.random() * 10 + 10,
                v: v[i],
                a: vectorMath(
                    'scalar multiply',
                    vectorMath('perpendicular', v[i]),
                    vectorMath('norm', v[i]) ** 2 / R[i]
                ),
            });
            // console.log(R, v, points);
        }
        return points;
    }

    function render(canvas_ref, points, mouse) {
        window.requestAnimationFrame(() => {
            if (setup.current == null)
                setup.current = renderPatterns(
                    setup.current,
                    canvas_ref.current,
                    points,
                    mouse
                );
            else
                renderPatterns(
                    setup.current,
                    canvas_ref.current,
                    points,
                    mouse
                );
        });
    }
    const p = createPoints(numberOfPoints);
    const [points, setPoints] = useState(p);

    // useEffect(() => {
    //     // if (mouseProp) {
    //     //     setMouse([
    //     //         mouseProp[0] - canvas.current.getBoundingClientRect().x,
    //     //         mouseProp[1] - canvas.current.getBoundingClientRect().y,
    //     //     ]);
    //     //     setMouse([mouseProp[0] - 20, mouseProp[1] - 20]);
    //     // }
    //     // setMouse(mouseProp);
    //     // console.log();
    //     window.requestAnimationFrame(() =>
    //         renderPatterns(canvas.current, getXY(points), mouse)
    //     );
    // }, [points]);

    useEffect(() => {
        render(canvas, points, mouse);
        setRV(setAcc(points, delay));
        // console.log('r', points[0].r);
        // console.log('v', points[0].v);
        // console.log('a', points[0].a);
        console.log('dot', vectorMath('dot', points[0].a, points[0].v));
    }, []);

    function setRV(newPoints) {
        for (let i in newPoints) {
            // console.log(canvas.current.width, canvas.current.height  );
            newPoints[i].r[0] =
                ((newPoints[i].r[0] % canvas.current.width) +
                    canvas.current.width) %
                canvas.current.width;
            newPoints[i].r[1] =
                ((newPoints[i].r[1] % canvas.current.height) +
                    canvas.current.height) %
                canvas.current.height;
        }
        setPoints(newPoints);
    }

    const setAcc = (points, delay) => {
        const newPoints = [...points];
        for (let point in newPoints) {
            newPoints[point].v = vectorMath(
                'max',
                vectorMath('min', newPoints[point].v, [10, 10]),
                [-10, -10]
            );
            newPoints[point].a = vectorMath(
                'add',
                vectorMath(
                    'scalar multiply',
                    vectorMath('perpendicular', newPoints[point].v),
                    (vectorMath('norm', newPoints[point].v) ** 2 /
                        newPoints[point].R) *
                        (-1) ** Math.round(Math.random() * 0.75)
                ),
                [(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3]
            );
            // console.log(
            //     'dot',
            //     vectorMath('dot', newPoints[point].a, newPoints[point].v)
            // );

            //     newPoints[point].a[0] * (1 + Math.random() - 0.5) * 0.2,
            //     newPoints[point].a[1] * (1 + Math.random() - 0.5) * 0.3,
            // ];
        }
        return computePhysics(physics.current, newPoints, delay);
    };
    let fps = 60;
    let delay = Math.floor(1000 / fps);
    // console.log(delay);
    useInterval(function () {
        setRV(setAcc(points, delay));
        // console.log(
        //     ...points[0].r.map((x) => x.toFixed(2)),
        //     ' | ',
        //     ...points[0].v.map((x) => x.toFixed(2)),
        //     ' | ',
        //     ...points[0].a.map((x) => x.toFixed(2)),
        //     ' | ',
        //     (
        //         vectorMath('norm', points[0].v) ** 2 /
        //         vectorMath('norm', points[0].a)
        //     ).toFixed(1)
        // );
        // console.log('dot', vectorMath('dot', points[0].a, points[0].v));
        render(canvas, points, 10);
    }, delay);

    return (
        <>
            <canvas ref={physics}></canvas>
            <canvas id={id} ref={canvas}></canvas>
        </>
    );
    // return <div></div>;
};

export default Canvas;
