
// Object.assign as extend function
function extend(target, varArgs) {
  'use strict';
  if (target == null) { // TypeError if undefined or null
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var to = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) { // Skip over if undefined or null
      for (var nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

function extendPrototype() {
  return extend.apply(this, [{}].concat(Array.prototype.slice.call(arguments)));
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
