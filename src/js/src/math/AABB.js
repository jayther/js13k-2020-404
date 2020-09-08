function AABB(x, y, hw, hh) {
  this.x = x || 0;
  this.y = y || 0;
  this.hw = hw || 0;
  this.hh = hh || 0;
}
AABB.fromRect = function (rect) {
  return new AABB(
    (rect.left + rect.right) / 2,
    (rect.top + rect.bottom) / 2,
    (rect.right - rect.left) / 2,
    (rect.bottom - rect.top) / 2
  );
};

AABB.prototype = {};
AABB.prototype.set = function (x, y) {
  this.x = x || 0;
  this.y = y || 0;
};
AABB.prototype.getLeft = function () {
  return this.x - this.hw;
};
AABB.prototype.getTop = function () {
  return this.y - this.hh;
};
AABB.prototype.getRight = function () {
  return this.x + this.hw;
};
AABB.prototype.getBottom = function () {
  return this.y + this.hh;
};
AABB.prototype.getWidth = function () {
  return this.hw * 2;
};
AABB.prototype.getHeight = function () {
  return this.hh * 2;
};
AABB.prototype.intersectsWith = function (aabb) {
  return (
    (Math.abs(this.x - aabb.x) < this.hw + aabb.hw) &&
    (Math.abs(this.y - aabb.y) < this.hh + aabb.hh)
  );
};
AABB.prototype.containsPoint = function (x, y) {
  return Math.abs(this.x - x) < this.hw && Math.abs(this.y - y) < this.hh;
};
AABB.prototype.copy = function () {
  return new AABB(this.x, this.y, this.hw, this.hh);
};
AABB.prototype.grow = function (amt) {
  this.hw += amt;
  this.hh += amt;
  return this;
};
AABB.prototype.rotateAroundPoint = function (point, angle) {
  var t, rad = angle / 360 * Math.PI * 2;
  if (angle === 90 || angle === 270) {
    t = this.hw;
    this.hw = this.hh;
    this.hh = t;
  }

  var n = JMath.rotateVec({ x: this.x - point.x, y: this.y - point.y }, rad);
  this.x = point.x + n.x;
  this.y = point.y + n.y;
  return this;
};
AABB.prototype.toBounds = function () {
  return {
    left: this.x - this.hw,
    top: this.y - this.hh,
    right: this.x + this.hw,
    bottom: this.y + this.hh
  };
};
AABB.prototype.toRect = function () {
  return {
    x: this.x - this.hw,
    y: this.y - this.hh,
    w: this.hw * 2,
    h: this.hh * 2
  };
};
