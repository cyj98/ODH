/* global nlp */
const matchExact = (r, str) => {
  const match = str.match(r);
  return match && str === match[0];
};
const countWordNum = (str) => (str.match(/ /g) || []).length + 1;
const checkMatch = (idiomWord, word, tags) => {
  if (idiomWord !== word) {
    switch (idiomWord) {
      case 'oneself':
        return word.endsWith('self');
      case 'somebody':
        return (
          matchExact(/sb.?|somebody|someone|one/, word) ||
          tags.indexOf('Person') !== -1 ||
          (tags.indexOf('Pronoun') !== -1 && word !== 'it')
        );
      case `somebody's`:
        return tags.indexOf('Singular') !== -1 && tags.indexOf('Possessive') !== -1;
      case 'something':
        return (
          matchExact(/sth.?|something|it/, word) ||
          (tags.indexOf('Noun') !== -1 &&
            tags.indexOf('Person') === -1 &&
            tags.indexOf('Pronoun') === -1)
        );
      case `something's`:
        return tags.indexOf('Singular') === -1 && tags.indexOf('Possessive') !== -1;
      default:
        return false;
    }
  }
  return true;
};

class BuiltinIdioms {
  constructor() {
    this.dicts = {};
  }

  async loadData() {
    this.dicts['theFreeDictionary'] = await BuiltinIdioms.loadData('data/theFreeDictionary.json');
  }

  findTerm(dictname, originalWord) {
    const dict = this.dicts[dictname];
    // console.time('dict');
    let lowercaseWord = originalWord.toLowerCase();
    const wordNlp = nlp(lowercaseWord);
    const wordTagsTmp = wordNlp.out('tags');
    const wordTags = Object.values(wordTagsTmp[0]);
    let infinitiveWord = '';
    let singularWord = '';
    let singularInfinitiveWord = '';
    if (!lowercaseWord.match(/(she's|he's)/)) {
      if (
        wordTags.some((tags) => tags.indexOf('Verb') !== -1 && tags.indexOf('Infinitive') === -1)
      ) {
        infinitiveWord = wordNlp.verbs().toInfinitive().all().contract().text();
      }
      if (wordTags.some((tags) => tags.indexOf('Noun') !== -1 && tags.indexOf('Plural') !== -1)) {
        singularWord = wordNlp.nouns().toSingular().all().contract().text();
        if (infinitiveWord) {
          singularInfinitiveWord = nlp(infinitiveWord).nouns().toSingular().all().contract().text();
        }
      }
      lowercaseWord = wordNlp.contract().text();
    }
    // console.log(originalWord, lowercaseWord, infinitiveWord, singularWord, singularInfinitiveWord);
    const descreaseWordNum = countWordNum(originalWord) - countWordNum(lowercaseWord);

    let foundIdiom = '';
    let formattedWord = '';
    Object.keys(dict).forEach((idiom) => {
      let toInfinitiveWord =
        infinitiveWord && Object.values(dict[idiom].inflection).indexOf('NotInfinitive') === -1;
      let toSingularWord =
        singularWord && Object.values(dict[idiom].inflection).indexOf('Plural') === -1;
      if (toSingularWord) {
        if (toInfinitiveWord) {
          formattedWord = singularInfinitiveWord;
        } else {
          formattedWord = singularWord;
        }
      } else {
        if (toInfinitiveWord) {
          formattedWord = infinitiveWord;
        } else {
          formattedWord = lowercaseWord;
        }
      }

      const originalIdiom = idiom;
      idiom = idiom.replace(/([\w']*, )+etc. /, (match) =>
        match.replace(', etc.', '').replace(/, /g, '/'),
      );
      idiom = idiom.replace(/\(([\w']*, )+or [\w']*\)/, (match) =>
        match.replace(/[()]/g, '').replace('or ', '').replace(/, /g, '/'),
      );

      const wordArr = formattedWord.split(' ');
      let idiomArr = idiom.split(' ');

      let isIdiomMatch = false;
      let leftParenthesisIndex = -1;

      for (let i = 0; i < idiomArr.length; ++i) {
        // if (originalIdiom === `one, etc. in a million`)
        // console.log(formattedWord, ':', i, idiom, isIdiomMatch);
        if (wordArr.length < i + 1) {
          if (idiomArr[wordArr.length][0] !== '(' || idiom.indexOf(')') !== idiom.length - 1) {
            isIdiomMatch = false;
          }
          break;
        }
        if (idiomArr[i].indexOf('(') !== -1) leftParenthesisIndex = i;
        idiomArr[i] = idiomArr[i].replace(/[()]/g, '');

        if (idiomArr[i].indexOf('/') !== -1) {
          isIdiomMatch = idiomArr[i]
            .split('/')
            .some((newIdiom) => checkMatch(newIdiom, wordArr[i], wordTags[i]));
        } else {
          isIdiomMatch = checkMatch(idiomArr[i], wordArr[i], wordTags[i]);
        }
        if (isIdiomMatch === false) {
          if (leftParenthesisIndex !== -1 && leftParenthesisIndex <= i) {
            idiom = idiom.replace(/ *\([^)]*\)/, '');
            idiomArr = idiom.split(' ');
            i = leftParenthesisIndex - 1;
            leftParenthesisIndex = -1;
          } else {
            break;
          }
        }
      }
      if (isIdiomMatch) {
        // check for less word num for idioms with parentheses
        foundIdiom = countWordNum(idiom) > countWordNum(foundIdiom) ? originalIdiom : foundIdiom;
      }
    });

    const matchWordNum = countWordNum(lowercaseWord) + descreaseWordNum;
    const matchWord = originalWord.split(' ').slice(0, matchWordNum).join(' ');
    return JSON.stringify({ matchWord, defs: dict[foundIdiom].defs });
    // console.log(originalWord, matchWord, foundIdiom);
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
