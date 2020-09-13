
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
