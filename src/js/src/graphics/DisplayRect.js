function DisplayRect(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    w: 0,
    h: 0,
    color: 'black'
  }, options || {});
  this.w = opts.w;
  this.h = opts.h;
  this.color = opts.color;
}
DisplayRect.prototype = extendPrototype(DisplayItem.prototype, {
  render: function (context) {
    context.fillStyle = this.color;
    context.fillRect(0, 0, this.w, this.h);
  }
});
