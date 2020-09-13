var Resources = {
  imgs: {
    robot: "robot_3Dblue.png"
  },
  patterns: {
    hallwayTile: "repeat",
    roomTile: "repeat",
    wallTile: "repeat"
  },
  loadedImgs: {},
  loadedPatterns: {}
};


// Object.assign as extend function
function extend(target, varArgs) {
  'use strict';
  if (target == null) { // TypeError if undefined or null
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var to = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) { // Skip over if undefined or null
      for (var nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

function extendPrototype() {
  return extend.apply(this, [{}].concat(Array.prototype.slice.call(arguments)));
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var DOM = (function () {
  var map = {};
  return {
    get: function (id) {
      if (!map[id]) {
        map[id] = document.getElementById(id);
      }
      return map[id];
    },
    create: function (tagName) {
      return document.createElement(tagName);
    }
  };
}());

function KB(press, release) {
  var keys = {};
  var kb = {};
  kb.downHandler = function (e) {
    var k = e.keyCode;
    if (!has(keys, k)) {
      keys[k] = false;
    }
    if (!keys[k]) {
      press(k);
    }
    keys[k] = true;
    e.preventDefault();
  };
  kb.upHandler = function (e) {
    var k = e.keyCode;
    if (!has(keys, k)) {
      keys[k] = false;
    }
    if (keys[k]) {
      release(k);
    }
    keys[k] = false;
    e.preventDefault();
  };
  kb.destroy = function () {
    window.removeEventListener('keydown', kb.downHandler, false);
    window.removeEventListener('keyup', kb.upHandler, false);
  };
  window.addEventListener('keydown', kb.downHandler, false);
  window.addEventListener('keyup', kb.upHandler, false);
  
  return kb;
}

KB.keys = {
  a: 65,
  w: 87,
  s: 83,
  d: 68,
  z: 90,
  q: 81,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  space: 32,
  enter: 13
};


var Random = null;
Random = {
  range: function (min, max) {
    return min + Math.random() * (max - min);
  },
  rangeInt: function (min, max) {
    return Math.floor(Random.range(min, max));
  },
  pick: function (array) {
    return array[Random.rangeInt(0, array.length)];
  },
  pickAndRemove: function (array) {
    var i = Random.rangeInt(0, array.length);
    var item = array[i];
    array.splice(i, 1);
    return item;
  },
  flagPick: function (flags) {
    var pool = [], i = 0;
    while (flags > 0) {
      if (flags & 1) {
        pool.push(1 << i);
      }
      flags >>= 1;
      i += 1;
    }
    if (pool.length > 0) {
      return Random.pick(pool);
    }
    return 0;
  }
};

var JMath = {
  clamp: function (v, min, max) {
    return v < min ? min : v > max ? max : v;
  },
  intersectRectRect: function (a, b) {
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    );
  },
  angleFromVec: function (v) {
    return Math.atan2(v.y, v.x);
  },
  lengthFromVec: function (v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },
  rotateVec: function (v, a) {
    var rotX = Math.cos(a);
    var rotY = Math.sin(a);
    // matrix mult
    return {
      x: v.x * rotX - v.y * rotY,
      y: v.x * rotY + v.y * rotX
    };
  },
  rotateRectAroundPoint: function (rect, point, angle) {
    if (angle === 0) {
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      };
    }
    var w = rect.right - rect.left,
      h = rect.bottom - rect.top,
      newLeftTop, t, rad = angle / 360 * Math.PI * 2;
    
    if (angle === 90 || angle === 270) {
      t = w;
      w = h;
      h = t;
    }
    
    if (angle === 90) {
      newLeftTop = { x: rect.left, y: rect.bottom };
    } else if (angle === 180) {
      newLeftTop = { x: rect.right, y: rect.bottom };
    } else {
      newLeftTop = { x: rect.right, y: rect.top };
    }
    newLeftTop.x -= point.x;
    newLeftTop.y -= point.y;
    newLeftTop = JMath.rotateVec(newLeftTop, rad);
    return {
      left: point.x + newLeftTop.x,
      top: point.y + newLeftTop.y,
      right: point.x + newLeftTop.x + w,
      bottom: point.y + newLeftTop.y + h
    };
  }
};

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


function AnimManager() {
  this.time = 0;
  this.anims = [];
}
AnimManager.singleton = null;
AnimManager.prototype = {
  add: function (anim) {
    anim.start(this.time);
    this.anims.push(anim);
  },
  step: function (dts) {
    var i, anim, removeAnim;
    for (i = 0; i < this.anims.length; i += 1) {
      removeAnim = false;
      anim = this.anims[i];
      if (!anim.cancelled) {
        anim.step(this.time);
      }
      if (anim.cancelled) {
        removeAnim = true;
      } else if (this.time >= anim.endTime) {
        if (anim.settings.onEnd) {
          anim.settings.onEnd();
        }
        removeAnim = true;
      }
      if (removeAnim) {
        this.anims.splice(i, 1);
        i -= 1;
      }
    }
    this.time += dts;
  }
};

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
    anchorY: 0
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
}
DisplayItem.prototype = {
  setScale: function (scale) {
    this.scaleX = scale;
    this.scaleY = scale;
  },
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
      context.restore();
    }
  },
  render: function (context) {}
}

function DisplayContainer(options) {
  DisplayItem.apply(this, arguments);
  this.children = [];
}
DisplayContainer.prototype = extendPrototype(DisplayItem.prototype, {
  addChild: function (child) {
    this.children.push(child);
    child.parent = this;
    return this;
  },
  removeChild: function (child) {
    var i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.parent = null;
    }
    return this;
  },
  render: function (context) {
    for (var i = 0; i < this.children.length; i += 1) {
      this.children[i]._render(context);
    }
  }
});

function DisplayRect(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    w: 0,
    h: 0,
    color: 'black',
    rounded: 0,
    fillOffsetX: 0,
    fillOffsetY: 0,
    fillScaleX: 1,
    fillScaleY: 1
  }, options || {});
  this.rounded = opts.rounded;
  this.w = opts.w;
  this.h = opts.h;
  this.fillOffsetX = opts.fillOffsetX;
  this.fillOffsetY = opts.fillOffsetY;
  this.fillScaleX = opts.fillScaleX;
  this.fillScaleY = opts.fillScaleY;
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
      if (this.fillOffsetX || this.fillOffsetY) {
        context.translate(this.fillOffsetX, this.fillOffsetY);
      }
      if (this.fillScaleX !== 1 || this.fillScaleY !== 1) {
        context.scale(this.fillScaleX, this.fillScaleY);
      }
      context.fill();
    } else {
      context.beginPath();
      context.rect(0, 0, this.w, this.h);
      context.closePath();
      if (this.fillOffsetX || this.fillOffsetY) {
        context.translate(this.fillOffsetX, this.fillOffsetY);
      }
      if (this.fillScaleX !== 1 || this.fillScaleY !== 1) {
        context.scale(this.fillScaleX, this.fillScaleY);
      }
      context.fill();
    }
  }
});

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
  
function DisplayText(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    text: '',
    align: 'left',
    baseline: 'top',
    font: null,
    color: 'black'
  }, options || {});
  this.color = opts.color;
  this.text = opts.text;
  this.align = opts.align;
  this.baseline = opts.baseline;
  this.font = opts.font;
}
DisplayText.prototype = extendPrototype(DisplayItem.prototype, {
  render: function (context) {
    if (this.font) {
      context.font = this.font;
    }
    context.textAlign = this.align;
    context.textBaseline = this.baseline;
    context.fillStyle = this.color;
    context.fillText(this.text, 0, 0);
  }
});
  
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

function CachedContainer(options) {
  DisplayContainer.apply(this, arguments);
  var opts = extend({
    w: 100,
    h: 100
  }, options || {});
  this.canvas = DOM.create('canvas');
  this.canvas.width = opts.w;
  this.canvas.height = opts.h;
  this.context = this.canvas.getContext('2d');
}
CachedContainer.prototype = extendPrototype(DisplayContainer.prototype, {
  setDimensions: function (w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  },
  addChild: function (child) {
    DisplayContainer.prototype.addChild.apply(this, arguments);
    this.redraw();
  },
  removeChild: function (child) {
    DisplayContainer.prototype.removeChild.apply(this, arguments);
    this.redraw();
  },
  redraw: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i = 0; i < this.children.length; i += 1) {
      this.children[i]._render(this.context);
    }
  },
  render: function (context) {
    context.drawImage(this.canvas, 0, 0);
  }
});


function squiggles(y, amplitude, iterations, width, thickness) {
  var i, points = [], step = width / (iterations - 1);
  for (i = 0; i < iterations; i += 1) {
    points.push({ x: i * step, y: y + amplitude - thickness / 2 });
    amplitude *= -1;
  }
  amplitude *= -1;
  for (i = iterations - 1; i >= 0; i -= 1) {
    points.push({ x: i * step, y: y + amplitude + thickness / 2});
    amplitude *= -1;
  }
  return points;
}

var hallwayTile = (function () {
  var c = new CachedContainer({ w: 70, h: 70 });
  
  c.addChild(new DisplayRect({
    w: 70, h: 70,
    color: '#c99869'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(25, 5, 7, 70, 16),
    color: '#c58f5c'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(55, 5, 7, 70, 16),
    color: '#c58f5c'
  }));

  return c;
}());

var wallTile = (function () {
  var c = new CachedContainer({ w: 70, h: 70 });
  
  c.addChild(new DisplayRect({
    w: 70, h: 70,
    color: '#838796'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(25, 5, 7, 70, 24),
    color: '#7e8291'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(55, 5, 7, 70, 16),
    color: '#7e8291'
  }));

  return c;
}());

var roomTile = (function () {
  var c = new CachedContainer({ w: 70, h: 70 });
  
  c.addChild(new DisplayRect({
    w: 70, h: 70,
    color: '#acc0c1'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(25, 5, 7, 70, 16),
    color: '#bbcbcc'
  }));

  c.addChild(new DisplayPath({
    path: squiggles(55, 5, 7, 70, 16),
    color: '#bbcbcc'
  }));

  return c;
}());

Resources.loadedImgs.hallwayTile = hallwayTile.canvas;
Resources.loadedImgs.wallTile = wallTile.canvas;
Resources.loadedImgs.roomTile = roomTile.canvas;

function Room(id, chunk) {
  this.id = id;
  this.left = chunk.left;
  this.top = chunk.top;
  this.right = chunk.right;
  this.bottom = chunk.bottom;

  this.type = 0;
  this.furniture = [];
  this.collisionAabbs = [];
  this.connected = false;
  this.fog = null;
  this.doorWallFlags = 0;
  this.needsMail = false;
  this.doorToHallway = { x: 0, y: 0};
}

