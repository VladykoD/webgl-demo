(() => {
    //detect webgl
    let canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        console.log('Failed to get WebGL context. Your browser or device may not support WebGL.')
        return;
    }
    console.log('Your browser supports WebGL.')


    //fill in green color
    gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT)


    //change background after click
    let button = document.querySelector('#switch-bg')
    button.addEventListener('click', switchColor, false)

    function switchColor() {
        let color = getRandomColor();
        gl.clearColor(color[0], color[1], color[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function getRandomColor() {
        return [Math.random(), Math.random(), Math.random()]
    }


    //change background animation
    let buttonAnim = document.querySelector('#animate-bg');
    let state = buttonAnim.querySelector('b');
    let timer;

    function startAnimation(e) {
        buttonAnim.removeEventListener(e.type, startAnimation, false);
        buttonAnim.addEventListener('click', stopAnimation, false);
        state.textContent = 'off';

        timer = setInterval(switchColor, 1000);
        switchColor();
    }

    function stopAnimation(e) {
        buttonAnim.removeEventListener(e.type, stopAnimation, false);
        buttonAnim.addEventListener('click', startAnimation, false);
        state.textContent = 'on';
        clearInterval(timer);
    }
    stopAnimation({type: 'click'});

    //work with filters
    let mask = [true, true, true];
    let redToggle = document.querySelector('#filterRed');
    let greenToggle = document.querySelector('#filterGreen');
    let blueToggle = document.querySelector('#filterBlue');

    redToggle.addEventListener('click', setColorMask, false)
    greenToggle.addEventListener('click', setColorMask, false)
    blueToggle.addEventListener('click', setColorMask, false)

    function setColorMask(evt) {
        let index = evt.target === greenToggle && 1
            || evt.target === blueToggle && 2
            || 0;

        mask[index] = !mask[index];
        if (mask[index] === true)
            evt.target.textContent = 'on';
        else
            evt.target.textContent = 'off';
        gl.colorMask(mask[0], mask[1], mask[2], true);
        drawAnimation();
    }
    function drawAnimation() {
        let color = getRandomColor();
        gl.clearColor(color[0], color[1], color[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT)
    }

    // clipping
    /*
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(50, 50, width - 100, height - 100);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT)
*/

})();
