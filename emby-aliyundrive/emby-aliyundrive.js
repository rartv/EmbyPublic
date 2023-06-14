let requestURL = $request.url;
let status = $response.status;

if(requestURL.indexOf('/stream') != -1 && status == 302){
  let headers = $response.headers;
  if (typeof(headers['Location']) != "undefined" && headers['Location'].indexOf('aliyundrive') != -1) {
    $notification.post("阿里云加速成功", "", "");
  }
}

$done({});
