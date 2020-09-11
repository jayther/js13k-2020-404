function DisplayItem(options) {
  var opts = extend({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    visible: true,
    alpha: 1,
    anchorX: 0,
    anchorY: 0,
    offsetX: 0,
    offsetY: 0
  }, options || {});
  this.parent = null;
  this.x = opts.x;
  this.y = opts.y;
  this.scaleX = opts.scaleX;
  this.scaleY = opts.scaleY;
  this.angle = opts.angle;
  this.visible = opts.visible;
  this.alpha = opts.alpha;
  this.anchorX = opts.anchorX;
  this.anchorY = opts.anchorY;
  this.offsetX = opts.offsetX;
  this.offsetY = opts.offsetY;
}
DisplayItem.prototype = {
  _render: function (context) {
    if (this.visible && this.alpha >= 0.01) {
      context.save();
      if (this.x || this.y) {
        context.translate(this.x, this.y);
      }
      if (this.scaleX !== 1 || this.scaleY !== 1) {
        context.scale(this.scaleX, this.scaleY);
      }
      if (this.angle) {
        context.rotate(this.angle);
      }
      if (this.anchorX || this.anchorY) {
        context.translate(-this.anchorX, -this.anchorY);
      }
      if (this.alpha < 1) {
        context.globalAlpha *= this.alpha;
      }
      this.render(context);
      if (this.offsetX || this.offsetY) {
        context.translate(this.offsetX, this.offsetY);
      }
      context.restore();
    }
  },
  render: function (context) {}
}
