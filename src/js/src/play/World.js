
function World() {
  DisplayContainer.apply(this, arguments);
  this.grid = {};
  this.cellSize = 20;
  this.hallwayMinChunkArea = 1000;
  this.hallwayMinChunkWidth = 20;
  this.hallwayMinChunkHeight = 20;
  this.minChunkArea = 100;
  this.minChunkWidth = 10;
  this.minChunkHeight = 10;
  this.hallwaySize = 2;
  this.gridWidth = 0;
  this.gridHeight = 0;
  this.rooms = [];
  this.hallways = [];
  this.startingRoom = null;
  this.lobbies = [];
  
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
World.sides = {
  right: 1,
  bottom: 2,
  left: 4,
  top: 8
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
      color: '#000000'
    }));
    
    // hallway floor
    this.bg.addChild(new DisplayRect({
      x: 1 * this.cellSize,
      y: 1 * this.cellSize,
      w: (w - 2) * this.cellSize,
      h: (h - 2) * this.cellSize,
      color: '#656565'
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
        color: '#000000'
      }));
      
      // room floor graphic
      this.bg.addChild(new DisplayRect({
        x: chunk.left * this.cellSize,
        y: chunk.top * this.cellSize,
        w: (chunk.right - chunk.left) * this.cellSize,
        h: (chunk.bottom - chunk.top) * this.cellSize,
        color: '#999999'
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
      // set room cells as room ground
      for (x = chunk.left; x < chunk.right; x += 1) {
        for (y = chunk.top; y < chunk.bottom; y += 1) {
          this.setPos(x, y, World.cellTypes.roomGround, chunk);
        }
      }
      // add to islandRooms
      chunk.connected = false;
      islandRooms.push(chunk);
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
        // keep track of where doors are
        // if (!chunk.doors) {
        //   chunk.doors = [];
        // }
        // if (!chunkA.doors) {
        //   chunkA.doors = [];
        // }
        // chunk.doors.push(this.getCell(x, y));
        // chunk.doors.push(this.getCell(x2, y2));
        // chunkA.doors.push(this.getCell(x, y));
        // chunkA.doors.push(this.getCell(x2, y2));
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
    var fog;
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
    room.furniture = [];
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
      if (a >= 90) {
        roomTypePool.push(World.roomTypes.officeOpen);
      }
      if (a < 90) {
        roomTypePool.push(World.roomTypes.officePrivate);
      }
      if (a >= 90 && (this.lobbies.length === 0 || Math.random() < 0.1)) { // lesser chance for lobby
        roomTypePool.push(World.roomTypes.lobby);
      }
      room.type = Random.pick(roomTypePool);
      room.furniture = [];
      if (room.type === World.roomTypes.lobby) {
        this.lobbies.push(room);
      }
      this.generateRoomLayout(room);
    }
  },
  generateRoomLayout: function (room) {
    // TODO
    // using pixel units
    var i, j;
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
    var boundsWidth = bounds.right - bounds.left,
      boundsHeight = bounds.bottom - bounds.top;
    
    var desks = [];

    // Open offices
    if (room.type === World.roomTypes.officeOpen) {
      var deskWidth = 40, deskDepth = 20, deskSpacing = 40, deskInterval = deskDepth + deskSpacing;
      var deskX, deskY;
      var maxDesks, offset = 0, facing = Random.rangeInt(0, 2);
      var desksPerGroup = Random.rangeInt(1, 3);
      var currentDeskInGroup = Random.rangeInt(0, desksPerGroup);
      if (boundsWidth > boundsHeight) {
        // desks are vertical
        maxDesks = Math.floor(boundsWidth / deskInterval);
        offset = Math.random() * (boundsWidth - maxDesks * deskInterval);
        deskY = bounds.top;
        while (deskY + deskWidth < bounds.bottom) {
          for (i = 0; i < maxDesks; i += 1) {
            deskX = bounds.left + i * deskInterval + facing * deskDepth + offset;
            desks.push({
              left: deskX,
              top: deskY,
              right: deskX + deskDepth,
              bottom: deskY + deskWidth
            });
          }
          currentDeskInGroup += 1;
          if (currentDeskInGroup >= desksPerGroup) {
            currentDeskInGroup = 0;
            deskY += deskSpacing + deskWidth;
          } else {
            deskY += deskWidth;
          }
        }
      } else {
        // desks are horizontal
        maxDesks = Math.floor(boundsHeight / deskInterval);
        offset = Math.random() * (boundsHeight - maxDesks * deskInterval);
        deskX = bounds.left;
        while (deskX + deskWidth < bounds.right) {
          for (i = 0; i < maxDesks; i += 1) {
            deskY = bounds.top + i * deskInterval + facing * deskDepth + offset;
            desks.push({
              left: deskX,
              top: deskY,
              right: deskX + deskWidth,
              bottom: deskY + deskDepth
            });
          }
          currentDeskInGroup += 1;
          if (currentDeskInGroup >= desksPerGroup) {
            currentDeskInGroup = 0;
            deskX += deskSpacing + deskWidth;
          } else {
            deskX += deskWidth;
          }
        }
      }
    }

    var boundRect = new DisplayRect({
      x: bounds.left,
      y: bounds.top,
      w: boundsWidth,
      h: boundsHeight,
      color: '#007700'
    });
    this.addChild(boundRect);

    // place desks
    desks.forEach(function (desk) {
      var rect = new DisplayRect({
        x: desk.left,
        y: desk.top,
        w: desk.right - desk.left,
        h: desk.bottom - desk.top,
        color: '#990000'
      });
      this.addChild(rect);
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
