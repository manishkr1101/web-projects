const request = require("request")

const cache = {}

module.exports = {
    getContentLength: (url) => {
        return new Promise((resolve, reject) => {
            if(cache[url]) resolve(cache[url])

            request(url, {
                method: "GET", // HEAD request was not working
                headers: {
                    "range": "bytes=0-1"
                }
            }, (err, res, body) => {
                if(err) {
                    reject(err);
                    return; 
                }
                const contentLength = res.headers['content-range'].split('/')[1];
                cache[url] = Number.parseInt(contentLength);
                resolve(cache[url]);
            })
        })
    }
}