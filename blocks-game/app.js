(() => {
    let gl, timer, rainingRect, scoreDisplay, missesDisplay;

    //detect webgl
    let canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        console.log('Failed to get WebGL context. Your browser or device may not support WebGL.')
        return;
    }
    console.log('Your browser supports WebGL.')

    gl.enable(gl.SCISSOR_TEST);

    rainingRect = new Rectangle();
    timer = setTimeout(drawAnimation, 17);
    canvas.addEventListener('click', playerClick, false);
    scoreDisplay = document.getElementById('caught');
    missesDisplay = document.getElementById('missed')


    let score = 0;
    let misses = 0;
    function drawAnimation() {
        gl.scissor(rainingRect.position[0], rainingRect.position[1],
            rainingRect.size[0], rainingRect.size[1])

        gl.clear(gl.COLOR_BUFFER_BIT);
        rainingRect.position[1] -= rainingRect.velocity;

        if (rainingRect.position[1] < 0) {
            missesDisplay.textContent = misses++;
            rainingRect = new Rectangle();
        }

        timer = setTimeout(drawAnimation, 17)
    }

    function playerClick(e) {
        let position = [e.pageX - e.target.offsetLeft,
            gl.drawingBufferHeight - (e.pageY - e.target.offsetTop)];
        let diffPos = [position[0] - rainingRect.position[0],
            position[1] - rainingRect.position[1]];

        if (diffPos[0] >= 0 && diffPos[0] < rainingRect.size[0]
            && diffPos[1] >= 0 && diffPos[1] < rainingRect.size[1]) {
            scoreDisplay.textContent = score++;
            rainingRect = new Rectangle();
        }
    }

    function Rectangle() {
        let rect = this;
        let randNums = getRandomVector();
        rect.size = [
            30 + 200 * randNums[0],
            30 + 200 * randNums[1]
        ];
        rect.position = [
            randNums[2] * (gl.drawingBufferWidth - rect.size[0]),
            gl.drawingBufferHeight
        ];
        rect.velocity = 1.0 + 6.0 * Math.random();
        rect.color = getRandomVector();
        gl.clearColor(rect.color[0], rect.color[1], rect.color[2], 1.0)
    }

    function getRandomVector() {
        return [Math.random(), Math.random(), Math.random()]
    }

})();
