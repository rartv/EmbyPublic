/**
*
* @Title: EmbyOldServerLogin.js
*
* @Description: 解决 Emby 服务器版本过低，而 Emby 客户端版本过高导致客户端无法登录的问题。(强行登录可能存在其他兼容问题)
*
* @author: https://t.me/AppleArcade
*
* @version V1.0
*
* @Copyright: 2022 https://t.me/EmbyPublic All rights reserved.
*
*/

if ($request.url.indexOf('/system/info/public') != -1) {
  if($response.status==200){
    $response.body = $response.body.replace(/"Version":"\d+\.\d+\.\d+\.\d+"/g, '"Version":"4.7.14.0"');
    console.log($response.body + "\n");
    $done({status: $response.status, headers: $response.headers, body: $response.body });
}else{
    $done({});
  }
}
