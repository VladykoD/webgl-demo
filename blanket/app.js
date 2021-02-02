(() => {
   const cnv = document.querySelector(`canvas`);
   const ctx = cnv.getContext(`2d`);

   let centerX;
   let centerY;

   function init() {
      cnv.width = innerWidth * 2;
      cnv.height = innerHeight * 2;
      centerX = cnv.width/2;
      centerY = cnv.height/2;
   }
   init();

   function loop() {
      cnv.width |= 0; // ctx.clearRect(0,0,cnv.width, cnv.height)
      requestAnimationFrame(loop);
   }
   loop();

   window.addEventListener(`resize`, init);

})();
