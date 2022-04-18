import './App.css';
import Canvas from './components/Canvas';
import React, { useState, useRef, useEffect } from 'react';

function App() {
    const [mouse, setMouse] = useState(null);
    const mouseMove = (e) => {
        const position = getPointerLocation(e);
        // console.log([position.x, position.y]);
        setMouse([position.x - 20, position.y - 20]);
    };
    const getPointerLocation = (e) => {
        let position = { x: undefined, y: undefined };
        if (e.type.substr(0, 5) === 'touch') {
            position = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        } else {
            position = { x: e.clientX, y: e.clientY };
        }
        return position;
    };
    return (
        <div className="App" onPointerMove={mouseMove}>
            <div id="outerContainer">
                <Canvas id={'patternPalette'} mouseProp={mouse} />
            </div>
        </div>
    );
}

export default App;
