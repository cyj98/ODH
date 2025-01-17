/* global nlp, Ankiconnect, Ankiweb, optionsLoad, optionsSave */
class ODHBack {
  constructor() {
    this.options = null;

    this.ankiconnect = new Ankiconnect();
    this.ankiweb = new Ankiweb();
    this.target = null;

    this.dicts = {};
    this.current = null;

    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    // window.addEventListener('message', (e) => this.onSandboxMessage(e))
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.tabs.onCreated.addListener((tab) => this.onTabReady(tab.id));
    chrome.tabs.onUpdated.addListener(this.onTabReady.bind(this));
    chrome.commands.onCommand.addListener((command) => this.onCommand(command));
  }

  onCommand(command) {
    if (command != 'enabled') return;
    this.options.enabled = !this.options.enabled;
    this.setFrontendOptions(this.options);
    optionsSave(this.options);
  }

  onInstalled(details) {
    if (details.reason === 'install') {
      chrome.tabs.create({
        url: chrome.extension.getURL('bg/guide.html'),
      });
      return;
    }
    // if (details.reason === 'update') {
    //   chrome.tabs.create({
    //     url: chrome.extension.getURL('bg/update.html'),
    //   });
    //   return;
    // }
  }

  onTabReady(tabId) {
    this.tabInvoke(tabId, 'setFrontendOptions', { options: this.options });
  }

  setFrontendOptions(options) {
    switch (options.enabled) {
      case false:
        chrome.browserAction.setBadgeText({ text: 'off' });
        break;
      case true:
        chrome.browserAction.setBadgeText({ text: '' });
        break;
    }
    this.tabInvokeAll('setFrontendOptions', {
      options,
    });
  }

  checkLastError() {
    // NOP
  }

