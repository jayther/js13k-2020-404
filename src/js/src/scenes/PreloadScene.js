function PreloadScene() {
  Scene.apply(this, arguments);
  this.imgs = [];
  this.finished = false;
}
PreloadScene.prototype = extendPrototype(Scene.prototype, {
  create: function () {
    Object.entries(Resources.imgs).forEach(function (entry) {
      var img = new Image();
      img.onload = this.onImgLoad.bind(this);
      img.src = entry[1];
      this.imgs.push(img);
      Resources.loadedImgs[entry[0]] = img;
    }, this);
  },
  onImgLoad: function (e) { 
    if (this.finished) return;
    var loaded = this.imgs.reduce(function (imgsLoaded, img) {
      return (img.complete ? 1 : 0) + (imgsLoaded || 0);
    }, 0);

    if (loaded >= this.imgs.length) {
      this.finished = true;
      this.main.setScene(new PlayScene(this.main));
    }
  }
});
