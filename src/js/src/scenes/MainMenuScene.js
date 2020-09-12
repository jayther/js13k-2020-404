function MainMenuScene() {
  Scene.apply(this, arguments);

  this.time = 0;
  this.period = 2;
  this.mailTimeMin = 0.5;
  this.mailTimeMax = 1.5;
  this.mailTime = Random.range(this.mailTimeMin, this.mailTimeMax);
  this.mails = [];

  this.scrollingBg = new DisplayRect({
    w: SETTINGS.width,
    h: SETTINGS.height,
    color: Resources.loadedPatterns.hallwayTile,
    fillScaleX: 5,
    fillScaleY: 5
  });
  this.addChild(this.scrollingBg);

  this.mailLayer = new DisplayContainer();
  this.addChild(this.mailLayer);

  this.robot = new DisplayImg({
    img: Resources.loadedImgs.robot,
    x: 170,
    y: SETTINGS.height / 2,
    w: 148,
    h: 154,
    anchorX: 74,
    anchorY: 77
  });
  this.addChild(this.robot);

  var mainTitle = new DisplayText({
    text: 'Employee Not Found',
    font: '32px Arial',
    x: 420,
    y: 100,
    align: 'center',
    baseline: 'middle',
    color: 'white'
  });
  this.addChild(mainTitle);

  var tutorialKeyCon = new DisplayContainer({
    x: 420,
    y: 190
  });
  this.addChild(tutorialKeyCon);

  var tutorialText = new DisplayText({
    text: 'Controls:',
    font: '24px Arial',
    x: 0,
    y: -40,
    align: 'center',
    baseline: 'bottom',
    color: 'white'
  });
  tutorialKeyCon.addChild(tutorialText);

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

  var startText = new DisplayText({
    text: 'Press any of these keys to start',
    font: '18px Arial',
    x: 0,
    y: 70,
    align: 'center',
    baseline: 'top',
    color: 'white'
  });
  tutorialKeyCon.addChild(startText);

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
    this.scrollingBg.fillOffsetX -= 200 * dts;
    this.mailLayer.x -= 200 * dts;

    var i, mail;
    for (i = 0; i < this.mails.length; i += 1) {
      mail = this.mails[i];
      if (mail.x + this.mailLayer.x < -200) {
        this.mailLayer.removeChild(mail);
        this.mails.splice(i, 1);
        i -= 1;
      }
    }

    this.mailTime -= dts;
    if (this.mailTime <= 0) {
      mail = new Mail({
        x: -this.mailLayer.x + this.robot.x,
        y: this.robot.y,
        scaleX: 4,
        scaleY: 4,
        angle: Random.range(0, Math.PI * 2)
      });
      this.mails.push(mail);
      this.mailLayer.addChild(mail);

      this.mailTime = Random.range(this.mailTimeMin, this.mailTimeMax);
    }
  }
});
