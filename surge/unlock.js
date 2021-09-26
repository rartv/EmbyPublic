/**
*
* @Title: unlock.js
*
* @Description: 客户端播放权限解锁
*
* @author: https://t.me/AppleArcade
*
* @version V1.1
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/

if ($request.url.indexOf('mb3admin.com/admin/service/registration/validateDevice') != -1) {
  if($response.status!=200){
      $done({status: 200, headers: $response.headers, body: '{"cacheExpirationDays":999,"resultCode":"GOOD","message":"Device Valid"}' })
  }else{
      $done({})
  }
}else{
  $done({})
}
