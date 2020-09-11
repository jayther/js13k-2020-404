function MainMenuScene() {
  Scene.apply(this, arguments);

  this.time = 0;
  this.period = 2;

  // bg
  this.addChild(new DisplayRect({
    w: SETTINGS.width,
    h: SETTINGS.height,
    color: '#777777'
  }));

  this.robot = new DisplayImg({
    img: Resources.loadedImgs.robot,
    x: SETTINGS.width / 2,
    y: 150,
    w: 148,
    h: 154,
    anchorX: 74,
    anchorY: 77
  });
  this.addChild(this.robot);

  var mainTitle = new DisplayText({
    text: 'Employee Not Found',
    font: '32px Arial',
    x: SETTINGS.width / 2,
    y: 50,
    align: 'center',
    baseline: 'middle',
    color: 'white'
  });
  this.addChild(mainTitle);

  var tutorialKeyCon = new DisplayContainer({
    x: SETTINGS.width / 2,
    y: 270
  });
  this.addChild(tutorialKeyCon);

  var tutorialKeys = this.tutorialKeys = [
    new TutorialKey(0, 0, 'W', 0, this.main.animManager),
    new TutorialKey(-45, 45, 'A', 0.125, this.main.animManager),
    new TutorialKey(0, 45, 'S', 0.25, this.main.animManager),
    new TutorialKey(45, 45, 'D', 0.375, this.main.animManager)
  ];

  this.tutorialKeys.forEach(function (key) {
    tutorialKeyCon.addChild(key.displayItem);
    key.start();
  });

  var keySets = [
    ['W', 'A', 'S', 'D'],
    ['↑', '←', '↓', '→'],
    ['Z', 'Q', 'S', 'D']
  ];
  var keySetIndex = 0;

  this.keySetInterval = setInterval(function () {
    keySetIndex += 1;
    if (keySetIndex >= keySets.length) {
      keySetIndex = 0;
    }
    tutorialKeys.forEach(function (key, index) {
      key.keyTopKey.text = keySets[keySetIndex][index];
    });
  }, 1000);

  var startKeys = [
    KB.keys.a, KB.keys.w, KB.keys.s, KB.keys.d,
    KB.keys.q, KB.keys.z,
    KB.keys.left, KB.keys.up, KB.keys.right, KB.keys.down
  ];

  this.kb = KB(function () {

  }, function (keyCode) {
    var start = startKeys.some(function (k) {
      return k === keyCode;
    });
    if (start) {
      this.main.setScene(new PlayScene(this.main));
    }
  }.bind(this));

  this.addSteppable(this.cycle.bind(this));
}

MainMenuScene.prototype = extendPrototype(Scene.prototype, {
  destroy: function () {
    this.tutorialKeys.forEach(function (key) {
      key.stop();
    });
    clearInterval(this.keySetInterval);
    this.kb.destroy();
  },
  cycle: function (dts) {
    this.time += dts;

    var current = this.time % this.period,
      ratio = current / this.period;
    
    this.robot.scaleX = 1 + Math.cos(ratio * Math.PI * 2) * 0.05;
    this.robot.scaleY = 1 + Math.sin(ratio * Math.PI * 2) * 0.05;
  }
});

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
