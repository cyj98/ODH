function rangeFromPoint(point) {
    if (!document.caretRangeFromPoint) {
        document.caretRangeFromPoint = (x, y) => {
            const position = document.caretPositionFromPoint(x, y)
            if (
                position &&
                position.offsetNode &&
                position.offsetNode.nodeType === Node.TEXT_NODE
            ) {
                const range = document.createRange()
                range.setStart(position.offsetNode, position.offset)
                range.setEnd(position.offsetNode, position.offset)
                return range
            }
            return null
        }
    }

    return document.caretRangeFromPoint(point.x, point.y)
}

class TextSourceRange {
    constructor(range) {
        this.rng = range
    }

    text() {
        return this.rng.toString()
    }

    setWordRange(backwardcount, forwardcount) {
        // let backwardcount = 1
        // let forwardcount = 6
        if (this.rng.startContainer.data) {
            this.setStartOffset(backwardcount)
            this.setEndOffset(forwardcount)
        }
        return null
    }

    // backwardcount can only be 1 now
    setStartOffset(backwardcount) {
        let pos = this.rng.startOffset
        let count = 0
        const text = this.rng.startContainer.textContent
        const wordRegex = /[-|A-Z|a-z]/
        while (pos >= 1) {
            count += wordRegex.test(text[pos - 1]) ? 0 : 1
            if (count === backwardcount) {
                break
            } else {
                --pos
            }
        }
        this.rng.setStart(this.rng.startContainer, pos)
    }

    setEndOffset(forwardcount) {
        let pos = this.rng.endOffset
        const text = this.rng.endContainer.textContent
        const wordRegex = /[-|A-Z|a-z]/
        const wordSpaceRegex = /[-|A-Z|a-z| ]/
        let count = wordRegex.test(text[pos]) ? 0 : 1
        while (wordSpaceRegex.test(text[pos]) && pos < text.length) {
            count += text[++pos] === ' ' ? 1 : 0
            if (count === forwardcount) {
                break
            }
        }
        this.rng.setEnd(this.rng.endContainer, pos)
    }

    selectText() {
        // this.setWordRange()
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(this.rng.cloneRange())
    }

    // deselect() {
    //     const selection = window.getSelection()
    //     selection.removeAllRanges()
    // }
}
