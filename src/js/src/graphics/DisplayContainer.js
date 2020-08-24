function DisplayContainer(options) {
  DisplayItem.apply(this, arguments);
  this.children = [];
}
DisplayContainer.prototype = extendPrototype(DisplayItem.prototype, {
  addChild: function (child) {
    this.children.push(child);
    child.parent = this;
    return this;
  },
  removeChild: function (child) {
    var i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.parent = null;
    }
    return this;
  },
  render: function (context) {
    for (var i = 0; i < this.children.length; i += 1) {
      this.children[i]._render(context);
    }
  }
});
