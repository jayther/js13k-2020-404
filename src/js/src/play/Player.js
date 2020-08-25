function Player(scene, settings) {
  DisplayContainer.call(this, settings);
  this.scene = scene;
  var s = extend({
    world: null
  }, settings || {});
  this.aabb = new AABB(0, 0, 10, 10);
  this.prevAabb = new AABB(0, 0, 10, 10);
  this.speed = 200;
  this.vel = {
    x: 0,
    y: 0
  };
  this.prevVel = {
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
    var cells, i, cell, collisionTime = 1;

    if (this.vel.x || this.vel.y) {
      this.img.angle = JMath.angleFromVec(this.vel);
    }

    cell = this.world.getCellFromPos(this.x, this.y);

    // collide with furniture
    if (this.collideWithFurniture) {
      if (cell && cell.room) {
        if (cell.room.collisionAabbs) {
          this.prevVel.x = this.vel.x;
          this.prevVel.y = this.vel.y;
          var aabbs = cell.room.collisionAabbs;
          for (i = 0; i < aabbs.length; i += 1) {
            // collide with collisionAAbbs
            collisionTime = this.maybeSweptCollideWith(aabbs[i], dts);
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
    if (collisionTime < 1) {
      this.x += this.prevVel.x * dts * collisionTime;
      this.y += this.prevVel.y * dts * collisionTime;
    }
    this.x += this.vel.x * dts;
    this.y += this.vel.y * dts;
    this.updateAABB();
    if (collisionTime < 1) {
      this.vel.x = this.prevVel.x;
      this.vel.y = this.prevVel.y;
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
  maybeSweptCollideWith(aabb, dts) {
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
      xEntry = -Infinity;
      xExit = Infinity;
    } else {
      xEntry = xInvEntry / (this.vel.x * dts);
      xExit = xInvExit / (this.vel.x * dts);
    }

    if (this.vel.y === 0) {
      yEntry = -Infinity;
      yExit = Infinity;
    } else {
      yEntry = yInvEntry / (this.vel.y * dts);
      yExit = yInvExit / (this.vel.y * dts);
    }

    var entryTime = Math.max(xEntry, yEntry),
      exitTime = Math.min(xExit, yExit);
    
    if (entryTime > exitTime || xEntry < 0 && yEntry < 0 || xEntry > 1 || yEntry > 1) {
      return 1;
    }

    // normals
    var normalX, normalY,
      remainingTime = 1 - entryTime;
    if (xEntry > yEntry) {
      normalX = xInvEntry < 0 ? 1 : -1;
      normalY = 0;
    } else {
      normalX = 0;
      normalY = yInvEntry < 0 ? 1 : -1;
    }

    // slide
    var dotProd = (this.vel.x * normalY + this.vel.y * normalX) * remainingTime;
    this.vel.x = dotProd * normalY;
    this.vel.y = dotProd * normalX;

    return entryTime;
  }
});
