const DATA_KEY = "trackedUrls";
const NUM_MILI_IN_A_DAY = 86400000;

let websiteUrls = []; //array of objects

//temp
console.log("popup.js");
(function(){
  console.log("iife");
  document.addEventListener('DOMContentLoaded', function () {
    bindFormSubmissionListener();
    bindHistoryListener();
    bindCloseEvent();
    autoFillFormIfDataExists(true);
    addListenerOnDeleteIcon();
    fetchHistory();
  });
})();

function bindHistoryListener() {
  let historyEl = document.getElementById("history-data");
  let historyButton = document.getElementById("history");
  let mainPage = document.getElementById("first-page");
  historyButton.addEventListener("click", () => {
    if(!historyEl.classList.value.includes("show-history")) {
      getTrackedUrlFromStorage(null, setHistory);
      historyEl.classList.add("show-history");
      historyEl.classList.remove("display-none");
      mainPage.classList.add("display-none");
    }
  });
}

function addListenerOnDeleteIcon() {
  $(".delete-icon").click((ev) => {
    const previousEl = ev.target.previousElementSibling.previousElementSibling;
    const value = previousEl.value;
    const index = websiteUrls.indexOf(value);
    if(~index) {
      previousEl.disabled = false;
      previousEl.classList.remove("border-none");
      websiteUrls.splice(index, 1);
      setTrackedUrlInStorage(websiteUrls);
      previousEl.value = "";
    }
  })
}

function bindFormSubmissionListener() {
  var consoleDiv = document.getElementById("console");
  document.forms["site-form"].addEventListener("submit", (ev) => {
    ev.preventDefault();
    console.log("hello");
    let form = document.forms["site-form"];
    // button values is also included. so that remove last element from form list.
    form = [...form].slice(0, form.length - 1);
    for (let inputEl of form) {
      if(!inputEl.disabled && inputEl.value) {
        websiteUrls.push(inputEl.value);
      }
      if(inputEl.value) {
        inputEl.classList.add("border-none");
        inputEl.disabled = true;
        inputEl.nextElementSibling.classList.remove("display-none");
        inputEl.nextElementSibling.nextElementSibling.classList.remove("display-none");
      } else {
        inputEl.parentElement.classList.add("display-none");
      }
      consoleDiv.innerText += inputEl.disabled;
    }
    setTrackedUrlInStorage(websiteUrls);
  });
}

function autoFillFormIfDataExists(skipMatch=false) {
  // var consoleDiv = document.getElementById("console");
  const callback = (result) => {
    const shouldUpdateFrom = skipMatch || JSON.stringify(websiteUrls) !== JSON.stringify(result[DATA_KEY]);
    if(result && result[DATA_KEY]) {
      if(shouldUpdateFrom) {
        websiteUrls = [...websiteUrls, ...result[DATA_KEY]].filter(url => url);
      }
      // consoleDiv.innerText += JSON.stringify(websiteUrls);
      let form = document.forms["site-form"];
      form = [...form].slice(0, form.length - 1);
      form.forEach((inputEl, index) => {
        const url = websiteUrls[index];
        if (url) {
          if(shouldUpdateFrom) {
            inputEl.classList.add("border-none");
            inputEl.disabled = true;
            inputEl.value = url;
          }
          const time = result["timeData" + numDaysSinceUTC()][url] && result["timeData" + numDaysSinceUTC()][url].time
          inputEl.nextElementSibling.innerText = sec2time(time);
        } else {
          inputEl.nextElementSibling.classList.add("display-none");
          inputEl.nextElementSibling.nextElementSibling.classList.add('display-none');
        }
      });
    }
    // consoleDiv.innerText += JSON.stringify(result);
  };

  getTrackedUrlFromStorage(null, callback);
}

