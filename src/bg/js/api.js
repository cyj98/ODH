/* global Builtin, BuiltinIdioms  */
class backendAPI {
  constructor() {
    this.builtin = new Builtin();
    this.builtin.loadData();
    this.builtinIdioms = new BuiltinIdioms();
    this.builtinIdioms.loadData();
  }

  async fetch(url) {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/text',
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    });
    return response.text();
  }

  async getBuiltin(dict, word) {
    return this.builtin.findTerm(dict, word);
  }

  async getBuiltinIdioms(dict, word) {
    return this.builtinIdioms.findTerm(dict, word);
  }

  async locale() {
    return chrome.i18n.getUILanguage();
  }
}

window.api = new backendAPI();
