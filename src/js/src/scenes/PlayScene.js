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