Room.prototype = {
};

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

function World() {
  DisplayContainer.apply(this, arguments);
  this.grid = {};
  this.cellSize = 20;
  this.hallwayMinChunkArea = 1000;
  this.hallwayMinChunkWidth = 20;
  this.hallwayMinChunkHeight = 20;
  this.minChunkArea = 100;
  this.minChunkWidth = 12;
  this.minChunkHeight = 12;
  this.hallwaySize = 2;
  this.gridWidth = 0;
  this.gridHeight = 0;
  this.rooms = [];
  this.hallways = [];
  this.startingRoom = null;
  this.lobbies = [];
  this.deskIdPool = 0;
  this.roomIdPool = 0;
  
  this.bg = new CachedContainer();
  this.addChild(this.bg);
}
World.cellTypes = {
  ground: 1,
  outerWall: 2,
  door: 3,
  roomGround: 4
};
World.relativePos = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 }
];
World.roomTypes = {
  mailRoom: 1,
  officeBullpen: 3,
  officePrivate: 4,
  officeOpen: 5
};
World.furnitureTypes = {
  desk: 1,
  doubleDesk: 2,
  cubicleWall: 5
};
World.sides = {
  right: 1,
  bottom: 2,
  left: 4,
  top: 8
};

World.openDesk = {
  width: 40,
  depth: 20,
  chairSize: 20,
  type: World.furnitureTypes.desk
};

World.openDeskDouble = {
  width: 85,
  depth: 20,
  chairSize: 20,
  spacing: 5,
  type: World.furnitureTypes.doubleDesk
};

World.privateDesk = {
  width: 80,
  depth: 20,
  chairSize: 20,
  spacing: 10,
  type: World.furnitureTypes.desk
};

World.bullpenDesk = {
  width: 40,
  depth: 20,
  chairSize: 20,
  type: World.furnitureTypes.desk
};

