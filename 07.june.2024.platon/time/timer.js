class _timer {
  // Timer obtain current time in seconds method
  getTime() {
    const date = new Date();
    let t =
      date.getMilliseconds() / 1000.0 +
      date.getSeconds() +
      date.getMinutes() * 60;
    return t;
  };

  // Timer response method
  response() {
    let t = this.getTime();
    // Global time
    this.globalTime = t;
    this.globalDeltaTime = t - this.oldTime;
    // Time with pause
    if (this.isPause) {
      this.localDeltaTime = 0;
      this.pauseTime += t - this.oldTime;
    } else {
      this.localDeltaTime = this.globalDeltaTime;
      this.localTime = t - this.pauseTime - this.startTime;
    }
    // FPS
    this.frameCounter++;
    if (t - this.oldTimeFPS > 3) {
      this.FPS = this.frameCounter / (t - this.oldTimeFPS);
      this.oldTimeFPS = t;
      this.frameCounter = 0;
      //if (tag_id != null)
      //  document.getElementById(tag_id).innerHTML = this.getFPS();
    }
    this.oldTime = t;
  };
 
  constructor() {
    // Fill timer global data
    this.globalTime = this.localTime = this.getTime();
    this.globalDeltaTime = this.localDeltaTime = 0;
  
    // Fill timer semi global data
    this.startTime = this.oldTime = this.oldTimeFPS = this.globalTime;
    this.frameCounter = 0;
    this.isPause = false;
    this.FPS = 30.0;
    this.pauseTime = 0;
  }
  // Obtain FPS as string method
  getFPS = () => this.FPS.toFixed(3);
}

export function timer() {
  return new _timer();
}