const DATA_KEY = "trackedUrls";
const NUM_MILI_IN_A_DAY = 86400000;

let websiteUrls = []; //array of objects

(function(){
  document.addEventListener('DOMContentLoaded', function () {
    bindFormSubmissionListener();
    bindHistoryListener();
    bindCloseEvent();
    autoFillFormIfDataExists(true);
    addListenerOnDeleteIcon();
    fetchHistory();
    bindAddNewItemEvent();
  });
})();

function bindAddNewItemEvent() {
  let addNewButton = document.getElementById("add-new-button");
  addNewButton.addEventListener("click", () => {
    addNewFormEl();
  });
}

function bindHistoryListener() {
  const historyEl = document.getElementById("history-data");
  const historyButton = document.getElementById("history");
  const mainPage = document.getElementById("first-page");
  const closeBtn = document.getElementById("close-btn");
  historyButton.addEventListener("click", () => {
    if(!historyEl.classList.value.includes("show-history")) {
      getTrackedUrlFromStorage(null, setHistory);
      historyEl.classList.add("show-history");
      historyEl.classList.remove("close-history");
      historyEl.classList.remove("display-none");
      mainPage.classList.add("display-none");
      closeBtn.classList.remove("display-none");
    }
  });
}

function addListenerOnDeleteIcon() {
  $("form[name=site-form]").click((ev) => {
    if(ev.target.classList.value === "delete-icon") {
      const parentEl = ev.target.parentNode.parentNode;
      parentEl.removeChild(ev.target.parentNode);
      const value = ev.target.previousElementSibling.previousElementSibling.value;
      const index = websiteUrls.indexOf(value);
      if(~index) {
        websiteUrls.splice(index, 1);
        setTrackedUrlInStorage(websiteUrls);
      }
    }
  })
}

function addNewFormEl() {
  let form = document.forms["site-form"];
  const inputGroup = createElement(form, "div");
  inputGroup.classList.add("input-group");
  const inputEl = createElement(inputGroup, "input");
  inputEl.type = "url";
  inputEl.pattern = "https://.+";
  inputEl.classList.add("tracksite-input");
  inputEl.placeholder = "https://www.example.com";
  inputEl.required = true;
  const spanEl = createElement(inputGroup, "span");
  spanEl.setAttribute("class", "show-time font-20 monospace font-bold margin-col-default");
  spanEl.innerText = "00:00:00";
  const imgEl = createElement(inputGroup, "img");
  imgEl.src = "images/delete-icon.png";
  imgEl.classList.add("delete-icon");
  imgEl.style.width = "20px";
  imgEl.style.height = "20px";
  return {inputGroup, inputEl, spanEl, imgEl};
}

function bindFormSubmissionListener() {
  const submitbutton = document.getElementById("submit");
  submitbutton.addEventListener("click", (ev) => {
    ev.preventDefault();
    let form = document.forms["site-form"];
    // button values is also included. so that remove last element from form list.
    form = [...form];
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
    }
    setTrackedUrlInStorage(websiteUrls);
  });
}

