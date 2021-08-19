if ($request.url.indexOf('/emby/Users/') != -1) {
  if($response.status==200){
    $response.body = $response.body.replace(/"CanDownload":false,/g, '"CanDownload":true,');
    $response.body = $response.body.replace(/"EnableContentDownloading":false,/g, '"EnableContentDownloading":true,');

    let body = JSON.parse($response.body);

    let user_id_result = $request.url.match(/\/emby\/Users\/(\w{32})/);
    if (typeof(user_id_result) != "undefined") {
      $persistentStore.write(user_id_result[1], 'user_id');
    }

    let query = getQueryVariable($request.url);
    $persistentStore.write(query['X-Emby-Client'], 'X-Emby-Client');
    $persistentStore.write(query['X-Emby-Device-Name'], 'X-Emby-Device-Name');
    $persistentStore.write(query['X-Emby-Device-Id'], 'X-Emby-Device-Id');
    $persistentStore.write(query['X-Emby-Client-Version'], 'X-Emby-Client-Version');
    $persistentStore.write(query['X-Emby-Token'], 'X-Emby-Token');

    $done({status: 200, headers: $response.headers, body: JSON.stringify(body) });
  }else{
    $done({});
  }
}

if ($request.url.indexOf('/Download') != -1){
  if($response.status==401){
    let user_id = $persistentStore.read('user_id');
    let X_Emby_Client = $persistentStore.read('X-Emby-Client');
    let X_Emby_Device_Name = $persistentStore.read('X-Emby-Device-Name');
    let X_Emby_Device_Id = $persistentStore.read('X-Emby-Device-Id');
    let X_Emby_Client_Version = $persistentStore.read('X-Emby-Client-Version');
    let X_Emby_Token = $persistentStore.read('X-Emby-Token');
    let X_Emby_Authorization = "MediaBrowser Device=\""+X_Emby_Device_Name+"\", DeviceId=\""+X_Emby_Device_Id+"\", Version=\""+X_Emby_Client_Version+"\", Client=\""+X_Emby_Client+"\", Token=\""+X_Emby_Token+"\"";

    let host = getHost($request.url);
    let query = getQueryVariable($request.url);
    let video_id = $request.url.match(/emby\/Items\/(\S*)\/Download/)[1];
    let api_key = query.api_key;
    let media_source_id = query.mediaSourceId;

    let video_info_url = host + '/emby/Users/' + user_id + '/Items/' + video_id;
    $httpClient.get({
      url: video_info_url,
      headers: {
          "X-Emby-Authorization": X_Emby_Authorization,
      },
    }, function(error, response, data){
      if (error) {
        console.log(error);
        $notification.post("影片信息获取失败️", "", error);
        $done();
      }else{
        let video_data = JSON.parse(data);

        for (let key in video_data.MediaSources) {
          let media_source = video_data.MediaSources[key];
          if (media_source.Id == media_source_id) {
            let download_info = downloadInfo(host, video_id, media_source);

            let command = generateCURL(download_info, X_Emby_Authorization);
            console.log("《" + video_data.SortName + "》 CURL 批量下载命令: " + command + "\n");
            // $notification.post("《" + video_data.SortName + "》 CURL 批量下载命令已生成", "详情请查看日志", command);

            let video_download_url = download_info.video.url + "&api_key=" + api_key;
            console.log("《" + video_data.SortName + "》 视频下载地址: " + video_download_url + "\n");
            $done({
              status: 301,
              headers: {
                'Location': video_download_url + '&filename=' + download_info.video.filename
              }
            })

            break;
          }
        }
          
        $done({});
      }
    });

  }
}

function downloadInfo (host, video_id, media_source) {
  let video = new Object();
  video.url = host + '/Videos/'+ video_id +'/stream?mediaSourceId=' + media_source.Id + '&static=true';
  video.filename = getFileName(media_source.Path);

  let subtitles = new Array();
  let array_index = 0;
  for (let key in media_source.MediaStreams) {
    let media_streams = media_source.MediaStreams[key];
    if (media_streams.Type == 'Subtitle' && media_streams.IsExternal == 1 && media_streams.IsTextSubtitleStream == 1 ) {
      let subtitle = new Object();
      subtitle.url = host + '/Videos/'+ video_id +'/' + media_source.Id + '/Subtitles/' + media_streams.Index + '/0/Stream.' + media_streams.Codec;
      subtitle.filename = getFileName(media_streams.Path);
      subtitles[array_index] = subtitle;
      array_index++;
    }
  }

  return {
    "video": video,
    "subtitles": subtitles,
  }
}

function generateCURL(data, X_Emby_Authorization) {
  let user_agent = "Emby/2 CFNetwork/1220.1 Darwin/20.3.0";
  let command = "curl -A '" + user_agent + "' -H 'X-Emby-Authorization: " + X_Emby_Authorization + "' -H 'Accept: */*' ";
  command += "-o '" + data.video.filename + "' " + "'" + data.video.url + "' ";

  for (let key in data.subtitles) {
    command += "-o '" + data.subtitles[key].filename + "' " + "'" + data.subtitles[key].url + "' ";
  }

  return command;
}

function getFileName(path) {
  return path.substring(path.lastIndexOf('/') + 1);
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

function getHost(url) {
  let index=url.lastIndexOf('/emby/');
  let host = url.substring(0, index);
  if (host.length == 0) {
    return null;
  }else{
    return host;
  }
}