World.prototype = extendPrototype(DisplayContainer.prototype, {
  generate: function (width, height) {
    var w = width, h = height;
    this.bg.setDimensions(w * this.cellSize, h * this.cellSize);
    
    // building walls
    this.bg.addChild(new DisplayRect({
      x: 0 * this.cellSize,
      y: 0 * this.cellSize,
      w: w * this.cellSize,
      h: h * this.cellSize,
      color: Resources.loadedPatterns.wallTile // '#000000'
    }));
    
    // hallway floor
    this.bg.addChild(new DisplayRect({
      x: 1 * this.cellSize,
      y: 1 * this.cellSize,
      w: (w - 2) * this.cellSize,
      h: (h - 2) * this.cellSize,
      color: Resources.loadedPatterns.hallwayTile // '#656565'
    }));
    
    var i, j, x, y, x2, y2;
    
    this.gridWidth = w;
    this.gridHeight = h;
    
    // walls for entire floor
    for (i = 0; i < w; i += 1) {
      this.setPos(i, 0, World.cellTypes.outerWall);
      this.setPos(i, h - 1, World.cellTypes.outerWall);
    }
    for (i = 0; i < h; i += 1) {
      this.setPos(0, i, World.cellTypes.outerWall);
      this.setPos(w - 1, i, World.cellTypes.outerWall);
    }
    
    // entire floor (without walls) as first chunk
    var splitDir = Random.rangeInt(0, 2); // 0-1
    var chunk = {
      left: 1,
      top: 1,
      right: w - 1,
      bottom: h - 1,
      splitDir: splitDir
    };
    
    var chunkPool = [chunk],
      hallways = [],
      finalChunks = [],
      splitNum,
      splitPos,
      chunkA,
      chunkB,
      room,
      hallway,
      upperBoundSide,
      lowerBoundSide,
      splitCount = 0,
      pass = 0; // 0 = hallways and big chunks; 1 = chunks into rooms
    
    // partition the floor
    
    // start with hallways first
    var minWidth = this.hallwayMinChunkWidth
    var minHeight = this.hallwayMinChunkHeight;
    var minArea = this.hallwayMinChunkArea;
    while (chunkPool.length > 0 && splitCount < 10000) {
      chunk = chunkPool.shift();
      chunkA = extend({}, chunk);
      chunkB = null;
      splitDir = chunk.splitDir;
      
      if (splitDir === 0) { // split vertically
        upperBoundSide = 'right';
        lowerBoundSide = 'left';
      } else { // split horizontally
        upperBoundSide = 'bottom';
        lowerBoundSide = 'top';
      }
      
      if (pass === 0) {
        hallway = extend({}, chunk);
        
        /*if (chunk.right - chunk.left > minWidth) {
          splitNum = Random.rangeInt(2, 4);
        } else {
          splitNum = 2;
        }*/
        splitNum = 3;
        if (splitNum === 2) { // hallway and chunk
          if (Random.rangeInt(0, 2) === 0) {
            splitPos = chunk[upperBoundSide] - this.hallwaySize;
            chunkA[upperBoundSide] = splitPos - 1;
            hallway[lowerBoundSide] = splitPos;
          } else {
            splitPos = chunk[lowerBoundSide] + this.hallwaySize;
            chunkA[lowerBoundSide] = splitPos + 1;
            hallway[upperBoundSide] = splitPos;
          }
        } else { // two chunks with a hallway in between
          chunkB = extend({}, chunk);
          splitPos = Random.rangeInt(chunk[lowerBoundSide] + minWidth / 2, chunk[upperBoundSide] - minWidth / 2);
          chunkA[upperBoundSide] = splitPos - this.hallwaySize / 2 - 1;
          chunkB[lowerBoundSide] = splitPos + this.hallwaySize / 2 + 1;
          hallway[upperBoundSide] = splitPos + this.hallwaySize / 2;
          hallway[lowerBoundSide] = splitPos - this.hallwaySize / 2;
        }
        hallway.hallway = true;
        hallways.push(hallway);
      } else { // split chunks into 2
        chunkB = extend({}, chunk);
        splitPos = Random.rangeInt(chunk[lowerBoundSide] + minWidth / 2, chunk[upperBoundSide] - minWidth / 2);
        chunkA[upperBoundSide] = splitPos;
        chunkB[lowerBoundSide] = splitPos + 1;
      }
      
      // if more than minChunkArea, put back into chunk pool for further partitioning
      x = chunkA.right - chunkA.left;
      y = chunkA.bottom - chunkA.top;
      if (x > minWidth && y > minHeight && x * y > minArea) {
        if (pass === 0) {
          chunkA.splitDir = splitDir ? 0 : 1;
        } else {
          chunkA.splitDir = x > y ? 0 : 1;
        }
        chunkPool.push(chunkA);
      } else {
        finalChunks.push(chunkA);
      }
      if (chunkB){
        x = chunkB.right - chunkB.left;
        y = chunkB.bottom - chunkB.top;
        if (x > minWidth && y > minHeight && x * y > minHeight) {
          if (pass === 0) {
            chunkB.splitDir = splitDir ? 0 : 1;
          } else {
            chunkB.splitDir = x > y ? 0 : 1;
          }
          chunkPool.push(chunkB);
        } else {
          finalChunks.push(chunkB);
        }
      }
      splitCount += 1;
      
      if (pass === 0 && chunkPool.length === 0) {
        pass += 1;
        minWidth = this.minChunkWidth;
        minHeight = this.minChunkHeight;
        minArea = this.minChunkArea;
        // recheck chunk sizes against new limits
        for (i = finalChunks.length - 1; i >= 0; i -= 1) {
          chunkA = finalChunks[i];
          x = chunkA.right - chunkA.left;
          y = chunkA.bottom - chunkA.top;
          if (x > minWidth && y > minHeight && x * y > minArea) {
            // try to split based on which direction is longer
            chunkA.splitDir = x > y ? 0 : 1;
            chunkPool.push(chunkA);
            finalChunks.splice(i, 1);
          }
        }
      }
    }
    if (splitCount >= 10000) {
      throw new Error('Infinite loop in partitioning');
    }
    this.hallways = hallways;
    
    // reference cells to hallways
    for (i = 0; i < hallways.length; i += 1) {
      hallway = hallways[i];
      for (x = hallway.left; x < hallway.right; x += 1) {
        for (y = hallway.top; y < hallway.bottom; y += 1) {
          this.setPos(x, y, World.cellTypes.ground, hallway);
        }
      }
    }
    
    // room creation
    var islandRooms = [], rectCheck;
    for (i = 0; i < finalChunks.length; i += 1) {
      chunk = finalChunks[i];
      // room walls
      this.bg.addChild(new DisplayRect({
        x: (chunk.left - 1) * this.cellSize,
        y: (chunk.top - 1) * this.cellSize,
        w: (chunk.right - chunk.left + 2) * this.cellSize,
        h: (chunk.bottom - chunk.top + 2) * this.cellSize,
        color: Resources.loadedPatterns.wallTile // '#000000'
      }));
      
      // room floor graphic
      this.bg.addChild(new DisplayRect({
        x: chunk.left * this.cellSize,
        y: chunk.top * this.cellSize,
        w: (chunk.right - chunk.left) * this.cellSize,
        h: (chunk.bottom - chunk.top) * this.cellSize,
        color: Resources.loadedPatterns.roomTile // '#999999'
      }));
      // put walls around final chunks
      for (x = chunk.left - 1; x < chunk.right + 1; x += 1) {
        this.setPos(x, chunk.top - 1, World.cellTypes.outerWall);
        this.setPos(x, chunk.bottom, World.cellTypes.outerWall);
      }
      for (y = chunk.top - 1; y < chunk.bottom + 1; y += 1) {
        this.setPos(chunk.left - 1, y, World.cellTypes.outerWall);
        this.setPos(chunk.right, y, World.cellTypes.outerWall);
      }
      room = new Room(this.roomIdPool++, chunk);
      // set room cells as room ground
      for (x = chunk.left; x < chunk.right; x += 1) {
        for (y = chunk.top; y < chunk.bottom; y += 1) {
          this.setPos(x, y, World.cellTypes.roomGround, room);
        }
      }
      // add to islandRooms
      islandRooms.push(room);
    }
    
    // connect rooms
    // first pass: connect island rooms to hallways, or add back to island room stack
    // second pass: keep connecting island rooms, it should eventually run out
    splitCount = 0;
    while (islandRooms.length > 0 && splitCount < 10000) {
      // first pass = unchecked rooms, determined by the first set of islandRooms
      // second pass = after all rooms neighboring hallways have been connected
      chunkPool = splitCount < finalChunks.length ? hallways : this.rooms;
      chunk = islandRooms.shift();
      // check left/right separately from top/bottom to avoid adding diagonal neighbors
      rectCheck = extend({}, chunk);
      var neighbors = [];
      // check for left and right of room
      rectCheck.top += 1;
      rectCheck.bottom -= 1;
      rectCheck.left -= 2;
      rectCheck.right += 2;
      for (j = 0; j < chunkPool.length; j += 1) {
        chunkA = chunkPool[j];
        if (JMath.intersectRectRect(rectCheck, chunkA)) {
          neighbors.push(chunkA);
        }
      }
      // check for top and bottom of room
      rectCheck.left = chunk.left + 1;
      rectCheck.right = chunk.right - 1;
      rectCheck.top = chunk.top - 2;
      rectCheck.bottom = chunk.bottom + 2;
      for (j = 0; j < chunkPool.length; j += 1) {
        chunkA = chunkPool[j];
        if (neighbors.indexOf(chunkA) < 0 && JMath.intersectRectRect(rectCheck, chunkA)) {
          neighbors.push(chunkA);
        }
      }
      if (neighbors.length > 0) { // has a connected neighbor
        var doorWallFlags = 0;
        chunkA = Random.pick(neighbors);
        // reset rectCheck
        rectCheck.left = chunk.left;
        rectCheck.top = chunk.top;
        rectCheck.right = chunk.right;
        rectCheck.bottom = chunk.bottom;
        // determine direction
        var found = false, doorToHallwayOffsetX = this.cellSize / 2, doorToHallwayOffsetY = this.cellSize / 2;
        // left
        rectCheck.left -= 2;
        if (JMath.intersectRectRect(rectCheck, chunkA)) {
          found = true;
          x = chunkA.right;
          y = Random.rangeInt(
            Math.max(chunk.top, chunkA.top),
            Math.min(chunk.bottom, chunkA.bottom) - 1
          );
          x2 = x;
          y2 = y + 1;
          doorToHallwayOffsetX += this.cellSize * 2;
          doorWallFlags = World.sides.left;
        }
        // top
        if (!found) {
          rectCheck.left = chunk.left;
          rectCheck.top -= 2;
          if (JMath.intersectRectRect(rectCheck, chunkA)) {
            found = true;
            x = Random.rangeInt(
              Math.max(chunk.left, chunkA.left),
              Math.min(chunk.right, chunkA.right) - 1
            );
            y = chunkA.bottom;
            x2 = x + 1;
            y2 = y;
            doorToHallwayOffsetY += this.cellSize * 2;
            doorWallFlags = World.sides.top;
          }
        }
        // right
        if (!found) {
          rectCheck.top = chunk.top;
          rectCheck.right += 2;
          if (JMath.intersectRectRect(rectCheck, chunkA)) {
            found = true;
            x = chunkA.left - 1;
            y = Random.rangeInt(
              Math.max(chunk.top, chunkA.top),
              Math.min(chunk.bottom, chunkA.bottom) - 1
            );
            x2 = x;
            y2 = y + 1;
            doorToHallwayOffsetX += -this.cellSize * 2;
            doorWallFlags = World.sides.right;
          }
        }
        // bottom
        if (!found) {
          x = Random.rangeInt(
            Math.max(chunk.left, chunkA.left),
            Math.min(chunk.right, chunkA.right) - 1
          );
          y = chunkA.top - 1;
          x2 = x + 1;
          y2 = y;
          doorToHallwayOffsetY += -this.cellSize * 2;
          doorWallFlags = World.sides.bottom;
        }
        this.setPos(x, y, World.cellTypes.door);
        this.setPos(x2, y2, World.cellTypes.door);
        chunk.doorToHallway = {
          x: (x + x2) / 2 * this.cellSize + doorToHallwayOffsetX,
          y: (y + y2) / 2 * this.cellSize + doorToHallwayOffsetY
        };
        chunk.connected = true;
        this.rooms.push(chunk);
        // which walls have doors
        if (!chunk.doorWallFlags) {
          chunk.doorWallFlags = 0;
        }
        if (!chunkA.doorWallFlags) {
          chunkA.doorWallFlags = 0;
        }
        chunk.doorWallFlags |= doorWallFlags;
        var opposing = doorWallFlags << 2;
        if (opposing > 8) {
          opposing >>= 4; // wrap around if more than 4 digits
        }
        chunkA.doorWallFlags |= opposing;
      } else {
        // first pass: this room is an island room
        // second pass: this room is surrounded by other island rooms, add back to stack
        chunk.connected = false;
        islandRooms.push(chunk);
      }
      splitCount += 1;
    }
    if (splitCount >= 10000) {
      throw new Error('Infinite loop in door placements');
    }
  },
  generateFog: function () {
    var fog, chunk, i, hallways = this.hallways;
    // room fog
    for (i = 0; i < this.rooms.length; i += 1) {
      chunk = this.rooms[i];
      fog = new DisplayRect({
        x: Math.floor((chunk.left - 0.5) * this.cellSize),
        y: Math.floor((chunk.top - 0.5) * this.cellSize),
        w: Math.floor((chunk.right - chunk.left + 1) * this.cellSize),
        h: Math.floor((chunk.bottom - chunk.top + 1) * this.cellSize)
      });
      this.addChild(fog);
      chunk.fog = fog;
    }
    // hallway fog
    var hallwayFog = new DisplayContainer();
    this.addChild(hallwayFog);
    for (i = 0; i < hallways.length; i += 1) {
      chunk = hallways[i];
      fog = new DisplayRect({
        x: Math.floor((chunk.left - 0.5) * this.cellSize),
        y: Math.floor((chunk.top - 0.5) * this.cellSize),
        w: Math.floor((chunk.right - chunk.left + 1) * this.cellSize),
        h: Math.floor((chunk.bottom - chunk.top + 1) * this.cellSize)
      });
      hallwayFog.addChild(fog);
      chunk.fog = hallwayFog;
    }
  },
  generateRoomTypes: function () {
    // mail room (starting point)
    var roomPool = this.rooms.slice();
    var room = Random.pickAndRemove(roomPool);
    room.type = World.roomTypes.mailRoom;
    this.generateRoomLayout(room);
    this.startingRoom = room;

    // other rooms
    var roomTypePool, w, h, a;
    while (roomPool.length > 0) {
      room = Random.pickAndRemove(roomPool);
      w = room.right - room.left;
      h = room.bottom - room.top;
      a = w * h;
      roomTypePool = [];
      // min/max areas for each room type
      if (a > 200) {
        roomTypePool.push(World.roomTypes.officeBullpen);
      }
      if (a >= 100) {
        roomTypePool.push(World.roomTypes.officeOpen);
      }
      if (a < 100) {
        roomTypePool.push(World.roomTypes.officePrivate);
      }
      room.type = Random.pick(roomTypePool);
      this.generateRoomLayout(room);
    }
  },
  createDesk: function (x, y, facing, deskSettings) {
    var deskHalfWidth = deskSettings.width / 2;
    var deskHalfDepth = deskSettings.depth / 2;
    var chairHalfSize = deskSettings.chairSize / 2;
    var desks = [], collisionAabbs, angle;

    // initially facing right, with (x, y) at the center back of desk
    collisionAabbs = [
      new AABB(x - deskHalfDepth - chairHalfSize / 2, y, deskHalfDepth + chairHalfSize / 2, deskHalfWidth)
    ];
    if (deskSettings.type === World.furnitureTypes.doubleDesk) {
      var deskActualWidth = (deskSettings.width - deskSettings.spacing) / 2;
      desks.push(new Desk(
        deskSettings.type, x - deskHalfDepth, y - deskActualWidth / 2 - deskSettings.spacing / 2,
        deskSettings.depth, deskActualWidth,
        deskSettings.chairSize
      ));
      desks.push(new Desk(
        deskSettings.type, x - deskHalfDepth, y + deskActualWidth / 2 + deskSettings.spacing / 2,
        deskSettings.depth, deskActualWidth,
        deskSettings.chairSize
      ));
    } else {
      desks.push(new Desk(
        deskSettings.type, x - deskHalfDepth, y,
        deskSettings.depth, deskSettings.width,
        deskSettings.chairSize
      ));
    }
    if (facing === World.sides.left) {
      angle = 180;
    } else if (facing === World.sides.top) {
      angle = 270;
    } else if (facing === World.sides.right) {
      angle = 0;
    } else {
      angle = 90;
    }

    collisionAabbs.forEach(function (aabb) {
      aabb.rotateAroundPoint({ x: x, y: y }, angle);
    });
    desks.forEach(function (desk) {
      desk.rotateAround({ x: x, y: y }, angle);
    });

    return [
      collisionAabbs,
      desks
    ];
  },
  generateRoomLayout: function (room) {
    // TODO
    // using pixel units
    var collisionDesksPair = null;
    var bounds = {
      left: room.left * this.cellSize,
      top: room.top * this.cellSize,
      right: room.right * this.cellSize,
      bottom: room.bottom * this.cellSize
    };
    var offset = 1.5; // grid units from wall

    // offset from wall with doors
    if (room.doorWallFlags & World.sides.left) {
      bounds.left += this.cellSize * offset;
    }
    if (room.doorWallFlags & World.sides.top) {
      bounds.top += this.cellSize * offset;
    }
    if (room.doorWallFlags & World.sides.right) {
      bounds.right -= this.cellSize * offset;
    }
    if (room.doorWallFlags & World.sides.bottom) {
      bounds.bottom -= this.cellSize * offset;
    }

    // debug placeable area
    // var boundRect = new DisplayRect({
    //   x: bounds.left,
    //   y: bounds.top,
    //   w: bounds.right - bounds.left,
    //   h: bounds.bottom - bounds.top,
    //   color: '#007700'
    // });
    // this.addChild(boundRect);

    if (room.type === World.roomTypes.officeOpen) {
      collisionDesksPair = this.generateOpenOffice(bounds);
    } else if (room.type === World.roomTypes.officePrivate) {
      collisionDesksPair = this.generatePrivateOffice(bounds, room);
    } else if (room.type === World.roomTypes.officeBullpen) {
      collisionDesksPair = this.generateBullpenOffice(bounds, room);
    }

    if (collisionDesksPair) {
      room.collisionAabbs = collisionDesksPair[0];
      room.furniture = collisionDesksPair[1];
    }

    room.furniture.forEach(function (desk) {
      desk.room = room;
      desk.displayItems.forEach(function (item) {
        this.addChild(item);
      }, this);
    }, this);
  },
  generateOpenOffice: function (bounds, room) {
    var i;
    var boundsWidth = bounds.right - bounds.left,
      boundsHeight = bounds.bottom - bounds.top;
    
    var collisionAabbs = [], furniture = [];
    var deskSpacing = 50, pair;
    var deskTypes = [ World.openDesk ];
    var lat = boundsWidth > boundsHeight ? boundsHeight : boundsWidth;

    // deskSpacing * 2 to allow for random offset still allow spacing for player
    if (World.openDeskDouble.width + deskSpacing * 2 >= lat) {
      deskTypes.push(World.openDeskDouble);
    }

    var deskSettings = Random.pick(deskTypes);
    var deskInterval = deskSettings.depth + deskSpacing;
    var deskHalfWidth = deskSettings.width / 2;
    var chairHalfSize = deskSettings.chairSize / 2;
    var deskX, deskY;
    var maxDesks, deskFrontOffset, deskSideOffset, facing = Random.rangeInt(0, 2);

    if (boundsWidth > boundsHeight) {
      // desks are vertical
      // facing: 0 == facing left, 1 == facing right
      maxDesks = Math.floor(boundsWidth / deskInterval);
      deskFrontOffset = Math.random() * (boundsWidth - maxDesks * deskInterval);
      deskY = bounds.top + deskHalfWidth;
      // adding desks laterally
      while (deskY + deskHalfWidth < bounds.bottom) {
        for (i = 0; i < maxDesks; i += 1) {
          // add desk columns
          deskX = bounds.left + i * deskInterval + facing * (deskSettings.depth + chairHalfSize) + deskFrontOffset;
          pair = this.createDesk(deskX, deskY, facing ? World.sides.right : World.sides.left, deskSettings);
          collisionAabbs = collisionAabbs.concat(pair[0]);
          furniture = furniture.concat(pair[1]);
        }
        // spacing between desks
        deskY += deskSpacing + deskSettings.width;
      }
      // determine bounds for randomized lateral position
      var topMost = null, bottomMost = null;
      collisionAabbs.forEach(function (item) {
        if (!topMost || item.y < topMost.y) {
          topMost = item;
        }
        if (!bottomMost || item.y > bottomMost.y) {
          bottomMost = item;
        }
      });
      // if has desks
      if (topMost && bottomMost) {
        // randomize lateral position
        deskSideOffset = Math.random() * (boundsHeight - ((bottomMost.y + bottomMost.hh) - (topMost.y - topMost.hh)));
        // shift everything
        collisionAabbs.forEach(function (aabb) {
          aabb.y += deskSideOffset;
        });
        furniture.forEach(function (item) {
          item.displayItems.forEach(function (di) {
            di.y += deskSideOffset;
          });
          item.mailAabb.y += deskSideOffset;
        });
      } else {
        console.log('Empty room');
      }
    } else {
      // desks are horizontal
      // facing: 0 == facing top, 1 == facing bottom
      maxDesks = Math.floor(boundsHeight / deskInterval);
      deskFrontOffset = Math.random() * (boundsHeight - maxDesks * deskInterval);
      deskX = bounds.left + deskHalfWidth;
      // adding desks laterally
      while (deskX + deskHalfWidth < bounds.right) {
        for (i = 0; i < maxDesks; i += 1) {
          // add desk columns
          deskY = bounds.top + i * deskInterval + facing * (deskSettings.depth + chairHalfSize) + deskFrontOffset;
          pair = this.createDesk(deskX, deskY, facing ? World.sides.bottom : World.sides.top, deskSettings);
          collisionAabbs = collisionAabbs.concat(pair[0]);
          furniture = furniture.concat(pair[1]);
        }
        // space between desks
        deskX += deskSpacing + deskSettings.width;
      }
      // determine bounds for randomized lateral position
      var leftMost = null, rightMost = null;
      collisionAabbs.forEach(function (item) {
        if (!leftMost || item.x < leftMost.x) {
          leftMost = item;
        }
        if (!rightMost || item.x > rightMost.x) {
          rightMost = item;
        }
      });
      // if has desks
      if (rightMost && leftMost) {
        // randomize lateral position
        deskSideOffset = Math.random() * (boundsWidth - ((rightMost.x + rightMost.hw) - (leftMost.x - leftMost.hw)));
        // shift everything
        collisionAabbs.forEach(function (aabb) {
          aabb.x += deskSideOffset;
        });
        furniture.forEach(function (item) {
          item.displayItems.forEach(function (di) {
            di.x += deskSideOffset;
          });
          item.mailAabb.x += deskSideOffset;
        });
      } else {
        console.log('Empty room');
      }
    }

    return [collisionAabbs, furniture];
  },
  generatePrivateOffice: function (bounds, room) {
    var facing = this.determinePrevailingFacing(room);

    var deskSettings = World.privateDesk,
      fullDepth = deskSettings.depth + deskSettings.chairSize / 2, // depth + chair slightly in
      halfWidth = deskSettings.width / 2,
      tolerance = fullDepth + deskSettings.spacing, // depth + chair + spacing behind chair
      x, y, lower, upper;

    // randomize the lateral position of the desk
    if (facing === World.sides.left || facing === World.sides.right) {
      lower = bounds.top + halfWidth;
      upper = bounds.bottom - halfWidth;
      if (upper <= lower) {
        y = (bounds.top + bounds.bottom) / 2;
      } else {
        y = Random.range(lower, upper);
      }
    } else {
      lower = bounds.left + halfWidth;
      upper = bounds.right - halfWidth;
      if (upper <= lower) {
        x = (bounds.left + bounds.right) / 2;
      } else {
        x = Random.range(lower, upper);
      }
    }

    // put up against wall opposite of a door
    if (facing === World.sides.right) {
      x = bounds.left + tolerance;
    } else if (facing === World.sides.left) {
      x = bounds.right - tolerance;
    } else if (facing === World.sides.bottom) {
      y = bounds.top + tolerance;
    } else { // facing top
      y = bounds.bottom - tolerance;
    }
    
    return this.createDesk(x, y, facing, deskSettings);
  },
  generateBullpenOffice: function (bounds, room) {
    var aisleSize = 30,
      cubicleSize = 50,
      wallThickness = 2,
      maxRowsPerSection = 2,
      maxColumnsPerRow = 5,
      sectionColumnSize = maxColumnsPerRow * cubicleSize,
      sectionRowSize = maxRowsPerSection * cubicleSize,
      boundsWidth = bounds.right - bounds.left,
      boundsHeight = bounds.bottom - bounds.top,
      rowAxisWidth,
      columnAxisHeight,
      orientation; // 0 = horizontal, 1 = vertical

    // work with horizontal orientation for local placement
    if (boundsWidth > boundsHeight) {
      rowAxisWidth = boundsWidth;
      columnAxisHeight = boundsHeight;
      orientation = 0;
    } else {
      rowAxisWidth = boundsHeight;
      columnAxisHeight = boundsWidth;
      orientation = 1;
    }

    // separate into full sections and partial sections
    var numSectionRows = Math.floor((columnAxisHeight - aisleSize) / (aisleSize + sectionRowSize)),
      numSectionColumns = Math.floor((rowAxisWidth - aisleSize) / (aisleSize + sectionColumnSize)),
      lastSectionRowRemainder = (columnAxisHeight - aisleSize) % (aisleSize + sectionRowSize) - aisleSize,
      lastSectionColumnRemainder = (rowAxisWidth - aisleSize) % (aisleSize + sectionColumnSize) - aisleSize,
      lastSectionNumRows = Math.floor(lastSectionRowRemainder / cubicleSize),
      lastSectionNumColumns = Math.floor(lastSectionColumnRemainder / cubicleSize),
      sectionRow, sectionColumn, cubicleRow, cubicleColumn,
      sectionX, sectionY, cubicleX, cubicleY,
      maxCubicleRows, maxCubicleColumns,
      sideOpening, aabb;

    var collisionAabbs = [],
      furniture = [];
    
    if (lastSectionNumRows > 0) {
      numSectionRows += 1;
    }
    if (lastSectionNumColumns > 0) {
      numSectionColumns += 1;
    }
    
    var cubicles = [], cubicleWalls = [];
    
    // for each section
    for (sectionRow = 0; sectionRow < numSectionRows; sectionRow += 1) {
      sectionY = (sectionRowSize + aisleSize) * sectionRow + aisleSize;
      if (lastSectionNumRows > 0 && sectionRow === numSectionRows - 1) {
        // rows for partial sections
        maxCubicleRows = lastSectionNumRows;
      } else {
        // full rows
        maxCubicleRows = maxRowsPerSection;
      }
      for (sectionColumn = 0; sectionColumn < numSectionColumns; sectionColumn += 1) {
        sectionX = (sectionColumnSize + aisleSize) * sectionColumn + aisleSize;
        if (lastSectionNumColumns > 0 && sectionColumn === numSectionColumns - 1) {
          // columns for partial sections
          maxCubicleColumns = lastSectionNumColumns;
        } else {
          // full columns
          maxCubicleColumns = maxColumnsPerRow;
        }
        
        // long middle wall
        aabb = new AABB(
          sectionX + (maxCubicleColumns * cubicleSize / 2),
          sectionY + cubicleSize,
          maxCubicleColumns * cubicleSize / 2,
          wallThickness
        );
        cubicleWalls.push(aabb);

        // cubicles within section
        for (cubicleRow = 0; cubicleRow < maxCubicleRows; cubicleRow += 1) {
          cubicleY = sectionY + cubicleRow * cubicleSize;
          sideOpening = (cubicleRow % 2) === 0 ? World.sides.top : World.sides.bottom;
          for (cubicleColumn = 0; cubicleColumn < maxCubicleColumns; cubicleColumn += 1) {
            cubicleX = sectionX + cubicleColumn * cubicleSize;
            aabb = new AABB(
              cubicleX + cubicleSize / 2,
              cubicleY + cubicleSize / 2,
              cubicleSize / 2,
              cubicleSize / 2
            );
            aabb.sideOpening = sideOpening;
            cubicles.push(aabb);

            // cubicle wall
            aabb = new AABB(
              cubicleX,
              cubicleY + cubicleSize / 2,
              wallThickness,
              cubicleSize / 2
            );
            cubicleWalls.push(aabb);
          }
          // last cubicle wall
          aabb = new AABB(
            sectionX + maxCubicleColumns * cubicleSize,
            cubicleY + cubicleSize / 2,
            wallThickness,
            cubicleSize / 2
          );
          cubicleWalls.push(aabb);
        }
      }
    }

    var boundsCenter = {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.top + bounds.bottom) / 2
      },
      localBoundsCenter = {
        x: rowAxisWidth / 2,
        y: columnAxisHeight / 2
      },
      localToWorld = {
        x: boundsCenter.x - localBoundsCenter.x,
        y: boundsCenter.y - localBoundsCenter.y
      },
      pool,
      rotate;

    // randomize angle
    if (orientation === 0) { // horizontal
      pool = [0, 180];
    } else { // vertical
      pool = [90, 270]; 
    }
    rotate = Random.pick(pool);

    cubicles.forEach(function (cubicle) {
      // rotate about the center of local bounds
      if (rotate !== 0) {
        cubicle.rotateAroundPoint(localBoundsCenter, rotate);
        var numShifts = Math.round(rotate / 90), i;
        for (i = 0; i < numShifts; i += 1) {
          cubicle.sideOpening <<= 1;
          // 1000
          if (cubicle.sideOpening > 8) {
            cubicle.sideOpening = 1;
          }
        }
      }

      // move all to center of bounds
      cubicle.x += localToWorld.x;
      cubicle.y += localToWorld.y;

      // 1111
      var facing = Random.flagPick(15 ^ cubicle.sideOpening), deskX, deskY;
      if (facing === World.sides.right) {
        deskX = cubicle.x + cubicle.hw;
        deskY = cubicle.y;
      } else if (facing === World.sides.bottom) {
        deskX = cubicle.x;
        deskY = cubicle.y + cubicle.hh;
      } else if (facing === World.sides.left) {
        deskX = cubicle.x - cubicle.hw;
        deskY = cubicle.y;
      } else { // facing top
        deskX = cubicle.x;
        deskY = cubicle.y - cubicle.hh;
      }
      
      var pair = this.createDesk(deskX, deskY, facing, World.bullpenDesk);
      collisionAabbs = collisionAabbs.concat(pair[0]);
      furniture = furniture.concat(pair[1]);
    }, this);

    cubicleWalls.forEach(function (cWall) {
      if (rotate !== 0) {
        cWall.rotateAroundPoint(localBoundsCenter, rotate);
      }
      cWall.x += localToWorld.x;
      cWall.y += localToWorld.y;

      collisionAabbs.push(cWall.copy());
      // TODO use pattern/image for walls
      furniture.push({
        room: null,
        type: World.furnitureTypes.cubicleWall,
        displayItems: [
          new DisplayRect(extend(cWall.toRect(), {
            color: 'black'
          }))
        ]
      });
    });

    // cubicles.forEach(function (cubicle) {
    //   this.addChild(new DisplayRect({
    //     x: cubicle.x - cubicle.hw,
    //     y: cubicle.y - cubicle.hh,
    //     w: cubicle.hw * 2,
    //     h: cubicle.hh * 2,
    //     color: 'white'
    //   }));
    // }, this);

    return [collisionAabbs, furniture];
  },
  determinePrevailingFacing: function (room) {
    var facing = 0, i, f, pool = [];

    // determine orientation of private desk
    // single door wall
    for (i = 1; i <= 8 && !facing; i <<= 1) {
      if (i === room.doorWallFlags) {
        facing = i;
      } else if ((room.doorWallFlags & i) > 0) {
        pool.push(i); // for random direction later
      }
    }
    // opposing door walls
    if (!facing) {
      if (room.doorWallFlags === 5) {
        // 0101
        facing = Random.pick([1, 4]);
      } else if (room.doorWallFlags === 10) {
        // 1010
        facing = Random.pick([2, 8]);
      }
    }
    // three door walls
    if (!facing) {
      for (f = 1; f <= 8 && !facing; f <<= 1) {
        i = f;
        // upper digit
        if ((f << 1) > 8) {
          i |= 1; // wrap
        } else {
          i |= f << 1;
        }
        // lower digit
        if ((f >> 1) < 1) {
          i |= 8; // wrap
        } else {
          i |= f >> 1;
        }
        if (i === room.doorWallFlags) {
          facing = f;
        }        
      }
    }
    // any other door wall configs
    if (!facing) {
      facing = Random.pick(pool);
    }
    return facing;
  },
  createCell: function (x, y, type, room) {
    var color = null,
      aabb = null,
      halfSize = this.cellSize / 2,
      item = null,
      passable = true,
      fillOffsetX = 0,
      fillOffsetY = 0;
    switch (type) {
    case World.cellTypes.outerWall: // wall
      aabb = new AABB(
        (x * this.cellSize + halfSize),
        (y * this.cellSize + halfSize),
        halfSize,
        halfSize
      );
      passable = false;
      break;
    case World.cellTypes.ground: // floor
      passable = true;
      break;
    case World.cellTypes.door:
      color = Resources.loadedPatterns.hallwayTile;
      passable = true;
      fillOffsetX = -x * this.cellSize;
      fillOffsetY = -y * this.cellSize;
      break;
    case World.cellTypes.roomGround:
      passable = true;
      break;
    }
    if (color) {
      item = new DisplayRect({
        x: x * this.cellSize,
        y: y * this.cellSize,
        w: this.cellSize,
        h: this.cellSize,
        color: color ,
        fillOffsetX: fillOffsetX,
        fillOffsetY: fillOffsetY
      });
    }
    return {
      type: type,
      item: item,
      aabb: aabb,
      room: room,
      passable: passable
    };
  },
  getCell: function (x, y) {
    if (!this.grid[x] || !this.grid[x][y]) {
      return null;
    }
    return this.grid[x][y];
  },
  setPos: function (x, y, type, room) {
    if (!this.grid[x]) {
      this.grid[x] = {};
    }
    var cell = this.grid[x][y];
    if (cell && cell.item) {
      this.removeChild(cell.item);
    }
    cell = this.createCell(x, y, type, room);
    this.grid[x][y] = cell;
    if (cell.item) {
      this.addChild(cell.item);
    }
  },
  getCellFromPos: function (x, y) {
    return this.getCell(
      Math.floor(x / this.cellSize),
      Math.floor(y / this.cellSize)
    );
  },
  getCellsAroundPos: function (x, y) {
    var cells = [];
    var cellX = Math.floor(x / this.cellSize);
    var cellY = Math.floor(y / this.cellSize);
    var cell = null;
    var relativePos = World.relativePos;
    var pos, i;
    for (i = 0; i < relativePos.length; i += 1) {
      pos = relativePos[i];
      cell = this.getCell(cellX + pos.x, cellY + pos.y);
      if (cell) {
        cells.push(cell);
      }
    }
    
    return cells;
  }
});

