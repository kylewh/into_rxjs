function Observable(forEach) {
  this._forEach = forEach;
}

Observable.prototype = {
  forEach: function(onNext, onError, onCompleted) {
    if (typeof onNext === "function") {
      return this._forEach({
        onNext: onNext,
        onError: onError || function() {},
        onCompleted: onCompleted || function() {}
      });
    } else {
      // onNext is { onNext: () => , onError: () => ..}
      return this_forEach(onNext);
    }
  },
  map: function(projectionFunc) {
    const self = this;
    // mapped observable
    return new Observable(function forEach(observer) {
      return self.forEach(
        function onNext(x) {
          obsever.onNext(projectionFunc(x));
        },
        function onError(x) {
          observer.onError(e);
        },
        function onCompleted(x) {
          observer.onCompleted();
        }
      );
    });
  }
};

Observable.fromEvent = function(dom, eventName) {
  return new Observable(function forEach(observer) {
    const handler = e => observer.onNext(e);

    dom.addEventListener(eventName, handler);

    // Subscription Object
    return {
      dispose: () => {
        dom.removeEventListener(eventName, handler);
      }
    };
  });
};

const a = new Observable(function forEach() {
  console.log(1);
});

