const DATA_KEY = "trackedUrls";
let websiteUrls = [];
let activeTabUrl = "";
let isUserActive = false;
let totalTimeOnWebsites = {};
let today = 0;
let favIconUrl = "";

(function(){
  getTrackedUrlFromStorage(null, filterUrlAndSetIconActive.bind(null, true));
  updateActiveTabUrl();
  isUserActive = true;
  today = numDaysSinceUTC();
  addEvents();
  // updateData();

  //check if a new day
  setInterval(() => {
    if(isNewDay()) {
      updateData();
    }
  }, 1000);

  //save data in storage in every 1 min
  setInterval(saveDataInStorage, 1000);
})();

function filterUrlAndSetIconActive(skipMatch=false, result) {
  // console.log(result);
  if(result && result[DATA_KEY] && (skipMatch || JSON.stringify(websiteUrls) !== JSON.stringify(result[DATA_KEY]))) {
    websiteUrls = [...websiteUrls, ...result[DATA_KEY]];
    let urlMatchesList = getUrlMatchesFromWebsiteUrl(websiteUrls);
    activeExtensionIcon(urlMatchesList);
    // console.log(urlMatchesList);
  }
  const key= "timeData" + numDaysSinceUTC();
  if(result && result[key] && Object.keys(result[key]).length && (skipMatch || JSON.stringify(totalTimeOnWebsites) !== JSON.stringify(result[key]))) {
    totalTimeOnWebsites = {...totalTimeOnWebsites, ...result[key]}
  }
  if(result && result["today"] && skipMatch) {
    today = result["today"];
  }
}

function getTrackedUrlFromStorage(key=null, callback) {
  chrome.storage.local.get(key, callback);
}

function setDataInStorage(obj) {
  chrome.storage.local.set(obj, function(){});
}

function activeExtensionIcon(urlMatchesList) {
  // console.log("active kardo bhai");
  chrome.webNavigation.onCompleted.addListener(function(tab) {
       setIcon(tab.tabId)
  }, {url: urlMatchesList});
}

function setIcon(tabId) {
  chrome.browserAction.setIcon({
      tabId: tabId,
      path: {
        '16': 'images/extension-active.png',
        '32': 'images/extension-active.png',
        '48': 'images/extension-active.png',
        '128': 'images/extension-active.png'
      },
  });
}

function getUrlMatchesFromWebsiteUrl(websiteUrls) {
  return websiteUrls.filter(url => url).map((url) => {
      const newUrl = filterURL(url);
      return {urlMatches: `${newUrl}*`}
  });
}

function filterURL(url, shouldGetOnlyDomain=false) {
  // console.log("aaya hai url", url, shouldGetOnlyDomain);
  let newURL = url;
  try {
    let newUrlList = shouldGetOnlyDomain ?
      url.split(/\.(?=[^\.]+$)/)[0].split("www.")
      :
      [newURL];
    if(newUrlList.length > 1) {
      newURL = newUrlList[1];
    } else {
      newUrlList = newUrlList[0].split("://");
      if (newUrlList.length > 0) {
        newURL = newUrlList[1];
      } else {
        newURL = newUrlList[0];
      }
    }
    newURL = newURL.split('\/')[0];
  } catch (e) {
    console.log(e);
    newURL = url;
  }

  return newURL;
}

function updateActiveTabUrl() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    // console.log("tabs----->", tabs);
    if(tabs.length < 0) {
      activeTabUrl = null;
    } else {
      if(tabs[0]) {
        // console.log(tabs[0]);
        activeTabUrl = tabs[0].url;
        favIconUrl = tabs[0].favIconUrl;
        // console.log("&&&&&&&&&&&&&&&&&&&&", activeTabUrl);
        // console.log(totalTimeOnWebsites);
        if (isTrackedURL(filterURL(tabs[0].url))) {
          setIcon(tabs[0].id);
        }
      }
    }
  })
}

function addEvents() {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      // console.log("hello000000000");
      isUserActive = true;
      updateActiveTabUrl();
      sendResponse("qwertyui")
    });

  chrome.storage.onChanged.addListener(function(){
    getTrackedUrlFromStorage(null, filterUrlAndSetIconActive.bind(null, false));
  });

  chrome.tabs.onActivated.addListener(function(activeInfo) {
    // console.log("activeInfo", activeInfo);
    isUserActive = true;
    updateActiveTabUrl();
  });

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // console.log("onUpdatedtab", tabId, changeInfo, tab, activeTabUrl);
    isUserActive = true;
    updateActiveTabUrl();
  });

  chrome.windows.onFocusChanged.addListener(function(windowId) {
    // console.log("arguments", arguments);
    // console.log("onFocusChanged", windowId, windowId !== chrome.windows.WINDOW_ID_NONE, chrome.windows.WINDOW_ID_NONE);
    // console.log("onFocusChanged----1", chrome.windows);
    isUserActive = windowId !== chrome.windows.WINDOW_ID_NONE;
    updateActiveTabUrl();
  });

  window.setInterval(updateTimeOnWebsite, 1000);
}

function updateTimeOnWebsite() {
  const currentWebsiteUrl = getCurrentWebsite();
  const isTrackedUrl = isTrackedURL(currentWebsiteUrl);
  // console.log("updateTimeOnWebsite", currentWebsiteUrl, isUserActive, !!isTrackedUrl);
  if(currentWebsiteUrl && isUserActive && !!isTrackedUrl) {
    totalTimeOnWebsites[isTrackedUrl] = {
      "time": totalTimeOnWebsites[isTrackedUrl] && ++totalTimeOnWebsites[isTrackedUrl].time || 1,
      "faviconUrl": favIconUrl,
    };
  }
}

function isTrackedURL(url) {
  for(let el of websiteUrls) {
    if(el.includes(url)) {
      return el;
    }
  }
  return false;
}

function getCurrentWebsite() {
  if(activeTabUrl) {
    return filterURL(activeTabUrl, true);
  }
}

function updateData() {
  today = numDaysSinceUTC();
  totalTimeOnWebsites = {};
  let newData = {
    ["timeData" + numDaysSinceUTC()]: {},
    "today": numDaysSinceUTC(),
  };
  setDataInStorage(newData);
}

function saveDataInStorage() {
  if(Object.keys(totalTimeOnWebsites).length) {
    setDataInStorage({["timeData" + numDaysSinceUTC()]: totalTimeOnWebsites});
  }
}

function numDaysSinceUTC(){
  const NUM_MILI_IN_A_DAY = 86400000;
  const today = new Date();
  const utcMili = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()); // miliseconds since UTC
  return (utcMili/ NUM_MILI_IN_A_DAY);
}

function isNewDay(){
  return (numDaysSinceUTC() - today >= 1);
}

// function logTabs(windowInfo) {
//   console.log("helloo", windowInfo);
//   for (let tabInfo of windowInfo.tabs) {
//     console.log(tabInfo.url);
//   }
// }
//
// function onError(error) {
//   console.log(`Error: ${error}`);
// }
// console.log("*************************---------------************************");
// chrome.browserAction.onClicked.addListener((tab) => {
//   console.log("************************************************");
//   var getting = browser.windows.getCurrent({populate: true});
//   getting.then(logTabs, onError);
// });
//
// chrome.windows.getCurrent({populate: true}).then(logTabs, onError);

/**
 * 1. add time using domain name includes json name
 * 2. onFocusChanged not working for now i have commented the code
 * 3. dynamically add input box
 * 4. add button to add most visited urls
 * 5. edit option to edit the tracked url
 * 6. reset the current time of a particular url
 * 7. previous history in history tab --------------------------------------done
 * **/
