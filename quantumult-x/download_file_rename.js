/**
*
* @Title: download_file_rename.js
*
* @Description: 浏览器下载文件重命名
*
* @author: https://t.me/AppleArcade
*
* @version V1.0
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/
var $util = util();

if ($request.url.indexOf('/Videos/') != -1 && $request.url.indexOf('&filename=') != -1) {
    if($util.status==200){
    let query = getQueryVariable($request.url);
    if (typeof(query.filename) == "undefined" || query.filename == "") {
        $util.done({});
    }else{
        $response.headers['Content-Disposition'] = 'attachment;filename=' + decodeURI(query.filename);
        $util.done({
            status: 200,
            headers: $response.headers
        })
    }
    }else{
        $util.done({});
    }
}

function getQueryVariable(url){
    let index=url.lastIndexOf('?');
    let query = url.substring(index+1, url.length);
    let vars = query.split("&");
    let querys = new Object();
    for (let i=0; i<vars.length; i++) {
    let pair = vars[i].split("=");
    querys[pair[0]] = pair[1]
    }
    if (Object.keys(querys).length == 0) {
    return null;
    }else{
    return querys;
    }
}

function util() {
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    const notify = (title, subtitle = '', message = '') => {
        if (isQuanX) $notify(title, subtitle, message)
        if (isSurge) $notification.post(title, subtitle, message)
    }
    const write = (value, key) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
    }
    const read = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
    }
    const adapterStatus = (response) => {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else if (response.statusCode) {
                response["status"] = response.statusCode
            }
        }
        return response
    }
    const get = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options,
                method: "GET"
            }
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.get(options, (error, response, body) => {
            callback(error, adapterStatus(response), body)
        })
    }
    const post = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options,
                method: "POST"
            }
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) {
            $httpClient.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
    }
    const done = (value = {}) => {
        if (isQuanX) return $done(value)
        if (isSurge) isRequest ? $done(value) : $done()
    }
    const status = isQuanX ? $response.statusCode : $response.status
    return {
        isRequest,
        notify,
        write,
        read,
        get,
        post,
        done,
        status
    }
}