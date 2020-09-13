function Desk(type, x, y, w, h, chairSize, room) {
  this.id = Desk.poolId++;
  this.type = type;
  this.room = room;
  // facing right, halfway in
  var chairX = x - w / 2,
    chairY = y;
  this.mailAabb = new AABB(
    (x + chairX) / 2,
    (y + chairY) / 2,
    (w + chairSize / 2) / 2 + Desk.mailAabbPadding,
    (h + chairSize / 2) / 2 + Desk.mailAabbPadding
  );
  this.highlight = new DisplayRect({
    x: this.mailAabb.x,
    y: this.mailAabb.y,
    w: this.mailAabb.hw * 2,
    h: this.mailAabb.hh * 2,
    visible: false,
    color: '#00cc00',
    alpha: 0.5,
    anchorX: this.mailAabb.hw,
    anchorY: this.mailAabb.hh
  });
  this.displayItems = [
    this.highlight,
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
  this.redirectFrom = -1;
  this.world = null;
  this.scene = null;
  this.deliveredCallback = null;
  this.redirectDeskCallback = null;
  this.prematureDeliveredCallback = null;
  this.animEnabled = false;
  this.anim = null;
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
  setHighlight: function (h) {
    this.highlight.visible = h;
    if (h) {
      this.startHighlightAnim();
    } else {
      this.stopHighlightAnim();
    }
  },
  startHighlightAnim: function () {
    if (this.anim) {
      this.anim.cancel();
    }
    this.animEnabled = true;
    var anim1, anim2;
    anim1 = new Anim({
      from: 1,
      to: 0.8,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic,
      onStep: function (adjusted) {
        this.highlight.setScale(adjusted);
      }.bind(this),
      onEnd: function () {
        if (this.animEnabled) {
          AnimManager.singleton.add(anim2);
          this.anim = anim2;
        }
      }.bind(this)
    });
    anim2 = new Anim({
      from: 0.8,
      to: 1,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeOutCubic,
      onStep: function (adjusted) {
        this.highlight.setScale(adjusted);
      }.bind(this),
      onEnd: function () {
        if (this.animEnabled) {
          AnimManager.singleton.add(anim1);
          this.anim = anim1;
        }
      }.bind(this)
    });
    AnimManager.singleton.add(anim1);
  },
  stopHighlightAnim: function () {
    this.animEnabled = false;
    if (this.anim) {
      this.anim.cancel();
      this.anim = null;
    }
  },
  mailDelivered: function (player) {
    this.needsMail = false;
    
    this.displayItems.forEach(function (rect) {
      if (this.world === null) {
        this.world = rect.parent;
      }
    }, this);
    this.setHighlight(false);
    if (this.redirectTo === -1) {
      var envelope = new Mail({
        x: player.x,
        y: player.y,
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
      if (this.redirectFrom !== -1 && this.prematureDeliveredCallback) {
        this.prematureDeliveredCallback(this);
      }
    } else if (this.redirectDeskCallback) {
      this.redirectDeskCallback(this);
    }
    if (this.deliveredCallback) {
      this.deliveredCallback(this);
    }
  }
};