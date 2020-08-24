function Desk(type, x, y, w, h, chairSize) {
  this.id = Desk.poolId++;
  this.type = type;
  this.mailAabb = new AABB(x, y, w / 2 + Desk.mailAabbPadding, h / 2 + Desk.mailAabbPadding);
  this.displayItems = [
    new DisplayRect({
      x: x - w / 2,
      y: y - h / 2,
      w: w,
      h: h,
      color: '#990000'
    }),
    new DisplayRect({ // chair
      x: x - w / 2 - chairSize / 2,
      y: y - chairSize / 2,
      w: chairSize,
      h: chairSize,
      color: '#990000'
    })
  ]; // TODO
  this.needsMail = false;
  this.redirectTo = -1;
}
Desk.poolId = 0;
Desk.mailAabbPadding = 5;

Desk.prototype = {
  rotateAround: function (point, angle) {
    var rad = angle / 360 * Math.PI * 2;
    this.displayItems.forEach(function (item) {
      var pos = JMath.rotateVec({ x: item.x - point.x, y: item.y - point.y }, rad);
      item.x = point.x + pos.x;
      item.y = point.y + pos.y;
      item.angle = rad;
    });
    this.mailAabb.rotateAroundPoint(point, angle);
  },
  mailDelivered: function () {
    this.needsMail = false;
    // debug
    this.displayItems.forEach(function (rect) {
      rect.color = 'red';
    });
  }
};