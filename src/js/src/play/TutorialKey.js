function TutorialKey(x, y, key, delay, animManager) {
  var container = new DisplayContainer({
    x: x,
    y: y
  });
  this.displayItem = container;
  this.animEnabled = false;
  this.delay = delay || 0;
  this.animManager = animManager;

  var keySide = new DisplayRect({
    x: -20,
    y: -5,
    w: 40,
    h: 25,
    color: '#cccccc',
    rounded: 5
  });
  container.addChild(keySide);
  this.keySide = keySide;

  var keyTop = new DisplayContainer({
    x: 0,
    y: 5
  });
  this.keyTop = keyTop;
  container.addChild(keyTop);

  var keyTopRect = new DisplayRect({
    x: -20,
    y: -40,
    w: 40,
    h: 40,
    color: '#ffffff',
    rounded: 5,
  });
  keyTop.addChild(keyTopRect);
  
  var keyTopKey = new DisplayText({
    x: 0,
    y: -20,
    text: key,
    font: '20px Arial',
    color: 'black',
    align: 'center',
    baseline: 'middle'
  });
  keyTop.addChild(keyTopKey);
  this.keyTopKey = keyTopKey;

  this.anims = [];
}

TutorialKey.prototype = {
  start: function () {
    this.animEnabled = true;
    setTimeout(this.startAnim.bind(this), this.delay * 1000);
  },
  startAnim: function () {
    if (!this.animEnabled) { return false; }
    var anim1, anim2;
    anim1 = new Anim({
      object: this.keyTop,
      property: 'y',
      from: 5,
      to: 15,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic,
      onEnd: function () {
        this.animManager.add(anim2);
      }.bind(this)
    });
    anim2 = new Anim({
      object: this.keyTop,
      property: 'y',
      from: 15,
      to: 5,
      duration: 0.5,
      timeFunction: Anim.easingFunctions.easeInCubic,
      onEnd: this.startAnim.bind(this)
    });
    this.animManager.add(anim1);
  },
  stop: function () {
    this.animEnabled = false;
    this.anims.forEach(function (anim) {
      anim.cancel();
    });
  }
};
