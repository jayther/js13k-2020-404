function Scene(main, settings) {
  DisplayContainer.call(this);
  this.main = main;
  this.settings = settings;
  this.steppables = [];
}
Scene.prototype = extendPrototype(DisplayContainer.prototype, {
  create: function () {},
  destroy: function () {},
  addSteppable: function (steppable) {
    this.steppables.push(steppable);
  },
  step: function (dts) {
    for (var i = 0; i < this.steppables.length; i += 1) {
      this.steppables[i](dts);
    }
  },
  _render: function (context) {
    // we don't need transformations
    this.render(context);
  }
});
