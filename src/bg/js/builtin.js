class Builtin {
  constructor() {
    this.dicts = {};
  }

  async loadData() {
    this.dicts['collins'] = await Builtin.loadData('data/collins.json');
  }

  findTerm(dictname, term) {
    const dict = this.dicts[dictname];
    return Object.prototype.hasOwnProperty.call(dict, term) ? JSON.stringify(dict[term]) : null;
  }

  static async loadData(path) {
    return new Promise((resolve, reject) => {
      let request = {
        url: path,
        type: 'GET',
        dataType: 'json',
        timeout: 5000,
        error: (xhr, status, error) => reject(error),
        success: (data) => resolve(data),
      };
      $.ajax(request);
    });
  }
}
