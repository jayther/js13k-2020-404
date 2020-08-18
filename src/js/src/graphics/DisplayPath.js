function DisplayPath(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    path: [],
    color: 'black'
  }, options || {});
  this.path = opts.path;
  this.color = opts.color;
}
DisplayPath.prototype = extendPrototype(DisplayItem.prototype, {
  render: function (context) {
    context.beginPath();
    var i, point;
    for (i = 0; i < this.path.length; i += 1) {
      point = this.path[i];
      if (i === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }
    context.closePath();
    context.fillStyle = this.color;
    context.fill();
  }
});
