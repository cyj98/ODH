class Ankiconnect {
  constructor() {
    this.version = 6;
  }

  async ankiInvoke(action, params = {}, timeout = 3000) {
    let version = this.version;
    let request = { action, version, params };
    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'https://127.0.0.1:8765',
        type: 'POST',
        data: JSON.stringify(request),
        timeout,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: (response) => {
          try {
            if (Object.getOwnPropertyNames(response).length != 2) {
              throw 'response has an unexpected number of fields';
            }
            if (!Object.prototype.hasOwnProperty.call(response, 'error')) {
              throw 'response is missing required error field';
            }
            if (!Object.prototype.hasOwnProperty.call(response, 'result')) {
              throw 'response is missing required result field';
            }
            if (response.error) {
              throw response.error;
            }
            resolve(response.result);
          } catch (e) {
            reject(e);
          }
        },
        // error: (xhr, status, err) => resolve(null),
        error: () => resolve(null),
      });
    });
  }

  async addNote(note) {
    if (note) return await this.ankiInvoke('addNote', { note });
    else return Promise.resolve(null);
  }

  async findNotes(query) {
    if (query) return await this.ankiInvoke('findNotes', { query });
    else return Promise.resolve(null);
  }

  async guiBrowse(query) {
    if (query) return await this.ankiInvoke('guiBrowse', { query });
    else return Promise.resolve(null);
  }

  async getDeckNames() {
    return await this.ankiInvoke('deckNames');
  }

  async getModelNames() {
    return await this.ankiInvoke('modelNames');
  }

  async getModelFieldNames(modelName) {
    return await this.ankiInvoke('modelFieldNames', { modelName });
  }

  async getVersion() {
    let version = await this.ankiInvoke('version', {}, 100);
    return version ? 'ver:' + version : null;
  }
}
