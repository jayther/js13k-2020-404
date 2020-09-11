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
  
  var player = this.player = new Player(this, {
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
  keyDown: function (keyCode) {
    if (!this.keyDirMap[keyCode]) return;
    this.player.addDirection(this.keyDirMap[keyCode]);
  },
  keyUp: function (keyCode) {
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
      redirectTo.deliveredCallback = this.deskDelivered.bind(this);
    }

    mailableDesks.forEach(initMailableDesk);
    redirectedFromDesks.forEach(initMailableDesk);
    redirectedToDesks.forEach(initMailableDesk);

    mailableDesks.forEach(function (desk) {
      desk.deliveredCallback = this.deskDelivered.bind(this);
    }, this);

    this.mailableRooms = mailableRooms;
    this.mailableDesks = mailableDesks;
    this.redirectedFromDesks = redirectedFromDesks;
    this.redirectedToDesks = redirectedToDesks;
    this.allMailableDesks = mailableDesks.concat(redirectedToDesks);
    this.mailLeftText.text = 'Mail left: ' + this.allMailableDesks.length;

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
  deskDelivered: function (desk) {
    console.log('delivered to', desk.id);
    var mailLeft = this.allMailableDesks.reduce(function (accumulator, d) {
      return accumulator + (d.needsMail ? 1 : 0);
    }, 0);
    this.mailLeftText.text = 'Mail left: ' + mailLeft;

    if (mailLeft <= 0) {
      console.log('finished!');
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
