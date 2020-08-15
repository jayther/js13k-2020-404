function DisplayImg(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    w: 0,
    h: 0,
    img: null
  }, options || {});
  this.w = opts.w;
  this.h = opts.h;
  this.img = opts.img;

  if (this.w && !opts.scaleX) {
    this.scaleX = this.w / this.img.width;
  }
  if (this.h && !opts.scaleY) {
    this.scaleY = this.h / this.img.height;
  }
}
DisplayImg.prototype = extendPrototype(DisplayItem.prototype, {
  render: function (context) {
    context.drawImage(this.img, 0, 0);
  }
});
  