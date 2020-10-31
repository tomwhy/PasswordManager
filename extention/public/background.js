chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ token: undefined, key: undefined });
});

chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
  switch (request.name) {
    case "submit":
      console.log(request.data);
      break;
  }
});
