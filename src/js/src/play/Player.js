function Player(scene, settings) {
  DisplayContainer.call(this, settings);
  this.scene = scene;
  var s = extend({
    world: null
  }, settings || {});
  this.aabb = new AABB(0, 0, 10, 10);
  this.vel = {
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
  updateAABB: function () {
    this.aabb.set(this.x, this.y);
  },
  step: function (dts) {
    if (this.vel.x || this.vel.y) {
      this.img.angle = JMath.angleFromVec(this.vel);
    }
    this.x += this.vel.x * dts;
    this.y += this.vel.y * dts;
    this.updateAABB();
    
    // player collision with cells
    if (this.collideWithWalls) {
      var cells = this.world.getCellsAroundPos(this.x, this.y), i, cell;
      var relX, relY;
      for (i = 0; i < cells.length; i += 1) {
        cell = cells[i];
        if (!cell.passable && cell.aabb && cell.aabb.intersectsWith(this.aabb)) {
          relX = this.aabb.x - cell.aabb.x;
          relY = this.aabb.y - cell.aabb.y;
          if (Math.abs(relX) > Math.abs(relY)) {
            if (relX > 0) {
              this.x = cell.aabb.getRight() + this.aabb.hw;
            } else {
              this.x = cell.aabb.getLeft() - this.aabb.hw;
            }
          } else {
            if (relY > 0) {
              this.y = cell.aabb.getBottom() + this.aabb.hh;
            } else {
              this.y = cell.aabb.getTop() - this.aabb.hh;
            }
          }
          this.updateAABB();
        }
      }
    }

    cell = this.world.getCellFromPos(this.x, this.y);

    // collide with furniture
    if (this.collideWithFurniture) {
      if (cell && cell.room && cell.room.furniture) {
        var furniture = cell.room.furniture, aabb;
        for (i = 0; i < furniture.length; i += 1) {
          // mail time
          if (furniture[i].type === World.furnitureTypes.desk) {
            var desk = furniture[i];
            if (desk.needsMail && desk.mailAabb.intersectsWith(this.aabb)) {
              desk.needsMail = false;
              this.scene.mailDelivered(desk);
            }
          }

          // collide with furniture
          aabb = furniture[i].aabb;
          if (aabb.intersectsWith(this.aabb)) {
            relX = this.aabb.x - aabb.x;
            relY = this.aabb.y - aabb.y;
            if (Math.abs(relX) > Math.abs(relY)) {
              if (relX > 0) {
                this.x = aabb.getRight() + this.aabb.hw;
              } else {
                this.x = aabb.getLeft() - this.aabb.hw;
              }
            } else {
              if (relY > 0) {
                this.y = aabb.getBottom() + this.aabb.hh;
              } else {
                this.y = aabb.getTop() - this.aabb.hh;
              }
            }
            this.updateAABB();
          }
        }
      }
    }
    
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
  }
});
