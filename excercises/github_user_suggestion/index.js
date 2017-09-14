// elements

var refreshBtn = document.querySelector(".refresh");

var refreshBtnClick$ = Rx.Observable.fromEvent(refreshBtn, "click");

var startupRequest$ = Rx.Observable.of("https://api.github.com/users");

const requestOnReFresh$ = refreshBtnClick$.map(event => {
  const randomOffset = Math.floor(Math.random() * 500);
  return "https://api.github.com/users?since=" + randomOffset;
});

const response$ = startupRequest$
  .merge(startupRequest$)
  .flatMap(requestUrl => Rx.Observable.fromPromise(jQuery.getJSON(requestUrl)));

function createSuggestionStream(response$) {
  return response$.map(
    listUsers => listUsers[Math.floor(Math.random() * listUsers.length)]
  );
}

const suggestion1$ = createSuggestionStream(response$);
const suggestion2$ = createSuggestionStream(response$);
const suggestion3$ = createSuggestionStream(response$);

// Rendering ---------------------------------------------------
function renderSuggestion(suggestedUser, selector) {
  var suggestionEl = document.querySelector(selector);
  if (suggestedUser === null) {
    suggestionEl.style.visibility = "hidden";
  } else {
    suggestionEl.style.visibility = "visible";
    var usernameEl = suggestionEl.querySelector(".username");
    usernameEl.href = suggestedUser.html_url;
    usernameEl.textContent = suggestedUser.login;
    var imgEl = suggestionEl.querySelector("img");
    imgEl.src = "";
    imgEl.src = suggestedUser.avatar_url;
  }
}

suggestion1$.subscribe(user => {
  renderSuggestion(user, ".suggestion1");
});

suggestion2$.subscribe(user => {
  renderSuggestion(user, ".suggestion2");
});

suggestion3$.subscribe(user => {
  renderSuggestion(user, ".suggestion3");
});
