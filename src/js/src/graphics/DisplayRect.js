function DisplayRect(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    w: 0,
    h: 0,
    color: 'black',
    rounded: 0
  }, options || {});
  this.rounded = opts.rounded;
  this.w = opts.w;
  this.h = opts.h;
  this.color = opts.color;
}
DisplayRect.prototype = extendPrototype(DisplayItem.prototype, {
  render: function (context) {
    context.fillStyle = this.color;
    if (this.rounded) {
      var rounded = this.rounded, w = this.w, h = this.h;
      context.beginPath();
      context.moveTo(rounded, 0);
      context.lineTo(w - rounded, 0);
      context.arcTo(w, 0, w, rounded, rounded);
      context.lineTo(w, h - rounded);
      context.arcTo(w, h, w - rounded, h, rounded);
      context.lineTo(rounded, h);
      context.arcTo(0, h, 0, h - rounded, rounded);
      context.lineTo(0, rounded);
      context.arcTo(0, 0, rounded, 0, rounded);
      context.closePath();
      context.fill();
    } else {
      context.fillRect(0, 0, this.w, this.h);
    }
  }
});
