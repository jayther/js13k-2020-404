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
