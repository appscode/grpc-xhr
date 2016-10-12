var _ = require('lodash');
var RSVP = require('rsvp');
var preset = require('./config');

// Adapted from https://github.com/guidj/jsonuri-js
function mapJSONToUriParams(data, encode, prefix) {
    if (encode === void 0) { encode = true; }
    if (prefix === void 0) { prefix = ""; }

    function JSONToUriParams(data, encode, prefix, call) {
        var map = [];
        if (data instanceof Array) {
            for (var ik = 0; ik < data.length; ik++) {
                map.push(JSONToUriParams(data[ik], encode, prefix, call + 1));
            }
        } else if (data instanceof Object) {
            for (var k in data) {
                var sep = "";
                //not empty
                if (prefix !== "") {
                    if (prefix.slice(-1) !== "]") {
                        sep = ".";
                    }
                }
                map.push(JSONToUriParams(data[k], encode, prefix + sep + k, call + 1));
            }
        } else {
            map.push(prefix + "=" + encodeURIComponent(data));
        }
        if (call == 0 && encode == true) {
            for (var i = 0; i < map.length; i++) {
                map[i] = encodeURIComponent(map[i]);
            }
        }
        return map.join("&");
    }
    return JSONToUriParams(data, encode, prefix, 0);
}

module.exports = function(path, verb, config, p, body) {
    var config = _.merge({}, preset, config);
    if (p) {
        q = mapJSONToUriParams(p);
        if (q) {
            path += '?' + q;
        }
    }
    var promise = new RSVP.Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {

            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(verb, config.domain + path, true);
            xhr.withCredentials = config.withCredentials;
        } else if (typeof XDomainRequest != "undefined") {

            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            xhr = new XDomainRequest();
            xhr.open(method, config.domain + path);
        } else {
            // Otherwise, CORS is not supported by the browser.
            xhr = null;
        }
        for (var key in config.headers) {
            if (config.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, config.headers[key]);
            }
        }
        xhr.onreadystatechange = function() {
            var responseText = this.responseText;
            if (config.skipResponsePrefixLength > 0) {
                responseText = responseText.substring(config.skipResponsePrefixLength);
            }
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    resolve(JSON.parse(responseText));
                } else {
                    reject(this);
                }
            }
        };
        if (body) {
            xhr.send(JSON.stringify(body));
        } else {
            xhr.send();
        }
    });
    return promise;
};
