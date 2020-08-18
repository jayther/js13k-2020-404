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
  
  var seeWholeWorld = false;
  if (seeWholeWorld) {
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
  
  var speed = 200;
  
  var player = this.player = new Player(this, {
    world: this.world
  });
  this.world.addChild(this.player);
  
  var room = this.world.startingRoom;
  this.player.x = (room.left + room.right) / 2 * this.world.cellSize;
  this.player.y = (room.top + room.bottom) / 2 * this.world.cellSize;
  this.player.updateAABB();
  
  var vel = this.player.vel;
  this.keys = [];
  this.aKey = KB(KB.keys.a, function () {
    vel.x += -speed;
  }, function () {
    vel.x -= -speed;
  });
  this.keys.push(this.aKey);
  this.sKey = KB(KB.keys.s, function () {
    vel.y += speed;
  }, function () {
    vel.y -= speed;
  });
  this.keys.push(this.sKey);
  this.dKey = KB(KB.keys.d, function () {
    vel.x += speed;
  }, function () {
    vel.x -= speed;
  });
  this.keys.push(this.dKey);
  this.wKey = KB(KB.keys.w, function () {
    vel.y += -speed;
  }, function () {
    vel.y -= -speed;
  });
  this.keys.push(this.wKey);
  
  this.addSteppable(this.player.step.bind(this.player));
  if (!seeWholeWorld) {
    this.addSteppable(function (dts) {
      this.world.x = Math.floor(SETTINGS.width / 2 - player.x * this.world.scaleX);
      this.world.y = Math.floor(SETTINGS.height / 2 - player.y * this.world.scaleY);
      var i, room, roomX, roomY, angle, pointer;
      for (i = 0; i < this.mailableRooms.length; i += 1) {
        room = this.mailableRooms[i];
        pointer = this.roomPointerMap[room.id];
        if (player.currentRoom !== room) {
          pointer.visible = true;
          roomX = (room.left + room.right) / 2 * this.world.cellSize;
          roomY = (room.top + room.bottom) / 2 * this.world.cellSize;
          angle = Math.atan2(roomY - player.y, roomX - player.x);
          pointer.angle = angle;
        } else {
          pointer.visible = false;
        }
      }
    }.bind(this));
  }
}
PlayScene.prototype = extendPrototype(Scene.prototype, {
  destroy: function () {
    this.keys.forEach(function (key) {
      key.destroy();
    });
  },
  generateMailableDesks: function () {
    // get rooms with desks
    var i;
    var roomPool = this.world.rooms.filter(function (room) {
      return room.furniture &&
        room.furniture.length &&
        room.furniture.some(function (item) {
          return item.type === World.furnitureTypes.desk;
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
      desk.displayRect.color = 'white';
    });
    this.redirectedFromDesks.forEach(function (desk) {
      desk.displayRect.color = 'blue';
    });
    this.redirectedToDesks.forEach(function (desk) {
      desk.displayRect.color = 'gray';
    });
  },
  mailDelivered: function (desk) {
    desk.displayRect.color = 'red';
    var envelope = new DisplayRect({
      x: this.player.x,
      y: this.player.y,
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
      from: this.player.x,
      to: desk.aabb.x,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic
    });
    var animY = new Anim({
      object: envelope,
      property: 'y',
      from: this.player.y,
      to: desk.aabb.y,
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
    this.main.animManager.add(animX);
    this.main.animManager.add(animY);
    this.main.animManager.add(animAngle);
  }
});

function reduceRoomsToDesks(accumulator, room) {
  return accumulator.concat(room.furniture.filter(function (item) {
    return item.type == World.furnitureTypes.desk;
  }));
}

function initMailableDesk(desk) {
  desk.needsMail = true;
  var mailAabb = desk.aabb.copy();
  mailAabb.grow(5);
  desk.mailAabb = mailAabb;
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
