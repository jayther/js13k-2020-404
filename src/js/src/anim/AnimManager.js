
function AnimManager() {
  this.time = 0;
  this.anims = [];
}
AnimManager.singleton = null;
AnimManager.prototype = {
  add: function (anim) {
    anim.start(this.time);
    this.anims.push(anim);
  },
  step: function (dts) {
    var i, anim, removeAnim;
    for (i = 0; i < this.anims.length; i += 1) {
      removeAnim = false;
      anim = this.anims[i];
      if (!anim.cancelled) {
        anim.step(this.time);
      }
      if (anim.cancelled) {
        removeAnim = true;
      } else if (this.time >= anim.endTime) {
        if (anim.settings.onEnd) {
          anim.settings.onEnd();
        }
        removeAnim = true;
      }
      if (removeAnim) {
        this.anims.splice(i, 1);
        i -= 1;
      }
    }
    this.time += dts;
  }
};