function Player(scene, settings) {
  DisplayContainer.call(this, settings);
  this.scene = scene;
  var s = extend({
    world: null
  }, settings || {});
  this.aabb = new AABB(0, 0, 10, 10);
  this.prevAabb = new AABB(0, 0, 10, 10);
  this.broadphase = new AABB(0, 0, 10, 10);
  this.speed = 200;
  this.collIterations = 4;
  this.vel = {
    x: 0,
    y: 0
  };
  this.prevVel = {
    x: 0,
    y: 0
  };
  this.normal = {
    x: 0,
    y: 0
  };
  this.world = s.world;
  this.currentRoom = null;
  var img = new DisplayImg({
    img: Resources.loadedImgs.robot,
    w: 19,
    h: 20,
    anchorX: 74,
    anchorY: 77
  });
  this.addChild(img);
  this.img = img;
  this.collideWithWalls = true;
  this.collideWithFurniture = true;
  this.moveDirection = 0;
}
Player.prototype = extendPrototype(DisplayContainer.prototype, {
  addDirection: function (direction) {
    this.moveDirection |= direction;
    this.updateVel();
  },
  removeDirection: function (direction) {
    this.moveDirection ^= direction;
    this.updateVel();
  },
  resetDirection: function () {
    this.moveDirection = 0;
    this.updateVel();
  },
  updateVel: function () {
    this.vel.x = 0;
    this.vel.y = 0;
    if (this.moveDirection & World.sides.left) {
      this.vel.x -= this.speed;
    }
    if (this.moveDirection & World.sides.right) {
      this.vel.x += this.speed;
    }
    if (this.moveDirection & World.sides.top) {
      this.vel.y -= this.speed;
    }
    if (this.moveDirection & World.sides.bottom) {
      this.vel.y += this.speed;
    }
  },
  updateAABB: function () {
    this.prevAabb.set(this.aabb.x, this.aabb.y);
    this.aabb.set(this.x, this.y);
  },
  step: function (dts) {
    var cells, i, cell, ct, collisionTime = 1,
    normalX = 0, normalY = 0, curCollIteration,
    dotProd;

    cell = this.world.getCellFromPos(this.x, this.y);

    this.updateVel();

    if (this.vel.x || this.vel.y) {
      this.img.angle = JMath.angleFromVec(this.vel);
    }

    // collide with furniture
    var aabbs = null;
    if (this.collideWithFurniture && cell && cell.room && cell.room.collisionAabbs) {
      aabbs = cell.room.collisionAabbs;
    }
    // calculate collision multiple times per step via smaller positional steps
    for (curCollIteration = 0; curCollIteration < this.collIterations; curCollIteration += 1) {
      collisionTime = 1;
      if (aabbs) {
        this.calculateSweptBroadphase(dts);
        for (i = 0; i < aabbs.length; i += 1) {
          // collide with collisionAAbbs
          ct = this.maybeSweptCollideWith(aabbs[i], dts);
          // use earliest collision
          if (ct < collisionTime) {
            collisionTime = ct;
            normalX = this.normal.x;
            normalY = this.normal.y;
          }
        }
      }
      this.x += this.vel.x * dts * collisionTime / this.collIterations;
      this.y += this.vel.y * dts * collisionTime / this.collIterations;
      if (collisionTime < 1) {
        // slide for next iteration
        dotProd = (this.vel.x * normalY + this.vel.y * normalX) * (1 - collisionTime);
        this.vel.x = dotProd * normalY;
        this.vel.y = dotProd * normalX;
      }
      this.updateAABB();
    }

    if (collisionTime < 1) {
      // slide remaining
      dotProd = (this.vel.x * normalY + this.vel.y * normalX) * (1 - collisionTime);
      this.x += dotProd * normalY * dts / this.collIterations;
      this.y += dotProd * normalX * dts / this.collIterations;
      this.updateAABB();
    }

    if (cell && cell.room && cell.room.furniture) {
      var furniture = cell.room.furniture, needsMail = false;
      for (i = 0; i < furniture.length; i += 1) {
        // mail time
        if (furniture[i].type === World.furnitureTypes.desk || furniture[i].type === World.furnitureTypes.doubleDesk) {
          var desk = furniture[i];
          if (desk.needsMail && desk.mailAabb.intersectsWith(this.aabb)) {
            desk.mailDelivered(this);
          }
          needsMail = needsMail || desk.needsMail;
        }
      }
      cell.room.needsMail = needsMail;
    }
    
    // player collision with cells
    if (this.collideWithWalls) {
      cells = this.world.getCellsAroundPos(this.x, this.y);
      for (i = 0; i < cells.length; i += 1) {
        cell = cells[i];
        if (!cell.passable && cell.aabb) {
          this.maybeCollideWith(cell.aabb);
        }
      }
    }

    cell = this.world.getCellFromPos(this.x, this.y);
    
    // fog reveal/refog
    if (cell && cell.room && this.currentRoom !== cell.room) {
      var previousRoom = this.currentRoom;
      this.currentRoom = cell.room;
      // if previous room is set and not hallway to hallway
      if (previousRoom && !(previousRoom.hallway && this.currentRoom.hallway)) {
        if (previousRoom.fogAnim) {
          previousRoom.fogAnim.cancel();
          previousRoom.fogAnim = null;
        }
        var anim = new Anim({
          object: previousRoom.fog,
          property: 'alpha',
          from: 0,
          to: 1,
          duration: 0.5
        });
        previousRoom.fogAnim = anim;
        this.scene.main.animManager.add(anim);
      }
      if (this.currentRoom.fogAnim) {
        this.currentRoom.fogAnim.cancel();
        this.currentRoom.fogAnim = null;
      }
      this.currentRoom.fog.alpha = 0;
    }
  },
  maybeCollideWith: function (aabb) {
    var relX, relY;
    if (aabb.intersectsWith(this.aabb)) {
      relX = this.aabb.x - aabb.x;
      relY = this.aabb.y - aabb.y;
      if (Math.abs(relX) > Math.abs(relY)) {
        if (relX > 0) {
          this.x = aabb.getRight() + this.aabb.hw + 1;
        } else {
          this.x = aabb.getLeft() - this.aabb.hw - 1;
        }
      } else {
        if (relY > 0) {
          this.y = aabb.getBottom() + this.aabb.hh + 1;
        } else {
          this.y = aabb.getTop() - this.aabb.hh - 1;
        }
      }
      this.updateAABB();
    }
  },
  maybeSweptCollideWith: function (aabb, dts) {
    if (!this.broadphase.intersectsWith(aabb)) {
      this.normal.x = 0;
      this.normal.y = 0;
      return 1;
    }
    var xInvEntry, yInvEntry, xInvExit, yInvExit;
    
    if (this.vel.x > 0) {
      xInvEntry = (aabb.x - aabb.hw) - (this.aabb.x + this.aabb.hw);
      xInvExit = (aabb.x + aabb.hw) - (this.aabb.x - this.aabb.hw);
    } else {
      xInvEntry = (aabb.x + aabb.hw) - (this.aabb.x - this.aabb.hw);
      xInvExit = (aabb.x - aabb.hw) - (this.aabb.x + this.aabb.hw);
    }

    if (this.vel.y > 0) {
      yInvEntry = (aabb.y - aabb.hh) - (this.aabb.y + this.aabb.hh);
      yInvExit = (aabb.y + aabb.hh) - (this.aabb.y - this.aabb.hh);
    } else {
      yInvEntry = (aabb.y + aabb.hh) - (this.aabb.y - this.aabb.hh);
      yInvExit = (aabb.y - aabb.hh) - (this.aabb.y + this.aabb.hh);
    }

    // find collision time
    var xEntry, yEntry, xExit, yExit;

    if (this.vel.x === 0) {
      xEntry = -Number.MAX_VALUE;
      xExit = Number.MAX_VALUE;
    } else {
      xEntry = xInvEntry / (this.vel.x * dts / this.collIterations);
      xExit = xInvExit / (this.vel.x * dts / this.collIterations);
    }

    if (this.vel.y === 0) {
      yEntry = -Number.MAX_VALUE;
      yExit = Number.MAX_VALUE;
    } else {
      yEntry = yInvEntry / (this.vel.y * dts / this.collIterations);
      yExit = yInvExit / (this.vel.y * dts / this.collIterations);
    }

    var entryTime = Math.max(xEntry, yEntry),
      exitTime = Math.min(xExit, yExit);
    
    if (entryTime > exitTime || xEntry < 0 && yEntry < 0 || xEntry > 1 || yEntry > 1) {
      this.normal.x = 0;
      this.normal.y = 0;
      return 1;
    }

    // normals
    if (xEntry > yEntry) {
      this.normal.x = xInvEntry < 0 ? 1 : -1;
      this.normal.y = 0;
    } else {
      this.normal.x = 0;
      this.normal.y = yInvEntry < 0 ? 1 : -1;
    }

    return entryTime;
  },
  calculateSweptBroadphase: function (dts) {
    var dx = this.vel.x * dts / this.collIterations, dy = this.vel.y * dts / this.collIterations;
    var left = this.vel.x > 0 ? this.aabb.x - this.aabb.hw : this.aabb.x - this.aabb.hw + dx,
      top = this.vel.y > 0 ? this.aabb.y - this.aabb.hh : this.aabb.y - this.aabb.hh + dy,
      right = this.vel.x > 0 ? this.aabb.x + this.aabb.hw + dx : this.aabb.x + this.aabb.hw,
      bottom = this.vel.y > 0 ? this.aabb.y + this.aabb.hh + dy : this.aabb.y + this.aabb.hh;
    
    this.broadphase.x = (left + right) / 2;
    this.broadphase.y = (top + bottom) / 2;
    this.broadphase.hw = (right - left) / 2;
    this.broadphase.hh = (bottom - top) / 2;
  }
});

