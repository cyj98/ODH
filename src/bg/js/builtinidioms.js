/* global nlp */
const matchExact = (r, str) => {
  const match = str.match(r);
  return match && str === match[0];
};
const countWordNum = (str) => (str.match(/ /g) || []).length + 1;
const checkMatch = (idiomWord, word, tags, nounIndex, wordIndex) => {
  if (idiomWord !== word) {
    switch (idiomWord) {
      case 'oneself':
        return word.endsWith('self') ? wordIndex : 0;
      case 'somebody':
        return matchExact(/sb.?|somebody|someone|one/, word) ||
          tags.indexOf('Person') !== -1 ||
          (tags.indexOf('Pronoun') !== -1 && word !== 'it')
          ? wordIndex
          : -1;
      case `somebody's`:
        return tags.indexOf('Singular') !== -1 && tags.indexOf('Possessive') !== -1
          ? wordIndex
          : -1;
      case 'something':
        if (nounIndex) {
          return nounIndex;
        } else {
          return matchExact(/sth.?|something|it/, word) ||
            (tags.indexOf('Noun') !== -1 &&
              tags.indexOf('Person') === -1 &&
              tags.indexOf('Pronoun') === -1)
            ? wordIndex
            : -1;
        }
      case `something's`:
        return tags.indexOf('Singular') === -1 && tags.indexOf('Possessive') !== -1
          ? wordIndex
          : -1;
      default:
        return -1;
    }
  }
  return wordIndex;
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
    const wordNlp = nlp(originalWord.toLowerCase().trim().replace(`’`, `'`)).contract();
    const lowercaseWord = wordNlp.text();

    const wordTags = [];
    wordNlp.json()[0].terms.forEach((obj) => {
      if (obj.text) {
        wordTags.push(obj.tags);
      }
    });
    const nounIndexObj = {};
    let adjIndex = -1;
    const wordArrTmp = lowercaseWord.split(' ');
    wordTags.forEach((tags, index) => {
      const hasAdj = tags.some(
        // because compromise will recognize self as Possessive
        (tag) =>
          tag.match(/Possessive|Adjective|Determiner/) && !wordArrTmp[index].endsWith('self'),
      );
      if (hasAdj && adjIndex === -1) {
        adjIndex = index;
      } else if (!hasAdj && adjIndex !== -1) {
        const hasNoun = tags.some((tag) => tag === 'Noun');
        if (hasNoun) {
          nounIndexObj[adjIndex] = index;
        }
        adjIndex = -1;
      }
    });

    let infinitiveWord = '';
    let singularWord = '';
    let singularInfinitiveWord = '';
    let infinitiveWordNlp;
    if (wordTags.some((tags) => tags.indexOf('Verb') !== -1 && tags.indexOf('Infinitive') === -1)) {
      infinitiveWordNlp = nlp(lowercaseWord).verbs().toInfinitive().all();
      infinitiveWord = infinitiveWordNlp.text();
    }
    if (wordTags.some((tags) => tags.indexOf('Noun') !== -1 && tags.indexOf('Plural') !== -1)) {
      singularWord = wordNlp.nouns().toSingular().all().text();
      if (infinitiveWord) {
        singularInfinitiveWord = infinitiveWordNlp.nouns().toSingular().all().text();
      }
    }
    const descreaseWordNum = countWordNum(originalWord) - countWordNum(lowercaseWord);

    let foundIdiom = '';
    let formattedWord = '';
    let foundWordIndex = -1;
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

      let leftParenthesisIndex = -1;
      let wordIndex = 0;
      let newWordIndex = -1;

      for (let i = 0; i < idiomArr.length; ++i) {
        // if (originalIdiom === `make (someone, something, or oneself) a laughingstock`)
        if (wordArr.length < i + 1) {
          if (idiomArr[wordArr.length][0] !== '(' || idiom.indexOf(')') !== idiom.length - 1) {
            newWordIndex = -1;
          }
          break;
        }
        if (idiomArr[i].indexOf('(') !== -1) leftParenthesisIndex = i;
        idiomArr[i] = idiomArr[i].replace(/[()]/g, '');

        if (idiomArr[i].indexOf('/') !== -1) {
          idiomArr[i].split('/').some((newIdiom) => {
            newWordIndex = checkMatch(
              newIdiom,
              wordArr[wordIndex],
              wordTags[wordIndex],
              nounIndexObj[wordIndex],
              wordIndex,
            );
            return newWordIndex !== -1;
          });
        } else {
          newWordIndex = checkMatch(
            idiomArr[i],
            wordArr[wordIndex],
            wordTags[wordIndex],
            nounIndexObj[wordIndex],
            wordIndex,
          );
        }
        if (newWordIndex === -1) {
          if (leftParenthesisIndex !== -1 && leftParenthesisIndex <= i) {
            idiom = idiom.replace(/ *\([^)]*\)/, '');
            idiomArr = idiom.split(' ');
            const originalIdx = i;
            i = leftParenthesisIndex - 1;
            wordIndex -= originalIdx - i;
            leftParenthesisIndex = -1;
          } else {
            break;
          }
        } else {
          wordIndex = newWordIndex;
        }
        ++wordIndex;
      }
      if (newWordIndex !== -1) {
        // check for less word num for idioms with parentheses
        if (countWordNum(idiom) > countWordNum(foundIdiom)) {
          foundIdiom = originalIdiom;
          foundWordIndex = wordIndex;
        }
      }
    });

    if (foundIdiom) {
      const matchWordNum = foundWordIndex + descreaseWordNum;
      const matchWord = originalWord.split(' ').slice(0, matchWordNum).join(' ');
      return JSON.stringify({ foundIdiom, matchWord, sections: dict[foundIdiom].sections });
    }
    return null;
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
