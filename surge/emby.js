/**
*
* @Title: emby.js
*
* @Description: iOS / macOS 的浏览器中下载视频、使用 Shu 下载、使用 nPlayer 播放、使用 VLC 播放、使用 Infuse 播放。
*
* @author: https://t.me/AppleArcade
*
* @version V1.0
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/

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
    let type = query.type;
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
            let download_info = downloadInfo(host, video_id, media_source, api_key);
            let command = generateCURL(download_info);
            console.log("《" + video_data.SortName + "》 CURL 批量下载命令: " + command + "\n");
            switch(type)
            {
                case "nplayer_play":
                    let nplayer_url_scheme = generateNplayerURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 nPlayer 播放地址: " + nplayer_url_scheme + "\n");
                    $done({status: 301, headers: {Location:nplayer_url_scheme} })
                    break;
                case "shu_download":
                    let shu_download_url = generateShuURL(download_info);
                    console.log("《" + video_data.SortName + "》 Shu 批量下载地址: " + shu_download_url + "\n");
                    $done({status: 301, headers: {Location:shu_download_url} })
                    break;
                case "vlc_play":
                    let vlc_url_scheme = generateVlcURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 VLC 播放地址: " + vlc_url_scheme + "\n");
                    $done({status: 301, headers: {Location:vlc_url_scheme} })
                    break;
                case "infuse_play":
                    let infuse_url_scheme = generateInfuseURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 Infuse 播放地址: " + infuse_url_scheme + "\n");
                    $done({status: 301, headers: {Location:infuse_url_scheme} })
                    break;
                default:
                    download_info.video.url = download_info.video.url.replace(/\/stream\/.+\?mediaSourceId/, '/stream\?mediaSourceId');
                    console.log("《" + video_data.SortName + "》 视频下载地址: " + download_info.video.url + "\n");
                    $done({
                      status: 301,
                      headers: {
                        'Location': download_info.video.url
                      }
                    })
            }
            break;
          }
        }
        $done({});
      }
    });
  }
}

if ($request.url.indexOf('/web/modules/itemcontextmenu.js') != -1) {
    let body = $response.body;
    let find = 'item.CanDownload&&appHost.supports("filedownload")&&commands.push({name:globalize.translate("Download"),id:"download",icon:"cloud_download"}),';
    let replace = 'item.CanDownload&&appHost.supports("filedownload")&&commands.push({name:"\u4e0b\u8f7d\u89c6\u9891",id:"download",icon:"cloud_download"})&&commands.push({name:"\u006e\u0050\u006c\u0061\u0079\u0065\u0072\u0020\u64ad\u653e",id:"nplayer_play",icon:"play_arrow"})&&commands.push({name:"\u0053\u0068\u0075\u0020\u4e0b\u8f7d",id:"shu_download",icon:"cloud_download"})&&commands.push({name:"\u0056\u004c\u0043\u0020\u64ad\u653e",id:"vlc_play",icon:"play_arrow"})&&commands.push({name:"\u0049\u006e\u0066\u0075\u0073\u0065\u0020\u64ad\u653e",id:"infuse_play",icon:"play_arrow"}),';
    body = body.replace(find, replace);
    find = 'default:return commandProcessor.executeCommand(id,item,options).then(getResolveFn(id))';
    replace = 'case"nplayer_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=nplayer_play";require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"shu_download":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=shu_download";require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"vlc_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return true}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=vlc_play";require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"infuse_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=infuse_play";require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;default:return commandProcessor.executeCommand(id,item,options).then(getResolveFn(id))';
    body = body.replace(find, replace);
    $done({status: $response.status, headers: $response.headers, body: body });
}

function downloadInfo (host, video_id, media_source, api_key) {
  let video = new Object();
  video.filename = getFileName(media_source.Path);
  video.url = host + '/Videos/'+ video_id +'/stream/' + encodeURI(video.filename) + '?mediaSourceId=' + media_source.Id + '&static=true&filename=' + encodeURI(video.filename) + '&api_key=' + api_key;
  let subtitles = new Array();
  let array_index = 0;
  for (let key in media_source.MediaStreams) {
    let media_streams = media_source.MediaStreams[key];
    if (media_streams.Type == 'Subtitle' && media_streams.IsExternal == 1 && media_streams.IsTextSubtitleStream == 1 ) {
      let subtitle = new Object();
      subtitle.url = host + '/Videos/'+ video_id +'/' + media_source.Id + '/Subtitles/' + media_streams.Index + '/0/Stream.' + media_streams.Codec + '?api_key=' + api_key;
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

function generateCURL(data) {
  let user_agent = "Emby/2 CFNetwork/1220.1 Darwin/20.3.0";
  let command = "curl -A '" + user_agent + "' -H 'Accept: */*' ";
  command += '-o "' + data.video.filename.replace(/"/g, '\"') + '" ' + '"' + data.video.url.replace(/"/g, '\"') + '" ';

  for (let key in data.subtitles) {
    command +='-o "' + data.subtitles[key].filename.replace(/"/g, '\"') + '" ' + '"' + data.subtitles[key].url + '" ';
  }
  return command;
}

function generateNplayerURLScheme(data) {
  return "nplayer-" + data.video.url;
}

function generateShuURL(data) {
  let user_agent = "Emby/2 CFNetwork/1220.1 Darwin/20.3.0";
  let urls = new Array();
  urls[0] = {
    'header': {
      'User-Agent': user_agent,
    },
    'url': data.video.url,
    'name': data.video.filename,
    'suspend': false,
  };
  for (let key in data.subtitles) {
    urls.push({
      'header': {
        'User-Agent': user_agent,
      },
      'url': data.subtitles[key].url,
      'name': data.subtitles[key].filename,
      'suspend': false,
    });
  }
  return 'shu://gui.download.http?urls=' + encodeURIComponent(JSON.stringify(urls));
}

function generateVlcURLScheme(data) {
  let vlc_x_callback = "vlc-x-callback://x-callback-url/stream?url=" + encodeURIComponent(data.video.url);
  // 添加字幕
  for (let key in data.subtitles) {
    vlc_x_callback += "&sub=" + encodeURIComponent(data.subtitles[key].url);
    break;  // 由于 VLC 的 x-callback-url 限制，只支持加载一个 URL 字幕
  }
  return vlc_x_callback;
}

function generateInfuseURLScheme(data) {
  return "infuse://x-callback-url/play?url=" + encodeURIComponent(data.video.url);
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