function Mail(options) {
  DisplayRect.call(this, extend({
    color: '#eeeeee',
    w: 20,
    h: 10,
    anchorX: 10,
    anchorY: 5
  }, options || {}));
}

Mail.prototype = extendPrototype(DisplayRect.prototype, {});
function TutorialKey(x, y, key, delay, animManager) {
  var container = new DisplayContainer({
    x: x,
    y: y
  });
  this.displayItem = container;
  this.animEnabled = false;
  this.delay = delay || 0;
  this.animManager = animManager;

  var keySide = new DisplayRect({
    x: -20,
    y: -5,
    w: 40,
    h: 25,
    color: '#cccccc',
    rounded: 5
  });
  container.addChild(keySide);
  this.keySide = keySide;

  var keyTop = new DisplayContainer({
    x: 0,
    y: 5
  });
  this.keyTop = keyTop;
  container.addChild(keyTop);

  var keyTopRect = new DisplayRect({
    x: -20,
    y: -40,
    w: 40,
    h: 40,
    color: '#ffffff',
    rounded: 5,
  });
  keyTop.addChild(keyTopRect);
  
  var keyTopKey = new DisplayText({
    x: 0,
    y: -20,
    text: key,
    font: '20px Arial',
    color: 'black',
    align: 'center',
    baseline: 'middle'
  });
  keyTop.addChild(keyTopKey);
  this.keyTopKey = keyTopKey;

  this.anims = [];
}

