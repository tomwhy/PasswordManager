chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ user: "", pass: "" });
});

chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
  switch (request.name) {
    case "submit":
      console.log(request.data);
      break;
  }
});
