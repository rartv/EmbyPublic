/**
*
* @Title: download_path_rename.js
*
* @Description: 下载路径重命名
*
* @author: https://t.me/AppleArcade
*
* @version V1.0
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/

if ($request.url.indexOf('/Videos/') != -1 && $request.method == 'GET') {
    $request.url = $request.url.replace(/\/stream\/.+\?mediaSourceId/, '/stream\?mediaSourceId');
    $done({
        url: $request.url,
        headers: $request.headers
    });
}else{
    $done({});
}
