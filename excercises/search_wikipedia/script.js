window.onload = function() {
  const Observable = Rx.Observable;

  const searchForm = document.getElementById("searchForm");
  const textBox = document.getElementById("textbox");
  const textArea = document.getElementById("results");
  const searchBtn = document.getElementById("searchBtn");

  function getWikipediaSearchResult(term) {
    return Observable.create(function forEach(observer) {
      const url =
        "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=" +
        encodeURIComponent(term) +
        "&callback=?";
      var cancelled = false;
      $.getJSON(url, function(data) {
        if (!cancelled) {
          observer.next(data[1]);
          observer.complete();
        }
      });
      return function unsubscribe() {
        cancelled = true;
      };
    });
  }

  const keyPress$ = Observable.fromEvent(textBox, "keypress");
  const searchBtnClick$ = Observable.fromEvent(searchBtn, "click");

  const searchFormOpen$ = searchBtnClick$.do(() => {
    document.getElementById("searchForm").style.display = "block";
  });

  const searchRt$ = searchFormOpen$
    .map(clickEvent => {
      const closeBtnClick$ = Observable.fromEvent(
        document.getElementById("closeBtn"),
        "click"
      );

      const searchFormClose$ = closeBtnClick$.do(() => {
        document.getElementById("searchForm").style.display = "none";
      });

      return keyPress$
        .throttleTime(20)
        .map(key => textBox.value)
        .distinctUntilChanged()
        .map(searchWord => getWikipediaSearchResult(searchWord).retry(3))
        .switchMap(data => data)
        .takeUntil(searchFormClose$);
    })
    .switchMap(data => data);

  searchRt$
    .forEach(rst => {
      textArea.value = JSON.stringify(rst);
    })
    .catch(err => console.error(err));
};
