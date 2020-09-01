/* global api */
class enen_TheFreeDictionary {
    constructor(options) {
        this.options = options
        this.maxexample = 2
        this.word = ''
    }

    async displayName() {
        let locale = await api.locale()
        if (locale.indexOf('CN') != -1) return 'The Free Dictionary英英词典'
        if (locale.indexOf('TW') != -1) return 'The Free Dictionary英英詞典'
        return 'The Free Dictionary'
    }

    setOptions(options) {
        this.options = options
        this.maxexample = options.maxexample
    }

    async findTerm(word) {
        this.word = word
        let results = await Promise.all([
            this.findTheFreeDictionaryIdioms(word),
        ])
        return [].concat(...results).filter((x) => x)
    }

    async findTheFreeDictionaryIdioms(word) {
        let notes = []
        if (!word) return notes // return empty notes

        // function T(node) {
        //     if (!node) return ''
        //     else return node.innerText.trim()
        // }
        let doc = ''

        const suggestionBase =
            'https://www.thefreedictionary.com/_/search/suggest.ashx?jsonp=SAYT.Callback&query='
        const wordArr = word.split(' ')
        const quotesRegexp = /".+?"/g
        // let foundIdiom = ''
        let hasSuggestion = false
        let idiom = ''
        for (let wordNum = 2; wordNum <= wordArr.length; ++wordNum) {
            const idiomPrefix = word.split(' ').slice(0, wordNum).join(' ')
            const suggestionBaseUrl =
                suggestionBase + encodeURIComponent(idiomPrefix)
            try {
                let data = await api.fetch(suggestionBaseUrl)
                // console.log(data)
                let parser = new DOMParser()
                doc = parser
                    .parseFromString(data, 'text/html')
                    .querySelector('body').textContent
                if (!doc) {
                    console.error(suggestionBaseUrl)
                    return []
                }
                let foundIdioms
                if (doc.split(', ')[1]) {
                    foundIdioms = [...doc.split(', ')[1].matchAll(quotesRegexp)]
                } else {
                    console.error(doc)
                    foundIdioms = []
                }
                if (foundIdioms.length === 0) {
                    if (hasSuggestion === false) {
                        return []
                    } else {
                        --wordNum
                        break
                    }
                }
                hasSuggestion = true
                idiom = idiomPrefix
            } catch (err) {
                console.error(err)
                return []
            }
        }

        const base =
            'https://idioms.thefreedictionary.com/_/search.aspx?tab=1024&SearchBy=0&TFDBy=0&Word='
        let url = base + encodeURIComponent(idiom)
        try {
            let data = await api.fetch(url)
            let parser = new DOMParser()
            doc = parser.parseFromString(data, 'text/html')
        } catch (err) {
            console.error(err)
            return []
        }

        const contentHolder = doc.querySelector('.content-holder')
        if (!contentHolder) return []

        const expression = contentHolder.querySelector('h1').textContent

        const section = contentHolder.querySelector('section[data-src]')
        if (!section) return []

        // make definition segement
        const definitions = []
        const defBlock = section.querySelector('.ds-single')
        let defBlocks
        if (!defBlock) {
            defBlocks = section.querySelectorAll('.ds-list')
        } else {
            defBlocks = [defBlock]
        }
        if (defBlocks.length === 0) return []

        const pos = '<span class="pos">phrase</span>'

        for (const defBlock of defBlocks) {
            let examps = defBlock.querySelectorAll('span.illustration') || []
            for (const examp of examps) {
                examp.remove()
            }

            let eng_tran = defBlock.textContent
            if (!eng_tran) continue
            let definition = ''
            eng_tran = `<span class='eng_tran'>${eng_tran}</span>`
            let tran = `${pos}<span class='tran'>${eng_tran}</span>`
            definition += `${tran}`

            // make exmaple segement
            if (examps.length > 0 && this.maxexample > 0) {
                definition += '<ul class="sents">'
                for (const [index, examp] of examps.entries()) {
                    if (index > this.maxexample - 1) break // to control only 2 example sentence.
                    const eng_examp = examp.textContent
                    definition += eng_examp
                        ? `<li class='sent'><span class='eng_sent'>${eng_examp}</span></li>`
                        : ''
                }
                definition += '</ul>'
            }
            definition && definitions.push(definition)
        }
        let css = this.renderCSS()
        notes.push({
            css,
            expression,
            definitions,
        })
        return notes
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
            </style>`
        return css
    }
}
