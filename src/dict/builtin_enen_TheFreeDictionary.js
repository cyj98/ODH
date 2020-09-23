/* global api */
class builtin_enen_TheFreeDictionary {
  constructor(options) {
    this.options = options;
    this.maxexample = 2;
    this.word = '';
  }

  async displayName() {
    let locale = await api.locale();
    if (locale.indexOf('CN') != -1) return 'The Free Dictionary of idioms英英词典';
    if (locale.indexOf('TW') != -1) return 'The Free Dictionary of idioms英英詞典';
    return 'The Free Dictionary of idioms(builtin)';
  }

  setOptions(options) {
    this.options = options;
    this.maxexample = options.maxexample;
  }

  async findTerm(word) {
    this.word = word;
    let results = await Promise.all([this.findTheFreeDictionaryIdioms(word)]);
    return [].concat(...results).filter((x) => x);
  }

  async findTheFreeDictionaryIdioms(word) {
    let notes = [];
    if (!word) return notes;
    let result = {};
    try {
      result = JSON.parse(await api.getBuiltinIdioms('theFreeDictionary', word));
    } catch (err) {
      console.error(err);
      return [];
    }
    console.log(result);

    // //get Collins Data
    if (!result) return notes;

    let expression = result.matchWord;
    let defs = result.defs;
    console.log(defs);

    const pos = '<span class="pos">phrase</span>';
    const definitions = [];

    for (const def of defs) {
      const eng_tran = `<span class='eng_tran'>${def.def_en}</span>`;
      let definition = `${pos}<span class='tran'>${eng_tran}</span>`;
      const examps = def.examp;

      // make exmaple segement
      if (examps.length > 0) {
        definition += '<ul class="sents">';
        for (const [index, examp] of examps.entries()) {
          if (index > this.maxexample - 1) break; // to control only 2 example sentence.
          definition += examp ? `<li class='sent'><span class='eng_sent'>${examp}</span></li>` : '';
        }
        definition += '</ul>';
      }
      definition && definitions.push(definition);
    }
    let css = this.renderCSS();
    notes.push({
      css,
      expression,
      definitions,
    });
    return notes;
  }

  renderCSS() {
    let css = `
              <style>
                  span.band {color:#e52920;}
                  span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                  span.tran {margin:0; padding:0;}
                  span.eng_tran {margin-right:3px; padding:0;}
                  span.chn_tran {color:#0d47a1;}
                  ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                  li.sent  {margin:0; padding:0;}
                  span.eng_sent {margin-right:5px;}
                  span.chn_sent {color:#0d47a1;}
              </style>`;
    return css;
  }
}
