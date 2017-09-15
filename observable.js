var button = document.getElementById("button");

function Observable(forEach) {
  this._forEach = forEach;
}

Observable.prototype = {
  forEach: function(onNext, onError, onCompleted) {
    // are they passing in functions
    if (typeof onNext === "function") {
      return this._forEach({
        onNext: onNext,
        onError: onError || function() {},
        onCompleted: onCompleted || function() {}
      });
    } else {
      // are they passing an Observer
      return this._forEach(onNext);
    }
  },
  map: function(projectionFunction) {
    var self = this;
    // mapped observable
    return new Observable(function forEach(observer) {
      return self.forEach(
        function onNext(x) {
          observer.onNext(projectionFunction(x));
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
    });
  },
  filter: function(testFunction) {
    var self = this;
    // filtered observable
    return new Observable(function forEach(observer) {
      return self.forEach(
        function onNext(x) {
          if (testFunction(x)) {
            observer.onNext(x);
          }
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
    });
  },
  take: function(num) {
    var self = this;
    // take observable
    return new Observable(function forEach(observer) {
      var counter = 0,
        subscription = self.forEach(
          function onNext(v) {
            observer.onNext(v);
            counter++;
            if (counter === num) {
              observer.onCompleted();
              subscription.dispose();
            }
          },
          function onError(e) {
            observer.onError(e);
          },
          function onCompleted() {
            observer.onCompleted();
          }
        );

      return subscription;
    });
  }
};

Observable.fromEvent = function(dom, eventName) {
  return new Observable(function forEach(observer) {
    var handler = e => observer.onNext(e);
    dom.addEventListener(eventName, handler);

    // Subscription
    return {
      dispose: () => {
        dom.removeEventListener(eventName, handler);
      }
    };
  });
};

Observable.fromObservations = function(obj) {
  return new Observable(function forEach(observer) {
    var handler = e => observer.onNext(e);

    Object.observe(obj, handler);

    // Subscription
    return {
      dispose: () => {
        Object.unobserve(obj, handler);
      }
    };
  });
};

var clicks = Observable.fromEvent(button, "click")
  .filter(e => e.pageX > 40)
  .map(e => e.pageX + "px");

const disposeable = clicks.forEach(x => console.log(x));
console.log(disposeable);

/**
  _fromEevent_forEach = (observer) => {
    return new Observable(function forEach(observer) {
      var handler = e => observer.onNext(e);
      dom.addEventListener(eventName, handler);

      // Subscription
      return {
        dispose: () => {
          dom.removeEventListener(eventName, handler);
        }
      };
    });
  }

  1. clicks = Observable.fromEvent(button, "click") 
     clicks -> new Observable( _fromEevent_forEach )
               (clicks)this._forEach = _fromEvent_forEach


  2. disposeable = clicks.forEach(x => console.log(x));
     Let's just consider we only call forEach on clicks.
     Notice that clicks is a Obeservable instance.
     So it has a function named forEach in its' prototype.
     Go to line 8: 
     x => console.log(x) is a function.
     Go to line 11
     this._forEach(obeserver) = clicks._fromEvent_forEach(observer)
     arguments(observer): 
     {
        onNext: onNext, // x => console.log(x)
        onError: onError || function() {},    // empty
        onCompleted: onCompleted || function() {} // empty
     }

     So now we go back to the _fromEvent_forEach:
     Go to line 124: 
     handler = e => (x => console.log(x))(e)
     button.onclick = e => console.log(e);
     So: disposiable = { dispose: // removeListener }


  3. Now we call another function named filter, what will happen?
     We will move back to the position when clicks was made.
     Go to line 39:
     self = this = clicks : a Observable instance with _fromEvent_forEach as its _forEach method.
     Go to line 41:
     clicks = another Observable instance with _fromFilter_forEach as its _forEach method.

     !!!But pls notice that in line 42:
     self.forEach is actually _fromEvent_filter

     function _fromFilter_forEach(observer) {
      return self.forEach(
        function onNext(x) {
          if (testFunction(x)) {
            observer.onNext(x);
          }
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
    }

    After that, clicks now has _fromFilter_forEach(testFunction)

  4. Move on! This time we add Map!
     As same as stuff we did in filter...
     clicks now has _fromMap_forEach(projectionFunc)

     function _fromMap_forEach(observer) {
      return self.forEach(
        function onNext(x) {
          observer.onNext(projectionFunction(x));
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          observer.onCompleted();
        }
      );
    }
    
  5. Let's run:
     Go to line 195:
     observer: observer_fromForEach: x => console.log(x)
     Go to line 196:
     We know self_forEach it's just _fromFilter_forEach
     Go to line 174:
     We know self_forEach it's just _fromEvent_forEach
     Go to line 124: 
     handler = function onNext(x) { // from Line 175
      if (testFunction(x)) {  // testFunction from Line 115 which was passed in Line 38.
         observer.onNext(x);  // It's fromLine 118, which will be excuted at Line 198,
                              // and projectionFunction from Line 116 which was passed in Line 21.
      }
     }
     
     Magic will be demystified right now! Don't blink! 
     We can transfrom our final handler as below:
    
     handler = (e) => {
       if(e.pageX > 40) {
         console.log(e.pageX + 'px')
       }
     }

     Boom~! Just like this? 
     It's kind of nested style: wrapFunc(wrapFunc(wrapFunc)) triggered by event. 
     (Queit similar, still have nuance between them)
     The key to produce nested function is in self.forEach.
     Here we define how to apply the function we received inside last observer.onNext

 ===================================================================================================

                  handler                 filter                   map               forEach
                    |                       |                       |                    |
                    |                       |                       |                    |
  received    chainedResult             e.pageX > 40           e.pageX + 'px'     console.log(x)
                    
                                        testFunction           projectionFunc     outmost observe.next
  
  how to apply?                    if (testFunc(x)) {     ->  observer         -> the same as received
                                      observer.onNext(x);     .onNext(pjFunc(x));
                                   }

  Chain them together:        

                                   if (testFunction(x)) {
  handler           ======>          conosle.log(projectionFunction(x));
                                   }
 */
