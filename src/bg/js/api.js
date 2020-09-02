// /*global Agent */
/* global Builtin */
// class SandboxAPI {
class backendAPI {
    constructor() {
        this.builtin = new Builtin()
        this.builtin.loadData()
        // this.agent = new Agent(window.parent)
    }

    // async postMessage(action, params) {
    //     return new Promise((resolve, reject) => {
    //         try {
    //             // this.agent.postMessage(action, params, (result) =>
    //             //     resolve(result)
    //             // )
    //             window.parent.postMessage(action, params, (result) =>
    //                 resolve(result)
    //             )
    //         } catch (err) {
    //             console.error(err)
    //             reject(null)
    //         }
    //     })
    // }

    // async deinflect(word) {
    //     return await this.postMessage('Deinflect', { word })
    // }

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
        })
        return response.text()
    }

    async getBuiltin(dict, word) {
        return this.builtin.getBuiltin(dict, word)
        // return await this.postMessage('getBuiltin', { dict, word })
    }

    // async getCollins(word) {
    // return await this.postMessage('getCollins', { word })
    // }

    // async getOxford(word) {
    // return await this.postMessage('getOxford', { word })
    // }

    async locale() {
        return chrome.i18n.getUILanguage()
        // return await this.postMessage('getLocale', {})
    }

    // callback(data, callbackId) {
    //     this.postMessage('callback', { data, callbackId })
    // }

    // initBackend() {
    //     this.postMessage('initBackend', {})
    // }
}

window.api = new backendAPI()
