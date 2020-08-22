class Builtin {
    constructor() {
        this.dicts = {}
    }

    async loadData() {
        this.dicts['collins'] = await Builtin.loadDazta('data/collins.json')
    }

    findTerm(dictname, term) {
        const dict = this.dicts[dictname]
        return dict.hasOwnProperty(term) ? JSON.stringify(dict[term]) : null
    }

    static async loadData(path) {
        return new Promise((resolve, reject) => {
            let request = {
                ur: path,
                type: 'GET',
                dataType: 'json',
                timeout: 5000,
                error: (xhr, status, error) => reject(error),
                success: (data, status) => resolve(data),
            }
            $.ajax(request)
        })
    }
}
