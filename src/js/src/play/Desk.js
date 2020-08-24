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
  this.world = null;
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
  mailDelivered: function (player) {
    this.needsMail = false;
    // debug
    this.displayItems.forEach(function (rect) {
      rect.color = 'red';
      if (this.world === null) {
        this.world = rect.parent;
      }
    }, this);
    var envelope = new DisplayRect({
      x: player.x,
      y: player.y,
      w: 20,
      h: 10,
      color: '#eeeeee',
      anchorX: 10,
      anchorY: 5,
      angle: Random.range(0, Math.PI * 2)
    });
    this.world.addChild(envelope);
    var animX = new Anim({
      object: envelope,
      property: 'x',
      from: player.x,
      to: this.mailAabb.x,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic
    });
    var animY = new Anim({
      object: envelope,
      property: 'y',
      from: player.y,
      to: this.mailAabb.y,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic,
      onEnd: function () {
        this.world.removeChild(envelope);
      }.bind(this)
    });
    var animAngle = new Anim({
      object: envelope,
      property: 'angle',
      from: envelope.angle,
      to: envelope.angle + Random.range(-Math.PI, Math.PI),
      duration: 0.5
    });
    AnimManager.singleton.add(animX);
    AnimManager.singleton.add(animY);
    AnimManager.singleton.add(animAngle);
  }
};