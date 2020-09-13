function Anim(settings) {
  this.settings = extend({
    object: null,
    property: null,
    from: 0,
    to: 1,
    duration: 1,
    timeFunction: Anim.easingFunctions.linear,
    onStep: null,
    onEnd: null
  }, settings || {});
  this.startTime = -1;
  this.endTime = -1;
  this.cancelled = false;
}
Anim.easingFunctions = {
  linear: function (t) { return t; },
  easeInCubic: function (t) { return t*t*t; },
  easeOutCubic: function (t) { return (--t)*t*t+1; },
  easeInOutCubic: function (t) { return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; }
};
Anim.prototype = {
  start: function (startTime) {
    this.startTime = startTime;
    this.endTime = startTime + this.settings.duration;
  },
  step: function (time) {
    if (!((this.settings.object && this.settings.property) || this.settings.onStep)) { return; }

    var timeRatio = (time - this.startTime) / this.settings.duration;
    if (timeRatio > 1) {
      timeRatio = 1;
    }
    var ratio = this.settings.timeFunction(timeRatio);
    var adjusted = this.settings.from + (this.settings.to - this.settings.from) * ratio;
    if (this.settings.object && this.settings.property) {
      this.settings.object[this.settings.property] = adjusted;
    }
    if (this.settings.onStep) {
      this.settings.onStep(adjusted);
    }
  },
  cancel: function () {
    this.cancelled = true;
  }
};
