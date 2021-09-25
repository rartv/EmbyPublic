/**
*
* @Title: emby.js
*
* @Description: iOS / macOS 的浏览器中下载视频或外挂字幕 ( 如果影片有外挂字幕且选中，则下载外挂字幕文件，否则下载视频文件 )、使用 Shu 下载 ( 如果影片有外挂字幕，则下载全部外挂字幕 )、使用 nPlayer 播放 ( 不支持外挂字幕 )、使用 VLC 播放 ( 支持选中的外挂字幕 )、使用 Infuse 播放 ( 不支持外挂字幕 )。
*
* @author: https://t.me/AppleArcade
*
* @version V1.0
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/

var $util = util();

if ($request.url.indexOf('/Users/') != -1) {
  if($util.status==200){
    $response.body = $response.body.replace(/"CanDownload":false,/g, '"CanDownload":true,');
    let body = JSON.parse($response.body);
    let user_id_result = $request.url.match(/\/Users\/(\w{32})/);
    if (typeof(user_id_result) != "undefined") {
      $util.write(user_id_result[1], 'user_id');
    }
    let query = getQueryVariable($request.url);
    $util.write(query['X-Emby-Client'], 'X-Emby-Client');
    $util.write(query['X-Emby-Device-Id'], 'X-Emby-Device-Id');
    $util.write(query['X-Emby-Client-Version'], 'X-Emby-Client-Version');
    $util.done({status: "HTTP/1.1 200 OK", headers: $response.headers, body: JSON.stringify(body) });
  }else{
    $util.done({});
  }
}

if ($request.url.indexOf('/Download') != -1){
  if($util.status==401){
    let host = getHost($request.url);
    let query = getQueryVariable($request.url);
    let video_id = $request.url.match(/\/Items\/(\S*)\/Download/)[1];
    let api_key = query.api_key;
    let media_source_id = query.mediaSourceId;
    let subtitle_stream_index = typeof(query.subtitleStreamIndex) != "undefined" ? query.subtitleStreamIndex : "";
    let type = query.type;
    let user_id = $util.read('user_id');
    let video_info_url = host + '/Users/' + user_id + '/Items/' + video_id;
    let X_Emby_Client = $util.read('X-Emby-Client');
    let X_Emby_Device_Id = $util.read('X-Emby-Device-Id');
    let X_Emby_Client_Version = $util.read('X-Emby-Client-Version');
    let X_Emby_Authorization = "MediaBrowser Device=\"Download\", DeviceId=\""+X_Emby_Device_Id+"\", Version=\""+X_Emby_Client_Version+"\", Client=\""+X_Emby_Client+"\", Token=\""+api_key+"\"";
    $util.get({
      url: video_info_url,
      headers: {
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent": "Download",
          "X-Emby-Authorization": X_Emby_Authorization,
      },
    }, function(error, response, data){
      if (error) {
        $util.notify("影片信息获取失败️", "", error);
        $util.done();
      }else{
        let video_data = JSON.parse(data);
        for (let key in video_data.MediaSources) {
          let media_source = video_data.MediaSources[key];
          if (media_source.Id == media_source_id) {
            let download_info = downloadInfo(host, video_id, media_source, api_key);
            let command = generateCURL(download_info);
            // console.log("《" + video_data.SortName + "》 CURL 批量下载命令:\n" + command + "\n");
            switch(type)
            {
                case "shu_download":
                    let shu_download_url = generateShuURL(download_info);
                    console.log("《" + video_data.SortName + "》 Shu 批量下载地址:\n" + shu_download_url + "\n");
                    //$util.done({status: 301, headers: {Location:shu_download_url} });
                    $util.done({body: "Shu download", headers: {Location:shu_download_url}, status: "HTTP/1.1 302 Found"})
                    break;
                case "nplayer_play":
                    let nplayer_url_scheme = generateNplayerURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 nPlayer 播放地址:\n" + nplayer_url_scheme + "\n");
                    $util.done({body: "nPlayer play", headers: {Location:nplayer_url_scheme}, status: "HTTP/1.1 302 Found"})
                    break;
                case "vlc_play":
                    let vlc_url_scheme = generateVlcURLScheme(download_info, subtitle_stream_index);
                    console.log("《" + video_data.SortName + "》 VLC 播放地址:\n" + vlc_url_scheme + "\n");
                    $util.done({body: "VLC play", headers: {Location:vlc_url_scheme}, status: "HTTP/1.1 302 Found"})
                    break;
                case "infuse_play":
                    let infuse_url_scheme = generateInfuseURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 Infuse 播放地址:\n" + infuse_url_scheme + "\n");
                    $util.done({body: "Infuse play", headers: {Location:infuse_url_scheme}, status: "HTTP/1.1 302 Found"})
                    break;
                default:
                    if (subtitle_stream_index !== "" && subtitle_stream_index != -1) {
                      let subtitle_download_url = "";
                      for (let key in download_info.subtitles) {
                        if (download_info.subtitles[key].index == subtitle_stream_index) {
                          subtitle_download_url = download_info.subtitles[key].url + "&filename=" + encodeURI(download_info.subtitles[key].filename);
                          break;
                        }
                      }
                      if (subtitle_download_url === "") {
                        console.log("《" + video_data.SortName + "》 视频下载地址:\n" + download_info.video.original_url + "\n");
                        $util.done({body: "video download", headers: {Location:download_info.video.original_url}, status: "HTTP/1.1 302 Found"})
                      }else{
                        console.log("《" + video_data.SortName + "》 字幕下载地址:\n" + subtitle_download_url + "\n");
                        $util.done({body: "subtitle download", headers: {Location:subtitle_download_url}, status: "HTTP/1.1 302 Found"})
                      }
                    }else{
                      console.log("《" + video_data.SortName + "》 视频下载地址:\n" + download_info.video.original_url + "\n");
                      $util.done({body: "video download", headers: {Location:download_info.video.original_url}, status: "HTTP/1.1 302 Found"})
                    }
            }
            break;
          }
        }
        //$util.done({});
      }
    });
  }else{
    $util.done({});
  }
}

if ($request.url.indexOf('/web/item/item.js') != -1) {
  let body = $response.body;
  let find = 'var selectSource=view.querySelector(".selectSource"),';
  let replace = 'var selectSource=view.querySelector(".selectSource"),selectSubtitles=view.querySelector(".selectSubtitles"),';
  body = body.replace(find, replace);
  find = 'mediaSourceId:selectSource&&selectSource.value||null,';
  replace = 'mediaSourceId:selectSource&&selectSource.value||null,subtitleStreamIndex:selectSubtitles&&selectSubtitles.value||"",';
  body = body.replace(find, replace);
  $util.done({status: "HTTP/1.1 200 OK", headers: $response.headers, body: body });
}

if ($request.url.indexOf('/web/modules/itemcontextmenu.js') != -1) {
    let body = $response.body;
    let find = ',"MediaStream"===item.Type&&item.IsExternal&&"Subtitle"===item.StreamType&&appHost.supports("filedownload")';
    let replace = '&&commands.push({name:"\u0053\u0068\u0075\u0020\u4e0b\u8f7d",id:"shu_download",icon:"download"})&&commands.push({name:"\u006e\u0050\u006c\u0061\u0079\u0065\u0072\u0020\u64ad\u653e",id:"nplayer_play",icon:"play_arrow"})&&commands.push({name:"\u0056\u004c\u0043\u0020\u64ad\u653e",id:"vlc_play",icon:"play_arrow"})&&commands.push({name:"\u0049\u006e\u0066\u0075\u0073\u0065\u0020\u64ad\u653e",id:"infuse_play",icon:"play_arrow"}),"MediaStream"===item.Type&&item.IsExternal&&"Subtitle"===item.StreamType&&appHost.supports("filedownload")';
    body = body.replace(find, replace);
    find = 'default:return commandProcessor.executeCommand(id,item,options).then(getResolveFn(id))';
    replace = 'case"download":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId);if(options.subtitleStreamIndex!==""&&options.subtitleStreamIndex!=-1){var SubtitleDownloadUrl=ItemDownloadUrl+"&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([SubtitleDownloadUrl])})}else{require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])})}return true;case"nplayer_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=nplayer_play&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"shu_download":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=shu_download&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"vlc_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return true}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=vlc_play&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"infuse_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=infuse_play&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;default:return commandProcessor.executeCommand(id,item,options).then(getResolveFn(id))';
    body = body.replace(find, replace);
    $util.done({status: "HTTP/1.1 200 OK", headers: $response.headers, body: body });
}

function downloadInfo (host, video_id, media_source, api_key) {
  let video = new Object();
  video.filename = getFileName(media_source.Path);
  video.url = host + '/Videos/'+ video_id +'/stream/' + encodeURI(video.filename) + '?mediaSourceId=' + media_source.Id + '&static=true&api_key=' + api_key + '&filename=' + encodeURI(video.filename);
  video.original_url = host + '/Videos/'+ video_id +'/stream?mediaSourceId=' + media_source.Id + '&static=true&api_key=' + api_key + '&filename=' + encodeURI(video.filename);
  let subtitles = new Array();
  let array_index = 0;
  for (let key in media_source.MediaStreams) {
    let media_streams = media_source.MediaStreams[key];
    if (media_streams.Type == 'Subtitle' && media_streams.IsExternal == 1 && media_streams.IsTextSubtitleStream == 1 ) {
      let subtitle = new Object();
      subtitle.index = media_streams.Index;
      subtitle.url = host + '/Videos/'+ video_id +'/' + media_source.Id + '/Subtitles/' + media_streams.Index + '/Stream.' + media_streams.Codec + '?api_key=' + api_key;
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
  let user_agent = "Download";
  let command = "curl -A '" + user_agent + "' -H 'Accept: */*' ";
  command += '-o "' + data.video.filename.replace(/"/g, '\"') + '" ' + '"' + data.video.original_url.replace(/"/g, '\"') + '" ';
  for (let key in data.subtitles) {
    command +='-o "' + data.subtitles[key].filename.replace(/"/g, '\"') + '" ' + '"' + data.subtitles[key].url + '" ';
  }
  return command;
}

function generateNplayerURLScheme(data) {
  return "nplayer-" + data.video.url;
}

function generateShuURL(data) {
  let user_agent = "Download";
  let urls = new Array();
  urls[0] = {
    'header': {
      'User-Agent': user_agent,
    },
    'url': data.video.original_url,
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

function generateVlcURLScheme(data, subtitle_stream_index) {
  let vlc_x_callback = "vlc-x-callback://x-callback-url/stream?url=" + encodeURIComponent(data.video.url);
  for (let key in data.subtitles) {
    if (data.subtitles[key].index == subtitle_stream_index) {
      vlc_x_callback += "&sub=" + encodeURIComponent(data.subtitles[key].url);
      break;
    }
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
  return url.toLowerCase().match(/^(https?:\/\/.*?)\//)[1];
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