TutorialKey.prototype = {
  start: function () {
    this.animEnabled = true;
    setTimeout(this.startAnim.bind(this), this.delay * 1000);
  },
  startAnim: function () {
    if (!this.animEnabled) { return false; }
    var anim1, anim2;
    anim1 = new Anim({
      object: this.keyTop,
      property: 'y',
      from: 5,
      to: 15,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic,
      onEnd: function () {
        this.animManager.add(anim2);
      }.bind(this)
    });
    anim2 = new Anim({
      object: this.keyTop,
      property: 'y',
      from: 15,
      to: 5,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic,
      onEnd: this.startAnim.bind(this)
    });
    this.animManager.add(anim1);
  },
  stop: function () {
    this.animEnabled = false;
    this.anims.forEach(function (anim) {
      anim.cancel();
    });
  }
};

function Scene(main, settings) {
  DisplayContainer.call(this);
  this.main = main;
  this.settings = settings;
  this.steppables = [];
}
Scene.prototype = extendPrototype(DisplayContainer.prototype, {
  create: function () {},
  destroy: function () {},
  addSteppable: function (steppable) {
    this.steppables.push(steppable);
  },
  step: function (dts) {
    for (var i = 0; i < this.steppables.length; i += 1) {
      this.steppables[i](dts);
    }
  },
  _render: function (context) {
    // we don't need transformations
    this.render(context);
  }
});

