function PlayScene() {
  Scene.apply(this, arguments);
  
  this.gridRange = {
    minWidth: 50,
    maxWidth: 60,
    minHeight: 50,
    maxHeight: 60
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
  
  var room = Random.pick(this.world.rooms);
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
      this.world.x = Math.floor(SETTINGS.width / 2 - player.x);
      this.world.y = Math.floor(SETTINGS.height / 2 - player.y);
    }.bind(this));
  }
}
PlayScene.prototype = extendPrototype(Scene.prototype, {
  destroy: function () {
    this.keys.forEach(function (key) {
      key.destroy();
    });
  }
});