  tabInvokeAll(action, params) {
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        this.tabInvoke(tab.id, action, params);
      }
    });
  }

  tabInvoke(tabId, action, params) {
    const callback = () => this.checkLastError(chrome.runtime.lastError);
    chrome.tabs.sendMessage(tabId, { action, params }, callback);
  }

  formatNote(notedef) {
    let options = this.options;
    if (!options.deckname || !options.typename || !options.expression) return null;

    let note = {
      deckName: options.deckname,
      modelName: options.typename,
      options: {
        allowDuplicate: options.duplicate == '1' ? true : false,
      },
      fields: {},
      tags: ['ODH'],
    };

    let fieldnames = [
      'expression',
      'reading',
      'extrainfo',
      'documenttitle',
      'definitions',
      'sentence',
      'url',
    ];
    for (const fieldname of fieldnames) {
      if (!options[fieldname]) continue;
      note.fields[options[fieldname]] = notedef[fieldname];
    }

    if (options.audio && notedef.audios.length > 0) {
      note.fields[options.audio] = '';
      let audionumber = Number(options.preferredaudio);
      audionumber = audionumber && notedef.audios[audionumber] ? audionumber : 0;
      let audiofile = notedef.audios[audionumber];
      note.audio = {
        url: audiofile,
        filename: `ODH_${options.dictSelected}_${encodeURIComponent(
          notedef.expression,
        )}_${audionumber}.mp3`,
        fields: [options.audio],
      };
    }

    return note;
  }

  // Message Hub and Handler start from here ...
  onMessage(request, sender, callback) {
    const { action, params } = request;
    const method = this['api_' + action];

    if (typeof method === 'function') {
      params.callback = callback;
      method.call(this, params);
    }
    return true;
  }

  async initBackend() {
    let options = await optionsLoad();
    this.ankiweb.initConnection(options);

    //to do: will remove it late after all users migrate to new version.
    if (options.dictLibrary) {
      // to migrate legacy scripts list to new list.
      options.sysscripts = options.dictLibrary;
      options.dictLibrary = '';
    }
    this.opt_optionsChanged(options).catch((err) => {
      console.error(err);
    });
  }

  async fetch(url) {
    const response = await fetch(url, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/text',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      // body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.text();
  }

  // front end message handler
  async api_isConnected(params) {
    let callback = params.callback;
    callback(await this.opt_getVersion());
  }

  async api_getTranslation(params) {
    let { expression, callback } = params;

    // Fix https://github.com/ninja33/ODH/issues/97
    if (expression.endsWith('.')) {
      expression = expression.slice(0, -1);
    }

    try {
      let result = await this.findTerm(expression);
      callback(result);
    } catch (err) {
      console.error(err);
      callback(null);
    }
  }

  async api_addNote(params) {
    let { notedef, callback } = params;

    const note = this.formatNote(notedef);
    try {
      let result = await this.target.addNote(note);
      callback(result);
    } catch (err) {
      console.error(err);
      callback(null);
    }
  }

  async api_findNotes(params) {
    let { expression, callback } = params;
    let options = this.options;
    if (!options.deckname || !options.typename || !options.expression) callback(null);

    try {
      let result = await this.target.findNotes(
        `deck:${options.deckname} ${options.expression}:"${expression}"`,
      );
      callback(result);
    } catch (err) {
      console.error(err);
      callback(null);
    }
  }

  async api_guiBrowse(params) {
    let { expression, callback } = params;
    let options = this.options;
    if (!options.deckname || !options.typename || !options.expression) return null;

    try {
      let result = await this.target.guiBrowse(
        `deck:${options.deckname} ${options.expression}:"${expression}"`,
      );
      callback(result);
    } catch (err) {
      console.error(err);
      callback(null);
    }
  }

  // Option page and Brower Action page requests handlers.
  async opt_optionsChanged(options) {
    this.setFrontendOptions(options);

    switch (options.services) {
      case 'none':
        this.target = null;
        break;
      case 'ankiconnect':
        this.target = this.ankiconnect;
        break;
      case 'ankiweb':
        this.target = this.ankiweb;
        break;
      default:
        this.target = null;
    }

    let defaultscripts = [
      'builtin_encn_Collins',
      'enen_TheFreeDictionary',
      'builtin_enen_TheFreeDictionary',
    ];
    let newscripts = `${options.sysscripts},${options.udfscripts}`;
    let loadresults = null;
    if (!this.options || `${this.options.sysscripts},${this.options.udfscripts}` != newscripts) {
      const scriptsset = Array.from(
        new Set(
          defaultscripts.concat(
            newscripts
              .split(',')
              .filter((x) => x)
              .map((x) => x.trim()),
          ),
        ),
      );
      loadresults = await this.loadScripts(scriptsset);
    }

    this.options = options;
    if (loadresults) {
      let namelist = loadresults.map((x) => x.result.objectname);
      this.options.dictSelected = namelist.includes(options.dictSelected)
        ? options.dictSelected
        : namelist[0];
      this.options.dictNamelist = loadresults
        .map((x) => x.result)
        .filter(
          (x) => !x.objectname.match(/enen_TheFreeDictionary|builtin_enen_TheFreeDictionary/),
        );
    }
    await this.setScriptsOptions(this.options);
    optionsSave(this.options);
    return this.options;
  }

  async opt_getDeckNames() {
    return this.target ? await this.target.getDeckNames() : null;
  }

  async opt_getModelNames() {
    return this.target ? await this.target.getModelNames() : null;
  }

  async opt_getModelFieldNames(modelName) {
    return this.target ? await this.target.getModelFieldNames(modelName) : null;
  }

  async opt_getVersion() {
    return this.target ? await this.target.getVersion() : null;
  }

  // Sandbox communication start here
  async loadScripts(list) {
    let promises = list.map((name) => this.loadScript(name));
    let results = await Promise.all(promises);
    return results.filter((x) => {
      if (x.result) return x.result;
    });
  }

  buildScriptURL(name) {
    let gitbase = 'https://raw.githubusercontent.com/cyj98/odh/master/src/dict/';
    let url = name;

    //build remote script url with gitbase(https://) if prefix lib:// existing.
    url = url.indexOf('lib://') != -1 ? gitbase + url.replace('lib://', '') : url;

    //use local script if nothing specified in URL prefix.
    if (url.indexOf('https://') == -1 && url.indexOf('https://') == -1) {
      url = '/dict/' + url;
    }
    //add .js suffix if missing.
    url = url.indexOf('.js') == -1 ? url + '.js' : url;
    return url;
  }

  async loadScript(name) {
    let scripttext = await this.fetch(this.buildScriptURL(name));
    if (!scripttext) {
      return { name, result: null };
    }
    // api.callback({ name, result: null }, callbackId)
    try {
      let SCRIPT = eval(`(${scripttext})`);
      if (SCRIPT.name && typeof SCRIPT === 'function') {
        let script = new SCRIPT();
        //if (!this.dicts[SCRIPT.name])
        this.dicts[SCRIPT.name] = script;
        let displayname =
          typeof script.displayName === 'function' ? await script.displayName() : SCRIPT.name;
        return {
          name,
          result: { objectname: SCRIPT.name, displayname },
        };
      }
    } catch (err) {
      console.error(err);
      return { name, result: null };
    }
  }

  setScriptsOptions(options) {
    // let { options, callbackId } = params
    for (const dictionary of Object.values(this.dicts)) {
      if (typeof dictionary.setOptions === 'function') dictionary.setOptions(options);
    }

    let selected = options.dictSelected;
    if (this.dicts[selected]) {
      this.current = selected;
      // api.callback(selected, callbackId)
      // return
      return selected;
    }
    // return
    // api.callback(null, callbackId)
  }

  async findTerm(expression) {
    // let { expression, callbackId } = params

    // const notes = notes;
    let notes;
    expression = expression.toLowerCase().replace(/[’']/g, `'`);
    if (expression.indexOf(' ') > -1) {
      if (
        !this.dicts.builtin_enen_TheFreeDictionary &&
        typeof this.dicts.builtin_enen_TheFreeDictionary.findTerm !== 'function'
      ) {
        return [];
      }
      notes = await this.dicts.builtin_enen_TheFreeDictionary.findTerm(expression);
      // api.callback(notes, callbackId)
      // return
    } else {
      if (!this.dicts[this.current] || typeof this.dicts[this.current].findTerm !== 'function') {
        return [];
      }
      notes = await this.dicts[this.current].findTerm(expression.toLowerCase());
      if (Array.isArray(notes) && notes.length === 0) {
        if (expression.includes("'")) {
          return await this.dicts[this.current].findTerm(
            expression.substring(0, expression.indexOf("'")).toLowerCase(),
          );
        }
        const wordNlp = nlp(expression);
        const tagsTmp = wordNlp.out('tags')[0];
        const tags = Object.values(tagsTmp)[0];
        if (tags.indexOf('Verb') !== -1 && tags.indexOf('Infinitive') === -1) {
          expression = wordNlp.verbs().toInfinitive().all().text();
        }
        if (tags.indexOf('Noun') !== -1 && tags.indexOf('Plural') !== -1) {
          expression = wordNlp.nouns().toSingular().all().text();
        }
        notes = await this.dicts[this.current].findTerm(expression.toLowerCase());
      }
    }
    return notes;
  }
}

window.odhback = new ODHBack();
document.addEventListener(
  'DOMContentLoaded',
  () => {
    window.odhback.initBackend();
  },
  false,
);