function PlayScene() {
  Scene.apply(this, arguments);

  this.mailableRooms = [];
  this.mailableDesks = [];
  this.redirectedFromDesks = [];
  this.redirectedToDesks = [];
  this.roomPointerMap = {};
  this.eventList = [];
  this.gameState = PlayScene.gameStates.tutorial;
  this.timeLeft = 90;
  this.gameOverTimeLeft = 3;
  this.gameOverTimeText = null;
  
  this.gridRange = {
    minWidth: 60,
    maxWidth: 70,
    minHeight: 60,
    maxHeight: 70
  };
  
  this.gridWidth = Random.rangeInt(this.gridRange.minWidth, this.gridRange.maxWidth);
  this.gridHeight = Random.rangeInt(this.gridRange.minHeight, this.gridRange.maxHeight);
  
  var bg = new DisplayRect({
    w: SETTINGS.width,
    h: SETTINGS.height,
    color: '#333333'
  });
  this.addChild(bg);
  
  this.world = new World();
  this.addChild(this.world);
  this.world.generate(this.gridWidth, this.gridHeight);
  this.world.generateRoomTypes();
  this.world.generateFog();
  this.world.scaleX = 2;
  this.world.scaleY = 2;

  this.pointerLayer = new DisplayContainer({
    x: SETTINGS.width / 2,
    y: SETTINGS.height / 2
  });
  this.addChild(this.pointerLayer);

  this.mailLeftText = new DisplayText({
    text: '...',
    x: 5,
    y: 5,
    align: 'left',
    baseline: 'top',
    font: '16px Arial',
    color: '#ffffff'
  });
  this.addChild(this.mailLeftText);

  this.timeLeftText = new DisplayText({
    text: 'Time left: ' + this.timeLeft + 's',
    x: 5,
    y: 25,
    align: 'left',
    baseline: 'top',
    font: '16px Arial',
    color: '#ffffff'
  });
  this.addChild(this.timeLeftText);

  this.eventFeed = new DisplayContainer({
    x: 5,
    y: 45
  });
  this.addChild(this.eventFeed);

  this.generateMailableDesks();
  
  this.seeWholeWorld = false;
  if (this.seeWholeWorld) {
    var w = this.world.gridWidth * this.world.cellSize;
    var h = this.world.gridHeight * this.world.cellSize;
    if (w / h > SETTINGS.width / SETTINGS.height) {
      this.world.scaleX = this.world.scaleY = SETTINGS.width / w;
    } else {
      this.world.scaleX = this.world.scaleY = SETTINGS.height / h;
    }
    this.world.rooms.forEach(function (room) {
      room.fog.visible = false;
    });
    this.world.hallways[0].fog.visible = false;
  }
  
  this.player = new Player(this, {
    world: this.world
  });
  this.world.addChild(this.player);
  
  var room = this.world.startingRoom;
  this.player.x = (room.left + room.right) / 2 * this.world.cellSize;
  this.player.y = (room.top + room.bottom) / 2 * this.world.cellSize;
  this.player.updateAABB();
  
  this.keys = [];
  this.dirKeyMap = {};
  this.dirKeyMap[World.sides.left] = [KB.keys.a, KB.keys.q, KB.keys.left];
  this.dirKeyMap[World.sides.top] = [KB.keys.w, KB.keys.z, KB.keys.up];
  this.dirKeyMap[World.sides.right] = [KB.keys.d, KB.keys.right];
  this.dirKeyMap[World.sides.bottom] = [KB.keys.s, KB.keys.down];
  var keyDirMap = {};
  Object.entries(this.dirKeyMap).forEach(function (pair) {
    pair[1].forEach(function (key) {
      keyDirMap[key] = pair[0];
    });
  });
  this.keyDirMap = keyDirMap;
  this.kb = KB(this.keyDown.bind(this), this.keyUp.bind(this));

  this.overlay = new DisplayContainer();
  this.addChild(this.overlay);

  this.overlayBg = new DisplayRect({
    color: '#000000',
    alpha: 0.7,
    w: SETTINGS.width,
    h: SETTINGS.height
  });
  this.overlay.addChild(this.overlayBg);

  this.overlayMessage = new DisplayText({
    text: 'You have ' + this.timeLeft + ' seconds to deliver all the mail!',
    font: '24px Arial',
    color: '#ffffff',
    x: SETTINGS.width / 2,
    y: SETTINGS.height / 2 - 5,
    align: 'center',
    baseline: 'bottom'
  });
  this.overlay.addChild(this.overlayMessage);

  this.overlaySubMessage = new DisplayText({
    text: 'Follow the pointers to go to the rooms that need mail.',
    font: '20px Arial',
    color: '#ffffff',
    x: SETTINGS.width / 2,
    y: SETTINGS.height / 2 + 5,
    align: 'center',
    baseline: 'top'
  });
  this.overlay.addChild(this.overlaySubMessage);

  this.overlaySubMessage2 = new DisplayText({
    text: 'Press any movement keys to start',
    font: '20px Arial',
    color: '#ffffff',
    x: SETTINGS.width / 2,
    y: SETTINGS.height / 2 + 30,
    align: 'center',
    baseline: 'top'
  });
  this.overlay.addChild(this.overlaySubMessage2); 

  this.addSteppable(this.cycle.bind(this));
}
PlayScene.gameStates = {
  tutorial: 1,
  play: 2,
  finished: 3,
  failed: 4
};
PlayScene.prototype = extendPrototype(Scene.prototype, {
  isGameDone: function () {
    return this.gameState === PlayScene.gameStates.finished || this.gameState === PlayScene.gameStates.failed;
  },
  keyDown: function (keyCode) {
    if (!this.keyDirMap[keyCode]) return;
    if (this.isGameDone()) return;
    if (this.gameState === PlayScene.gameStates.tutorial) {
      AnimManager.singleton.add(new Anim({
        object: this.overlay,
        property: 'alpha',
        from: 1,
        to: 0,
        duration: 0.5,
      }));
      this.gameState = PlayScene.gameStates.play;
    }
    this.player.addDirection(this.keyDirMap[keyCode]);
  },
  keyUp: function (keyCode) {
    if (this.isGameDone()) {
      if (this.gameOverTimeLeft <= 0) {
        this.main.setScene(new PlayScene(this.main));
      }
      return;
    }
    if (!this.keyDirMap[keyCode]) return;
    this.player.removeDirection(this.keyDirMap[keyCode]);
  },
  destroy: function () {
    this.kb.destroy();
  },
  cycle: function (dts) {
    this.player.step(dts);
    if (!this.seeWholeWorld) {
      this.world.x = Math.floor(SETTINGS.width / 2 - this.player.x * this.world.scaleX);
      this.world.y = Math.floor(SETTINGS.height / 2 - this.player.y * this.world.scaleY);
    }
    this.updatePointers();
    this.updateEventFeed();
    if (this.gameState === PlayScene.gameStates.play) {
      this.timeLeft -= dts;
      if (this.timeLeft <= 0) {
        this.gameState = PlayScene.gameStates.failed;
        this.player.resetDirection();
        this.gameOver(this.gameState);
      }
      this.timeLeftText.text = 'Time left: ' + Math.ceil(this.timeLeft) + 's';
    } else if (this.isGameDone()) {
      if (this.gameOverTimeLeft > 0) {
        this.gameOverTimeLeft -= dts;
        this.overlaySubMessage.text = 'Continue in ' + Math.ceil(this.gameOverTimeLeft);
      } else {
        this.overlaySubMessage.text = 'Press any movement key to restart';
      }
    }
  },
  updatePointers: function () {
    var i, room, angle, pointer, distance, dx, dy;
    for (i = 0; i < this.mailableRooms.length; i += 1) {
      room = this.mailableRooms[i];
      if (room.needsMail) {
        pointer = this.roomPointerMap[room.id];
        if (this.player.currentRoom !== room) {
          pointer.visible = true;
          dx = room.doorToHallway.x - this.player.x;
          dy = room.doorToHallway.y - this.player.y;
          distance = Math.sqrt(dx * dx + dy * dy);
          angle = Math.atan2(dy, dx);
          pointer.angle = angle;
          pointer.setDistance(distance);
        } else {
          pointer.visible = false;
        }
      }
    }
  },
  updateEventFeed: function () {
    var changed = false, event, i;
    while (this.eventList.length > 0 && this.eventList[0].expiration < this.main.time) {
      event = this.eventList.shift();
      this.eventFeed.removeChild(event.displayItem);
      changed = true;
    }
    if (!changed) { return; }

    for (i = 0; i < this.eventList.length; i += 1) {
      this.eventList[i].displayItem.y = i * 18;
    }
  },
  addEvent: function (msg) {
    var event = {
      displayItem: new DisplayText({
        x: -200,
        y: this.eventList.length * 18,
        alpha: 0,
        text: msg,
        font: '16px Arial',
        color: '#ffffff',
        align: 'left',
        baseline: 'top'
      }),
      expiration: this.main.time + 5000
    };
    this.eventList.push(event);
    this.eventFeed.addChild(event.displayItem);
    var anim = new Anim({
      object: event.displayItem,
      property: 'x',
      from: -200,
      to: 0,
      duration: 1,
      timeFunction: Anim.easingFunctions.easeOutCubic
    });
    AnimManager.singleton.add(anim);
    anim = new Anim({
      object: event.displayItem,
      property: 'alpha',
      from: 0,
      to: 1,
      duration: 0.5
    });
    AnimManager.singleton.add(anim);
  },
  generateMailableDesks: function () {
    // get rooms with desks
    var i;
    var roomPool = this.world.rooms.filter(function (room) {
      return room.furniture &&
        room.furniture.length &&
        room.furniture.some(function (item) {
          return item.type === World.furnitureTypes.desk || item.type === World.furnitureTypes.doubleDesk;
        });
    });

    // at least [minMailableRooms] rooms, at most [maxMailableRoomRate] of the rooms
    var mailableRoomCount = Random.rangeInt(
      SETTINGS.minMailableRooms,
      Math.max(SETTINGS.minMailableRooms + 1, Math.floor(roomPool.length * SETTINGS.maxMailableRoomRate))
    );

    // get random rooms for mailable rooms
    var mailableRooms = [], room, pointer;
    for (i = 0; i < mailableRoomCount; i += 1) {
      room = Random.pickAndRemove(roomPool);
      pointer = createPointer('white');
      this.pointerLayer.addChild(pointer);
      this.roomPointerMap[room.id] = pointer;
      room.needsMail = true;
      mailableRooms.push(room);
    }

    // get mailable desks
    var mailableDesks = mailableRooms.reduce(reduceRoomsToDesks, []);

    // desks from other rooms
    var otherDesks = roomPool.reduce(reduceRoomsToDesks, []);

    // redirect some desks to others
    var missingCount = Random.rangeInt(
      SETTINGS.minMissingPeople,
      SETTINGS.maxMissingPeople + 1
    );
    if (missingCount > mailableDesks.length) {
      missingCount = mailableDesks.length;
    }
    var redirectFrom, redirectTo, redirectedFromDesks = [], redirectedToDesks = [];
    for (i = 0; i < missingCount; i += 1) {
      redirectFrom = Random.pickAndRemove(mailableDesks);
      redirectTo = Random.pickAndRemove(otherDesks);
      redirectFrom.redirectTo = redirectTo.id;
      redirectTo.redirectFrom = redirectFrom.id;
      redirectedFromDesks.push(redirectFrom);
      redirectedToDesks.push(redirectTo);
      redirectFrom.redirectDeskCallback = this.deskNeedsRedirect.bind(this);
      redirectTo.prematureDeliveredCallback = this.deskDeliveredPrematurely.bind(this);
      redirectTo.deliveredCallback = this.deskDelivered.bind(this);
    }

    mailableDesks.forEach(function (desk) {
      desk.deliveredCallback = this.deskDelivered.bind(this);
    }, this);

    mailableDesks.forEach(initMailableDesk);
    redirectedFromDesks.forEach(initMailableDesk);
    redirectedToDesks.forEach(initMailableDesk);

    this.mailableRooms = mailableRooms;
    this.mailableDesks = mailableDesks;
    this.redirectedFromDesks = redirectedFromDesks;
    this.redirectedToDesks = redirectedToDesks;
    this.allMailableDesks = mailableDesks.concat(redirectedToDesks);
    this.mailLeftText.text = 'Mail left: ' + this.allMailableDesks.length;

    // debug
    // this.mailableDesks.forEach(function (desk) {
    //   desk.displayItems.forEach(function (rect) {
    //     rect.color = 'white';
    //   });
    // });
    // this.redirectedFromDesks.forEach(function (desk) {
    //   desk.displayItems.forEach(function (rect) {
    //     rect.color = 'blue';
    //   });
    // });
    // this.redirectedToDesks.forEach(function (desk) {
    //   desk.displayItems.forEach(function (rect) {
    //     rect.color = 'gray';
    //   });
    // });
  },
  deskDelivered: function (desk) {
    var mailLeft = this.allMailableDesks.reduce(function (accumulator, d) {
      return accumulator + (d.needsMail ? 1 : 0);
    }, 0);
    this.mailLeftText.text = 'Mail left: ' + mailLeft;

    if (mailLeft <= 0) {
      this.gameState = PlayScene.gameStates.finished;
      this.player.resetDirection();
      this.gameOver(this.gameState);
    }
  },
  deskNeedsRedirect: function (desk) {

    var toDesk = this.redirectedToDesks.find(function (d) {
      return d.id === desk.redirectTo;
    });
    
    if (!toDesk) { console.log('desk ' + desk.redirectTo + ' not found'); return; } // not found? hehe
    if (!toDesk.needsMail) { return; } // already delivered

    var index = this.mailableRooms.indexOf(toDesk.room);
    if (index !== -1) { return; }

    toDesk.room.needsMail = true;
    toDesk.setHighlight(true);
    this.mailableRooms.push(toDesk.room);
    var pointer = createPointer('blue');
    this.roomPointerMap[toDesk.room.id] = pointer;
    this.pointerLayer.addChild(pointer);
    this.addEvent('404 Employee not found. Moved to another desk');
  },
  deskDeliveredPrematurely: function (desk) {
    var fromDesk = this.redirectedFromDesks.find(function (d) {
      return d.id === desk.redirectFrom;
    });

    if (!fromDesk) { return; }
    if (!fromDesk.needsMail) { return; } // already marked for some reason
    
    fromDesk.mailDelivered(this.player);
    this.addEvent('302 Found new desk of employee, unregistering old desk');
  },
  gameOver: function (gameState) {
    this.overlayMessage.text = gameState === PlayScene.gameStates.finished ? 'Delivered on time!' : 'Too late, offices are open.';
    this.overlaySubMessage2.visible = false;
    
    AnimManager.singleton.add(new Anim({
      object: this.overlay,
      property: 'alpha',
      from: 0,
      to: 1,
      duration: 0.5,
    }));
  }
});

