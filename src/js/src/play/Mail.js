function Mail(options) {
  DisplayRect.call(this, extend({
    color: '#eeeeee',
    w: 20,
    h: 10,
    anchorX: 10,
    anchorY: 5
  }, options || {}));
}

Mail.prototype = extendPrototype(DisplayRect.prototype, {});