function setHistory(results) {
  console.log(results);
  if(results) {
    let historyTabEl = document.getElementById("history-data");
    Object.keys(results).forEach((key) => {
      if (key.includes("timeData")) {
        let dateEl = createDiv(historyTabEl, "div");
        dateEl.classList.add("show-date");
        dateEl.innerText = getDateFromStr(key);
        const subResults = results[key];
        if (Object.keys(subResults).length) {
          Object.keys(subResults).forEach((subKey) => {
            let history = createDiv(historyTabEl, "div");
            let timeEl = createDiv(history, "span");
            timeEl.innerText = sec2time(subResults[subKey].time);
            timeEl.style.marginRight = "15px";
            let img = createDiv(history, "img");
            img.src = subResults[subKey].faviconUrl;
            img.style.height = "16px";
            img.style.width = "16px";
            img.style.marginRight = "7px";
            let subtext = createDiv(history, "span");
            history.classList.add("show-history-data");
            subtext.innerText = subKey;
          });
        } else {
          let history = createDiv(historyTabEl, "div");
          history.classList.add("show-history-data");
          history.innerText = "No Result Found";
        }
      }
    });
    let spaceEl = createDiv(historyTabEl, "div");
    spaceEl.style.height = "100px";
  }
}

function bindCloseEvent() {
  let closeBtn = document.getElementById("close-btn");
  let historyEl = document.getElementById("history-data");
  let mainPage = document.getElementById("first-page");
  closeBtn.addEventListener("click", () => {
    if(historyEl.classList.value.includes("show-history")) {
      $("#history-data").children().not(':first-child').remove();
      historyEl.classList.remove("show-history");
      historyEl.classList.add("display-none");
      mainPage.classList.remove("display-none");
    }
  });
}

function getDateFromStr(str) {
  const num = parseInt(str.replace("timeData", ""));
  const timeStamp = num * NUM_MILI_IN_A_DAY;
  return new Date(timeStamp).toDateString()
}

function createDiv(parentNode, elType) {
  let el = document.createElement(elType);
  parentNode.appendChild(el);
  return el;
}

function setTrackedUrlInStorage(websiteUrls) {
  chrome.storage.local.set({[DATA_KEY]: websiteUrls}, function () {
    // console.log(websiteUrls);
  });
}

function getTrackedUrlFromStorage(key, callback) {
  chrome.storage.local.get(key, callback);
}

function sec2time(timeInSeconds) {
  const pad = function(num, size) { return ('000' + num).slice(size * -1); },
    time = parseFloat(timeInSeconds || 0).toFixed(3),
    hours = Math.floor(time / 60 / 60),
    minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time - minutes * 60);

  return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
}

function numDaysSinceUTC(){
  const NUM_MILI_IN_A_DAY = 86400000;
  const today = new Date();
  const utcMili = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()); // miliseconds since UTC
  return (utcMili/ NUM_MILI_IN_A_DAY);
}


chrome.storage.onChanged.addListener(function(){
  // var consoleDiv = document.getElementById("console");
  autoFillFormIfDataExists();
  // consoleDiv.innerText += "-";
});

function fetchHistory() {
  chrome.history.search({text: ''}, function(data) {
    var visitedEl = document.getElementById("visited-url");
    const compareFn = (a, b) => {
      if(a.visitCount < b.visitCount) {
        return 1;
      }
      return -1;
    };

    let sortedData = data.sort(compareFn).slice(0, 10);
    if(sortedData.length) {
      visitedEl.innerText = sortedData.map(function (page, index) {
        // console.log(page);
        return (index + 1) + ". " + page.url + "\n\n\n";
      }).join("");
    } else {
      visitedEl.innerText = "No history found yet."
    }
  });
}

// var background = chrome.extension.getBackgroundPage();

// addEventListener("unload", hello, true);

activeUser();
function activeUser() {
  // background.console.log("hello unload, load");
  chrome.runtime.sendMessage({greeting: "hello"}, function (response) {
    console.log(response.farewell);
  });
}