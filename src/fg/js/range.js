function rangeFromPoint(point) {
  if (!document.caretRangeFromPoint) {
    document.caretRangeFromPoint = (x, y) => {
      const position = document.caretPositionFromPoint(x, y);
      if (position && position.offsetNode && position.offsetNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.setEnd(position.offsetNode, position.offset);
        return range;
      }
      return null;
    };
  }

  return document.caretRangeFromPoint(point.x, point.y);
}

// const _caretRangeFromPoint = (x, y) => {
//   if (typeof document.caretRangeFromPoint === 'function') {
//     // Chrome, Edge
//     return document.caretRangeFromPoint(x, y);
//   }

//   if (typeof document.caretPositionFromPoint === 'function') {
//     // Firefox
//     return _caretPositionFromPoint(x, y);
//   }

//   // No support
//   return null;
// };

// const _caretPositionFromPoint = (x, y) => {
//   const position = document.caretPositionFromPoint(x, y);
//   if (position === null) {
//     return null;
//   }
//   const node = position.offsetNode;
//   if (node === null) {
//     return null;
//   }

//   const range = document.createRange();
//   const offset = node.nodeType === Node.TEXT_NODE ? position.offset : 0;
//   try {
//     range.setStart(node, offset);
//     range.setEnd(node, offset);
//   } catch (e) {
//     // Firefox throws new DOMException("The operation is insecure.")
//     // when trying to select a node from within a ShadowRoot.
//     return null;
//   }
//   return range;
// };

// const _caretRangeFromPointExt = (x, y, elements) => {
//   const modifications = [];
//   try {
//     let i = 0;
//     let startContinerPre = null;
//     while (true) {
//       const range = _caretRangeFromPoint(x, y);
//       if (range === null) {
//         return null;
//       }

//       const startContainer = range.startContainer;
//       if (startContinerPre !== startContainer) {
//         if (this._isPointInRange(x, y, range)) {
//           return range;
//         }
//         startContinerPre = startContainer;
//       }

//       i = this._disableTransparentElement(elements, i, modifications);
//       if (i < 0) {
//         return null;
//       }
//     }
//   } finally {
//     if (modifications.length > 0) {
//       this._restoreElementStyleModifications(modifications);
//     }
//   }
// };

// const wordRegex = /[\w'’()/,.$-]/;

class TextSourceRange {
  constructor(range) {
    this.rng = range;
  }

  text() {
    return this.rng.toString();
  }

  setWordRange(forwardcount) {
    // let backwardcount = 1
    // let forwardcount = 6

    if (this.rng.startContainer.data) {
      this.setStartOffset(forwardcount);
      this.setEndOffset(forwardcount);
    }
    return null;
  }

  // backwardcount can only be 1 now
  setStartOffset(forwardcount) {
    let pos = this.rng.startOffset;
    let count = 0;
    const text = this.rng.startContainer.textContent;
    let wordStartRegex;
    if (forwardcount === 1) {
      wordStartRegex = /[\w'’-]/;
    } else {
      wordStartRegex = /[\w'’(),.-]/;
    }
    while (pos >= 1) {
      count += wordStartRegex.test(text[pos - 1]) ? 0 : 1;
      if (count === 1) {
        break;
      } else {
        --pos;
      }
    }
    this.rng.setStart(this.rng.startContainer, pos);
  }

  setEndOffset(forwardcount) {
    let pos = this.rng.endOffset;
    // let endContainer = this.rng.endContainer;
    let text = this.rng.endContainer.textContent;
    if (forwardcount === 1) {
      const word = text.substr(pos).match(/[-A-Za-z']+/)[0];
      this.rng.setEnd(this.rng.endContainer, pos + word.length);
    } else {
      const wordEndRegex = /[\w'’()/,.$-]/;
      const wordSpaceRegex = /[\w'’()/,.$ -]/;
      let count = wordEndRegex.test(text[pos]) ? 0 : 1;
      // if (pos === text.length && count < forwardcount) {
      //   if (endContainer.nextSibling) {
      //     endContainer = endContainer.nextSibling;
      //     text = endContainer.textContent;
      //     pos = 0;
      //   } else if (
      //     endContainer.parentElement.textContent === endContainer.textContent &&
      //     endContainer.parentElement.nextSibling
      //   ) {
      //     endContainer = endContainer.parentElement.nextSibling;
      //     text = endContainer.textContent;
      //     pos = 0;
      //   }
      // }
      while (pos < text.length && wordSpaceRegex.test(text[pos])) {
        count += text[pos] === ' ' ? 1 : 0;
        pos += 1;
        if (count === forwardcount) {
          break;
        }
      }
      this.rng.setEnd(this.rng.endContainer, pos);
    }
  }

  selectText() {
    // this.setWordRange()
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(this.rng.cloneRange());
  }

  // deselect() {
  //     const selection = window.getSelection()
  //     selection.removeAllRanges()
  // }
}