function autoFillFormIfDataExists(skipMatch=false) {
  const callback = (result) => {
    const shouldUpdateFrom = skipMatch || JSON.stringify(websiteUrls) !== JSON.stringify(result[DATA_KEY]);
    if(result && result[DATA_KEY]) {
      if(shouldUpdateFrom) {
        websiteUrls = [...websiteUrls, ...result[DATA_KEY]].filter(url => url);
      }
      let form = document.forms["site-form"];
      form = [...form];
      form.forEach((inputEl, index) => {
        const url = websiteUrls[index];
        if (url) {
          if(shouldUpdateFrom) {
            inputEl.classList.add("border-none");
            inputEl.disabled = true;
            inputEl.value = url;
          }
          const time = result["timeData" + numDaysSinceUTC()][url] && result["timeData" + numDaysSinceUTC()][url].time;
          inputEl.nextElementSibling.innerText = sec2time(time);
        } else if(!inputEl.value) {
          inputEl.nextElementSibling.classList.add("display-none");
          inputEl.nextElementSibling.nextElementSibling.classList.add('display-none');
        }
      });
      if(websiteUrls.length > 0) {

        for(let i= form.length;i < websiteUrls.length;i++) {
          const url = websiteUrls[i];
          if(shouldUpdateFrom) {
            const elObj = addNewFormEl();
            elObj.inputEl.classList.add("border-none");
            elObj.inputEl.disabled = true;
            elObj.inputEl.value = url;
            const time = result["timeData" + numDaysSinceUTC()][url] && result["timeData" + numDaysSinceUTC()][url].time;
            elObj.spanEl.innerText = sec2time(time);
          }
        }
      }
    }
  };

  getTrackedUrlFromStorage(null, callback);
}

function setHistory(results) {
  if(results) {
    let historyTabEl = document.getElementById("history-data");
    const sortedData = Object.keys(results).sort((a, b) => {if(a < b){return 1} return -1});
    sortedData.forEach((key) => {
      if (key.includes("timeData")) {
        let dateEl = createElement(historyTabEl, "div");
        dateEl.classList.add("show-date");
        dateEl.innerText = getDateFromStr(key);
        const subResults = results[key];
        if (Object.keys(subResults).length) {
          Object.keys(subResults).forEach(subKey => {
            let history = createElement(historyTabEl, "div");
            let timeEl = createElement(history, "span");
            timeEl.innerText = sec2time(subResults[subKey].time);
            timeEl.style.marginRight = "15px";
            timeEl.style.flexShrink = "0";
            let img = createElement(history, "img");
            img.src = subResults[subKey].faviconUrl;
            img.style.height = "16px";
            img.style.width = "16px";
            img.style.marginRight = "7px";
            let subtext = createElement(history, "span");
            history.classList.add("show-history-data");
            subtext.innerText = subKey;
          });
        } else {
          let history = createElement(historyTabEl, "div");
          history.classList.add("show-history-data");
          history.innerText = "No Result Found";
        }
      }
    });
    let spaceEl = createElement(historyTabEl, "div");
    spaceEl.style.height = "100px";
  }
}

function bindCloseEvent() {
  const closeBtn = document.getElementById("close-btn");
  const historyEl = document.getElementById("history-data");
  const mainPage = document.getElementById("first-page");
  closeBtn.addEventListener("click", () => {
    if(historyEl.classList.value.includes("show-history")) {
      $("#history-data").children().not(':first-child').remove();
      historyEl.classList.remove("show-history");
      historyEl.classList.add("close-history");
      closeBtn.classList.add("display-none");
      mainPage.classList.remove("display-none");
    }
  });
}

function getDateFromStr(str) {
  const num = parseInt(str.replace("timeData", ""));
  const timeStamp = num * NUM_MILI_IN_A_DAY;
  return new Date(timeStamp).toDateString()
}

function createElement(parentNode, elType) {
  let el = document.createElement(elType);
  parentNode.appendChild(el);
  return el;
}

function setTrackedUrlInStorage(websiteUrls) {
  chrome.storage.local.set({[DATA_KEY]: websiteUrls}, function () {
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
  autoFillFormIfDataExists();
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
      sortedData.forEach((page) => {
        return visitedItems(visitedEl, page.url);
      });
    } else {
      visitedEl.innerText = "No history found yet."
    }
  });
}

function visitedItems(parentEl, text) {
  const parentDiv = createElement(parentEl, "div");
  parentDiv.classList.add("mvu-parent");
  const img = createElement(parentDiv, "img");
  img.classList.add("mvu-icon");
  img.src = "./images/default-favicon.png";
  const textEl = createElement(parentDiv, "span");
  textEl.classList.add("margin-left-small");
  textEl.innerText = text;
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