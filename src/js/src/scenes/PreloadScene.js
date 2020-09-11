function PreloadScene() {
  Scene.apply(this, arguments);
  this.imgs = [];
  this.finished = false;
  this.progressText = new DisplayText({
    x: SETTINGS.width / 2,
    y: SETTINGS.height / 2,
    text: '0%',
    color: 'black',
    align: 'center',
    baseline: 'middle',
    font: '32px Arial'
  });

  // bg
  this.addChild(new DisplayRect({
    w: SETTINGS.width,
    h: SETTINGS.height,
    color: '#777777'
  }))
  this.addChild(this.progressText);
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

    this.progressText.text = Math.floor(loaded / this.imgs.length * 100) + '%';

    if (loaded >= this.imgs.length) {
      this.finish();
    }
  },
  finish: function () {
    if (this.finished) return;

    // create patterns
    Object.entries(Resources.patterns).forEach(function (entry) {
      Resources.loadedPatterns[entry[0]] = this.main.context.createPattern(
        Resources.loadedImgs[entry[0]],
        entry[1]
      );
    }, this);

    this.finished = true;
    this.main.setScene(new MainMenuScene(this.main));
  }
});
