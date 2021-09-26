/**
*
* @Title: download_path_rename.js
*
* @Description: 下载路径重命名
*
* @author: https://t.me/AppleArcade
*
* @version V1.1
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/
if ($request.url.indexOf('/Videos/') != -1 && $request.url.indexOf('/Subtitles/') != -1 && $request.method == 'GET') {
    let query = getQueryVariable($request.url);
    if (typeof(query.sub_codec) == "undefined" && query.sub_codec == "" && typeof(query.filename) == "undefined" || query.filename == "") {
        $done({});
    }
    $request.url = $request.url.replace('/' + query.filename, '/Stream.' + query.sub_codec);
    $done({
        url: $request.url,
        headers: $request.headers
    });
} else if ($request.url.indexOf('/Videos/') != -1 && $request.method == 'GET') {
    let query = getQueryVariable($request.url);
    if (typeof(query.filename) == "undefined" || query.filename == "") {
        $done({});
    }
    $request.url = $request.url.replace('/' + query.filename, '');
    $done({
        url: $request.url,
        headers: $request.headers
    });
}else{
    $done({});
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
