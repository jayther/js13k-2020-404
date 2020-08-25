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