function reduceRoomsToDesks(accumulator, room) {
  return accumulator.concat(room.furniture.filter(function (item) {
    return item.type === World.furnitureTypes.desk || item.type === World.furnitureTypes.doubleDesk;
  }));
}

function initMailableDesk(desk) {
  desk.needsMail = true;
  desk.setHighlight(true);
}

function createPointer(color) {
  var con = new DisplayContainer(),
    graphic = new DisplayPath({
      x: 150,
      y: 0,
      path: [
        { x: 20, y: 0 },
        { x: -15, y: -10 },
        { x: -15, y: 10 }
      ],
      color: color
    });
  con.addChild(graphic);
  con.setDistance = function (d) {
    graphic.x = 10 + ((JMath.clamp(d, 50, 400) - 50) / 350) * 140;
  };
  return con;
}

function MainMenuScene() {
  Scene.apply(this, arguments);

  this.time = 0;
  this.period = 2;
  this.mailTimeMin = 0.5;
  this.mailTimeMax = 1.5;
  this.mailTime = Random.range(this.mailTimeMin, this.mailTimeMax);
  this.mails = [];

  this.scrollingBg = new DisplayRect({
    w: SETTINGS.width,
    h: SETTINGS.height,
    color: Resources.loadedPatterns.hallwayTile,
    fillScaleX: 5,
    fillScaleY: 5
  });
  this.addChild(this.scrollingBg);

  this.mailLayer = new DisplayContainer();
  this.addChild(this.mailLayer);

  this.robot = new DisplayImg({
    img: Resources.loadedImgs.robot,
    x: 170,
    y: SETTINGS.height / 2,
    w: 148,
    h: 154,
    anchorX: 74,
    anchorY: 77
  });
  this.addChild(this.robot);

  var mainTitle = new DisplayText({
    text: 'Employee Not Found',
    font: '32px Arial',
    x: 420,
    y: 100,
    align: 'center',
    baseline: 'middle',
    color: 'white'
  });
  this.addChild(mainTitle);

  var tutorialKeyCon = new DisplayContainer({
    x: 420,
    y: 190
  });
  this.addChild(tutorialKeyCon);

  var tutorialText = new DisplayText({
    text: 'Controls:',
    font: '24px Arial',
    x: 0,
    y: -40,
    align: 'center',
    baseline: 'bottom',
    color: 'white'
  });
  tutorialKeyCon.addChild(tutorialText);

  var tutorialKeys = this.tutorialKeys = [
    new TutorialKey(0, 0, 'W', 0, this.main.animManager),
    new TutorialKey(-45, 45, 'A', 0.125, this.main.animManager),
    new TutorialKey(0, 45, 'S', 0.25, this.main.animManager),
    new TutorialKey(45, 45, 'D', 0.375, this.main.animManager)
  ];

  this.tutorialKeys.forEach(function (key) {
    tutorialKeyCon.addChild(key.displayItem);
    key.start();
  });

  var startText = new DisplayText({
    text: 'Press any of these keys to start',
    font: '18px Arial',
    x: 0,
    y: 70,
    align: 'center',
    baseline: 'top',
    color: 'white'
  });
  tutorialKeyCon.addChild(startText);

  var keySets = [
    ['W', 'A', 'S', 'D'],
    ['↑', '←', '↓', '→'],
    ['Z', 'Q', 'S', 'D']
  ];
  var keySetIndex = 0;

  this.keySetInterval = setInterval(function () {
    keySetIndex += 1;
    if (keySetIndex >= keySets.length) {
      keySetIndex = 0;
    }
    tutorialKeys.forEach(function (key, index) {
      key.keyTopKey.text = keySets[keySetIndex][index];
    });
  }, 1000);

  var startKeys = [
    KB.keys.a, KB.keys.w, KB.keys.s, KB.keys.d,
    KB.keys.q, KB.keys.z,
    KB.keys.left, KB.keys.up, KB.keys.right, KB.keys.down
  ];

  this.kb = KB(function () {

  }, function (keyCode) {
    var start = startKeys.some(function (k) {
      return k === keyCode;
    });
    if (start) {
      this.main.setScene(new PlayScene(this.main));
    }
  }.bind(this));

  this.addSteppable(this.cycle.bind(this));
}

MainMenuScene.prototype = extendPrototype(Scene.prototype, {
  destroy: function () {
    this.tutorialKeys.forEach(function (key) {
      key.stop();
    });
    clearInterval(this.keySetInterval);
    this.kb.destroy();
  },
  cycle: function (dts) {
    this.time += dts;

    var current = this.time % this.period,
      ratio = current / this.period;
    
    this.robot.scaleX = 1 + Math.cos(ratio * Math.PI * 2) * 0.05;
    this.robot.scaleY = 1 + Math.sin(ratio * Math.PI * 2) * 0.05;
    this.scrollingBg.fillOffsetX -= 200 * dts;
    this.mailLayer.x -= 200 * dts;

    var i, mail;
    for (i = 0; i < this.mails.length; i += 1) {
      mail = this.mails[i];
      if (mail.x + this.mailLayer.x < -200) {
        this.mailLayer.removeChild(mail);
        this.mails.splice(i, 1);
        i -= 1;
      }
    }

    this.mailTime -= dts;
    if (this.mailTime <= 0) {
      mail = new Mail({
        x: -this.mailLayer.x + this.robot.x,
        y: this.robot.y,
        scaleX: 4,
        scaleY: 4,
        angle: Random.range(0, Math.PI * 2)
      });
      this.mails.push(mail);
      this.mailLayer.addChild(mail);

      this.mailTime = Random.range(this.mailTimeMin, this.mailTimeMax);
    }
  }
});

function PreloadScene() {
  Scene.apply(this, arguments);
  this.imgs = [];
  this.finished = false;
  this.progressText = new DisplayText({
    x: SETTINGS.width / 2,
    y: SETTINGS.height / 2,
    text: '0%',
    color: 'black',
    align: 'center',
    baseline: 'middle',
    font: '32px Arial'
  });

  // bg
  this.addChild(new DisplayRect({
    w: SETTINGS.width,
    h: SETTINGS.height,
    color: '#777777'
  }))
  this.addChild(this.progressText);
}
PreloadScene.prototype = extendPrototype(Scene.prototype, {
  create: function () {
    Object.entries(Resources.imgs).forEach(function (entry) {
      var img = new Image();
      img.onload = this.onImgLoad.bind(this);
      img.src = entry[1];
      this.imgs.push(img);
      Resources.loadedImgs[entry[0]] = img;
    }, this);
  },
  onImgLoad: function (e) { 
    if (this.finished) return;
    var loaded = this.imgs.reduce(function (imgsLoaded, img) {
      return (img.complete ? 1 : 0) + (imgsLoaded || 0);
    }, 0);

    this.progressText.text = Math.floor(loaded / this.imgs.length * 100) + '%';

    if (loaded >= this.imgs.length) {
      this.finish();
    }
  },
  finish: function () {
    if (this.finished) return;

    // create patterns
    Object.entries(Resources.patterns).forEach(function (entry) {
      Resources.loadedPatterns[entry[0]] = this.main.context.createPattern(
        Resources.loadedImgs[entry[0]],
        entry[1]
      );
    }, this);

    this.finished = true;
    this.main.setScene(new MainMenuScene(this.main));
  }
});

function Main(){
  this.step = this.step.bind(this);
  this.root = DOM.get('root');
  var canvas = DOM.create('canvas');
  canvas.width = SETTINGS.width;
  canvas.height = SETTINGS.height;
  this.root.appendChild(canvas);
  this.resources = Resources;
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.context.font = '16px Arial'; // global font
  this.animManager = new AnimManager();
  AnimManager.singleton = this.animManager;
  this.scene = new PreloadScene(this);
  this.time = 0;
  
  this.resize = this.resize.bind(this);
  window.addEventListener('resize', this.onWindowResize.bind(this), false);
  this.onWindowResize();
  
  this.step(0);
  this.scene.create();
}
Main.prototype = {
  onWindowResize: function () {
    this.resize();
    setTimeout(function () {
      this.resize();
    }.bind(this), 100);
  },
  resize: function () {
    var computedStyle = window.getComputedStyle(DOM.get('root')),
      viewWidth = parseInt(computedStyle.width, 10),
      viewHeight = parseInt(computedStyle.height, 10),
      canvasAspectRatio = this.canvas.width / this.canvas.height,
      viewAspectRatio = viewWidth / viewHeight,
      useWidth,
      useHeight;
    
    if (canvasAspectRatio > viewAspectRatio) {
      // canvas aspect ratio is wider than view's aspect ratio
      useWidth = viewWidth;
      useHeight = useWidth / canvasAspectRatio;
    } else {
      // canvas aspect ratio is taller than view's aspect ratio
      useHeight = viewHeight;
      useWidth = useHeight * canvasAspectRatio;
    }
    
    this.canvas.style.width = Math.floor(useWidth) + 'px';
    this.canvas.style.height = Math.floor(useHeight) + 'px';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.marginLeft = Math.floor(-useWidth / 2) + 'px';
    this.canvas.style.marginTop = Math.floor(-useHeight / 2) + 'px';
  },
  setScene: function (scene) {
    if (this.scene) {
      this.scene.destroy();
    }
    this.scene = scene;
    scene.create();
  },
  step: function (time) {
    var dts = (time - this.time) / 1000.0;
    if (dts > 0) {
      if (dts > 0.2) {
        dts = 0.2;
      }
      this.scene.step(dts);
      this.scene._render(this.context);
      this.animManager.step(dts);
      this.time = time;
    }
    requestAnimationFrame(this.step);
  }
};

window.game = new Main();
