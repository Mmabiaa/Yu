// Node.js 18 compatibility polyfills for Expo SDK 54
// This must be loaded before any Metro or Expo code

if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return [...this].sort(compareFn);
  };
}

if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function(start, deleteCount, ...items) {
    const result = [...this];
    result.splice(start, deleteCount, ...items);
    return result;
  };
}

if (!Array.prototype.with) {
  Array.prototype.with = function(index, value) {
    const result = [...this];
    result[index] = value;
    return result;
  };
}