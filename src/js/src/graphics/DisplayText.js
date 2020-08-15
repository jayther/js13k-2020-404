function DisplayText(options) {
  DisplayItem.apply(this, arguments);
  var opts = extend({
    text: '',
    align: 'left',
    baseline: 'top',
    font: null,
    color: 'black'
  }, options || {});
  this.color = opts.color;
  this.text = opts.text;
  this.align = opts.align;
  this.baseline = opts.baseline;
  this.font = opts.font;
}
DisplayText.prototype = extendPrototype(DisplayItem.prototype, {
  render: function (context) {
    if (this.font) {
      context.font = this.font;
    }
    context.textAlign = this.align;
    context.textBaseline = this.baseline;
    context.fillStyle = this.color;
    context.fillText(this.text, 0, 0);
  }
});
  