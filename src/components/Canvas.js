import userEvent from '@testing-library/user-event';
import React, { useState, useRef, useEffect } from 'react';
import renderPatterns from '../js/generatePatterns';

const Canvas = ({ id, mouseProp }) => {
    const [mouse, setMouse] = useState(mouseProp);
    const [canvas] = useState(useRef(null));
    useEffect(() => {
        // if (mouseProp)
        //     setMouse([
        //         mouseProp[0] - canvas.current.getBoundingClientRect().x,
        //         mouseProp[1] - canvas.current.getBoundingClientRect().y,
        //     ]);
        setMouse(mouseProp);
        // console.log();
        window.requestAnimationFrame(() =>
            renderPatterns(canvas.current, mouse)
        );
    });
    useEffect(() => {
        window.requestAnimationFrame(() =>
            renderPatterns(canvas.current, mouse)
        );
    }, []);
    return <canvas id={id} ref={canvas}></canvas>;
};

export default Canvas;
