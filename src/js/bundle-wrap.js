(function(window,document){
    var SETTINGS = {"title":"Mail Delivery","width":640,"height":360,"minMailableRooms":2,"maxMailableRoomRate":0.25,"minMissingPeople":5,"maxMissingPeople":10};
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

function KB(keyCode, press, release) {
  var key = {
    code: keyCode,
    isDown: false,
    press: press,
    release: release
  };
  key.downHandler = function (e) {
    if (e.keyCode === key.code) {
      if (!key.isDown && key.press) {
        key.press();
      }
      key.isDown = true;
    }
    e.preventDefault();
  };
  key.upHandler = function (e) {
    if (e.keyCode === key.code) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
    }
    e.preventDefault();
  };
  key.destroy = function () {
    window.removeEventListener('keydown', key.downHandler, false);
    window.removeEventListener('keyup', key.upHandler, false);
  };
  window.addEventListener('keydown', key.downHandler, false);
  window.addEventListener('keyup', key.upHandler, false);
  
  return key;
}

KB.keys = {
  a: 65,
  w: 87,
  s: 83,
  d: 68,
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
  }
};

var JMath = {
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
AABB.prototype.toRect = function () {
  return {
    left: this.x - this.hw,
    top: this.y - this.hh,
    right: this.x + this.hw,
    bottom: this.y + this.hh
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
    onEnd: null
  }, settings || {});
  this.startTime = -1;
  this.endTime = -1;
  this.cancelled = false;
}
Anim.easingFunctions = {
  linear: function (t) { return t; },
  easeInQuad: function (t) { return t*t; },
  easeOutQuad: function (t) { return t*(2-t); },
  easeInOutQuad: function (t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; },
  easeInCubic: function (t) { return t*t*t; },
  easeOutCubic: function (t) { return (--t)*t*t+1; },
  easeInOutCubic: function (t) { return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
  easeInQuart: function (t) { return t*t*t*t; },
  easeOutQuart: function (t) { return 1-(--t)*t*t*t; },
  easeInOutQuart: function (t) { return t<0.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
  easeInQuint: function (t) { return t*t*t*t*t; },
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t; },
  easeInOutQuint: function (t) { return t<0.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
};
Anim.prototype = {
  start: function (startTime) {
    this.startTime = startTime;
    this.endTime = startTime + this.settings.duration;
  },
  step: function (time) {
    if (this.settings.object && this.settings.property) {
      var timeRatio = (time - this.startTime) / this.settings.duration;
      if (timeRatio > 1) {
        timeRatio = 1;
      }
      var ratio = this.settings.timeFunction(timeRatio);
      var adjusted = this.settings.from + (this.settings.to - this.settings.from) * ratio;
      this.settings.object[this.settings.property] = adjusted;
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
        context.translate(-this.anchorX / this.scaleX, -this.anchorY / this.scaleY);
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
  this.redirectFrom = -1;
  this.world = null;
  this.scene = null;
  this.redirectDeskCallback = null;
  this.prematureDeliveredCallback = null;
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
    if (this.redirectTo === -1) {
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
      if (this.redirectFrom !== -1 && this.prematureDeliveredCallback) {
        this.prematureDeliveredCallback(this);
      }
    } else if (this.redirectDeskCallback) {
      this.redirectDeskCallback(this);
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
  lobby: 2,
  officeBullpen: 3,
  officePrivate: 4,
  officeOpen: 5
};
World.furnitureTypes = {
  desk: 1,
  doubleDesk: 2,
  chair: 3,
  invisible: 4
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

World.mailAabbPadding = 5;

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
        var found = false;
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
          doorWallFlags = World.sides.bottom;
        }
        this.setPos(x, y, World.cellTypes.door);
        this.setPos(x2, y2, World.cellTypes.door);
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
      if (a >= 100 && (this.lobbies.length === 0 || Math.random() < 0.1)) { // lesser chance for lobby
        roomTypePool.push(World.roomTypes.lobby);
      }
      room.type = Random.pick(roomTypePool);
      if (room.type === World.roomTypes.lobby) {
        this.lobbies.push(room);
      }
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

    if (room.type === World.roomTypes.officeOpen) {
      collisionDesksPair = this.generateOpenOffice(bounds);
    } else if (room.type === World.roomTypes.officePrivate) {
      collisionDesksPair = this.generatePrivateOffice(bounds, room);
    }

    if (collisionDesksPair) {
      room.collisionAabbs = collisionDesksPair[0];
      room.furniture = collisionDesksPair[1];
    }

    // debug placeable area
    var boundRect = new DisplayRect({
      x: bounds.left,
      y: bounds.top,
      w: bounds.right - bounds.left,
      h: bounds.bottom - bounds.top,
      color: '#007700'
    });
    this.addChild(boundRect);

    room.furniture.forEach(function (desk) {
      desk.room = room;
      desk.displayItems.forEach(function (item) {
        this.addChild(item);
      }, this);
    }, this);

    var x = (room.left + room.right) / 2 * this.cellSize,
      y = (room.top + room.bottom) / 2 * this.cellSize,
      labelMap = ['Unknown', 'Mailroom', 'Lobby', 'Bullpen', 'Private', 'Open'],
      label = labelMap[room.type];

    var displayText = new DisplayText({
      text: label,
      x: x,
      y: y,
      align: 'center',
      baseline: 'middle',
      font: '36px Arial'
    });
    this.addChild(displayText);
  },
  generateOpenOffice: function (bounds, room) {
    var i;
    var boundsWidth = bounds.right - bounds.left,
      boundsHeight = bounds.bottom - bounds.top;
    
    var collisionAabbs = [], furniture = [];
    var pair, deskSettings = Random.pick([
      World.openDesk,
      World.openDeskDouble
    ]);
    var deskSpacing = 50, deskInterval = deskSettings.depth + deskSpacing;
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
      while (deskY + deskHalfWidth < bounds.bottom) {
        for (i = 0; i < maxDesks; i += 1) {
          deskX = bounds.left + i * deskInterval + facing * (deskSettings.depth + chairHalfSize) + deskFrontOffset;
          pair = this.createDesk(deskX, deskY, facing ? World.sides.right : World.sides.left, deskSettings);
          collisionAabbs = collisionAabbs.concat(pair[0]);
          furniture = furniture.concat(pair[1]);
        }
        deskY += deskSpacing + deskSettings.width;
      }
      var topMost = null, bottomMost = null;
      collisionAabbs.forEach(function (item) {
        if (!topMost || item.y < topMost.y) {
          topMost = item;
        }
        if (!bottomMost || item.y > bottomMost.y) {
          bottomMost = item;
        }
      });
      deskSideOffset = Math.random() * (boundsHeight - ((bottomMost.y + bottomMost.hh) - (topMost.y - topMost.hh)));
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
      // desks are horizontal
      // facing: 0 == facing top, 1 == facing bottom
      maxDesks = Math.floor(boundsHeight / deskInterval);
      deskFrontOffset = Math.random() * (boundsHeight - maxDesks * deskInterval);
      deskX = bounds.left + deskHalfWidth;
      while (deskX + deskHalfWidth < bounds.right) {
        for (i = 0; i < maxDesks; i += 1) {
          deskY = bounds.top + i * deskInterval + facing * (deskSettings.depth + chairHalfSize) + deskFrontOffset;
          pair = this.createDesk(deskX, deskY, facing ? World.sides.bottom : World.sides.top, deskSettings);
          collisionAabbs = collisionAabbs.concat(pair[0]);
          furniture = furniture.concat(pair[1]);
        }
        deskX += deskSpacing + deskSettings.width;
      }
      var leftMost = null, rightMost = null;
      collisionAabbs.forEach(function (item) {
        if (!leftMost || item.x < leftMost.x) {
          leftMost = item;
        }
        if (!rightMost || item.x > rightMost.x) {
          rightMost = item;
        }
      });
      deskSideOffset = Math.random() * (boundsWidth - ((rightMost.x + rightMost.hw) - (leftMost.x - leftMost.hw)));
      collisionAabbs.forEach(function (aabb) {
        aabb.x += deskSideOffset;
      });
      furniture.forEach(function (item) {
        item.displayItems.forEach(function (di) {
          di.x += deskSideOffset;
        });
        item.mailAabb.x += deskSideOffset;
      });
    }

    return [collisionAabbs, furniture];
  },
  generatePrivateOffice: function (bounds, room) {
    var boundsWidth = bounds.right - bounds.left,
      boundsHeight = bounds.bottom - bounds.top,
      facing = 0, i, f, pool = [];

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

    var deskSettings = World.privateDesk,
      fullDepth = deskSettings.depth + deskSettings.chairSize / 2,
      halfWidth = deskSettings.width / 2,
      tolerance = fullDepth + deskSettings.spacing,
      x, y, lower, upper;

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
  createCell: function (x, y, type, room) {
    var color = null,
      aabb = null,
      halfSize = this.cellSize / 2,
      item = null,
      passable = true;
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
      color = '#00aa00';
      passable = true;
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
        color: color 
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
    anchorX: 10,
    anchorY: 10
  });
  this.addChild(img);
  this.img = img;
  this.collideWithWalls = true;
  this.collideWithFurniture = true;
  this.moveDirection = 0;
  // var rect = this.rect = new DisplayRect({
  //   x: -5,
  //   y: -5,
  //   w: 10,
  //   h: 10,
  //   color: 'blue'
  // });
  // this.addChild(rect);
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
    var cells, i, cell, ct, collisionTime = 1, normalX = 0, normalY = 0;

    if (this.vel.x || this.vel.y) {
      this.img.angle = JMath.angleFromVec(this.vel);
    }

    cell = this.world.getCellFromPos(this.x, this.y);

    this.updateVel();

    // collide with furniture
    if (this.collideWithFurniture) {
      if (cell && cell.room) {
        if (cell.room.collisionAabbs) {
          var aabbs = cell.room.collisionAabbs;
          this.calculateSweptBroadphase(dts);
          for (i = 0; i < aabbs.length; i += 1) {
            // collide with collisionAAbbs
            ct = this.maybeSweptCollideWith(aabbs[i], dts);
            if (ct < collisionTime) {
              collisionTime = ct;
              normalX = this.normal.x;
              normalY = this.normal.y;
            }
          }
        }
        if (cell.room.furniture) {
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
      }
    }
    this.x += this.vel.x * dts * collisionTime;
    this.y += this.vel.y * dts * collisionTime;
    if (collisionTime < 1) {
      var dotProd = (this.vel.x * normalY + this.vel.y * normalX) * (1 - collisionTime);
      this.x += dotProd * normalY * dts;
      this.y += dotProd * normalX * dts;
    }
    this.updateAABB();
    
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
      xEntry = xInvEntry / (this.vel.x * dts);
      xExit = xInvExit / (this.vel.x * dts);
    }

    if (this.vel.y === 0) {
      yEntry = -Number.MAX_VALUE;
      yExit = Number.MAX_VALUE;
    } else {
      yEntry = yInvEntry / (this.vel.y * dts);
      yExit = yInvExit / (this.vel.y * dts);
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
    var dx = this.vel.x * dts, dy = this.vel.y * dts;
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

  this.generateMailableDesks();
  
  this.seeWholeWorld = true;
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
  
  var player = this.player = new Player(this, {
    world: this.world
  });
  this.world.addChild(this.player);
  
  var room = this.world.startingRoom;
  this.player.x = (room.left + room.right) / 2 * this.world.cellSize;
  this.player.y = (room.top + room.bottom) / 2 * this.world.cellSize;
  this.player.updateAABB();
  
  this.keys = [];
  this.aKey = KB(KB.keys.a, function () {
    player.addDirection(World.sides.left);
  }, function () {
    player.removeDirection(World.sides.left);
  });
  this.keys.push(this.aKey);
  this.sKey = KB(KB.keys.s, function () {
    player.addDirection(World.sides.bottom);
  }, function () {
    player.removeDirection(World.sides.bottom);
  });
  this.keys.push(this.sKey);
  this.dKey = KB(KB.keys.d, function () {
    player.addDirection(World.sides.right);
  }, function () {
    player.removeDirection(World.sides.right);
  });
  this.keys.push(this.dKey);
  this.wKey = KB(KB.keys.w, function () {
    player.addDirection(World.sides.top);
  }, function () {
    player.removeDirection(World.sides.top);
  });
  this.keys.push(this.wKey);

  // this.addChild(new DisplayImg({
  //   img: Resources.loadedImgs.roomTile,
  //   x: SETTINGS.width / 2 - 70,
  //   y: SETTINGS.height / 2 - 70,
  //   w: 140,
  //   h: 140
  // }));

  // this.addChild(new DisplayRect({
  //   x: 10,
  //   y: 10,
  //   w: 100,
  //   h: 100,
  //   rounded: 20,
  //   color: '#ffffff'
  // }));

  var debugColls = false;

  if (debugColls) {
    var debugBpRect = new DisplayRect({
      x: 0, y: 0,
      w: 10, h: 10,
      color: '#ff0000',
      alpha: 0.8
    });
    this.world.addChild(debugBpRect);
    var bp = player.broadphase;

    this.world.rooms.forEach(function (room) {
      room.collisionAabbs.forEach(function (aabb) {
        var rect = new DisplayRect({
          x: aabb.x - aabb.hw,
          y: aabb.y - aabb.hh,
          w: aabb.hw * 2,
          h: aabb.hh * 2,
          color: '#ff0000',
          alpha: 0.8
        });
        this.world.addChild(rect);
      }, this);
    }, this);
  }
  
  this.addSteppable(this.cycle.bind(this));

  if (debugColls) {
    this.addSteppable(function () {
      debugBpRect.x = bp.x - bp.hw;
      debugBpRect.y = bp.y - bp.hh;
      debugBpRect.w = bp.hw * 2;
      debugBpRect.h = bp.hh * 2;
    });
  }
}
PlayScene.prototype = extendPrototype(Scene.prototype, {
  destroy: function () {
    this.keys.forEach(function (key) {
      key.destroy();
    });
  },
  cycle: function (dts) {
    this.player.step(dts);
    if (!this.seeWholeWorld) {
      this.world.x = Math.floor(SETTINGS.width / 2 - this.player.x * this.world.scaleX);
      this.world.y = Math.floor(SETTINGS.height / 2 - this.player.y * this.world.scaleY);
    }
    this.updatePointers();
  },
  updatePointers: function () {
    var i, room, roomX, roomY, angle, pointer;
    for (i = 0; i < this.mailableRooms.length; i += 1) {
      room = this.mailableRooms[i];
      if (room.needsMail) {
        pointer = this.roomPointerMap[room.id];
        if (this.player.currentRoom !== room) {
          pointer.visible = true;
          roomX = (room.left + room.right) / 2 * this.world.cellSize;
          roomY = (room.top + room.bottom) / 2 * this.world.cellSize;
          angle = Math.atan2(roomY - this.player.y, roomX - this.player.x);
          pointer.angle = angle;
        } else {
          pointer.visible = false;
        }
      }
    }
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
    }

    mailableDesks.forEach(initMailableDesk);
    redirectedFromDesks.forEach(initMailableDesk);
    redirectedToDesks.forEach(initMailableDesk);

    this.mailableRooms = mailableRooms;
    this.mailableDesks = mailableDesks;
    this.redirectedFromDesks = redirectedFromDesks;
    this.redirectedToDesks = redirectedToDesks;

    // debug
    this.mailableDesks.forEach(function (desk) {
      desk.displayItems.forEach(function (rect) {
        rect.color = 'white';
      });
    });
    this.redirectedFromDesks.forEach(function (desk) {
      desk.displayItems.forEach(function (rect) {
        rect.color = 'blue';
      });
    });
    this.redirectedToDesks.forEach(function (desk) {
      desk.displayItems.forEach(function (rect) {
        rect.color = 'gray';
      });
    });
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
    this.mailableRooms.push(toDesk.room);
    var pointer = createPointer('blue');
    this.roomPointerMap[toDesk.room.id] = pointer;
    this.pointerLayer.addChild(pointer);
  },
  deskDeliveredPrematurely: function (desk) {
    var fromDesk = this.redirectedFromDesks.find(function (d) {
      return d.id === desk.redirectFrom;
    });

    if (!fromDesk) { return; }
    if (!fromDesk.needsMail) { return; } // already marked for some reason
    
    fromDesk.mailDelivered(this.player);
  }
});

function reduceRoomsToDesks(accumulator, room) {
  return accumulator.concat(room.furniture.filter(function (item) {
    return item.type === World.furnitureTypes.desk || item.type === World.furnitureTypes.doubleDesk;
  }));
}

function initMailableDesk(desk) {
  desk.needsMail = true;
}

function createPointer(color) {
  var con = new DisplayContainer();
  con.addChild(
    new DisplayPath({
      x: 150,
      y: 0,
      path: [
        { x: 20, y: 0 },
        { x: -15, y: -10 },
        { x: -15, y: 10 }
      ],
      color: color
    })
  );
  return con;
}

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
  var inc = 0;

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
    this.main.setScene(new PlayScene(this.main));
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

}(window, document));
