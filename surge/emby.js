/**
*
* @Title: emby.js
*
* @Description: 浏览器中下载视频或外挂字幕 ( 如果影片有外挂字幕且选中，则下载外挂字幕文件，否则下载视频文件 )、使用 Shu 下载 ( 如果影片有外挂字幕，则下载全部外挂字幕 )、使用 iOS 版 VLC 下载 ( 如果影片有外挂字幕且选中，则下载外挂字幕文件，否则下载视频文件 )、使用 iOS 版 nPlayer 播放 ( 不支持外挂字幕 )、使用 VLC 播放 ( 支持选中的外挂字幕 )、使用 iOS 和 macOS 版 Infuse 播放 ( 不支持外挂字幕 )。
*
* @author: https://t.me/AppleArcade
*
* @version V1.1
*
* @Copyright: 2021 https://t.me/EmbyPublic All rights reserved.
*
*/

if ($request.url.indexOf('/Users/') != -1) {
  if($response.status==200){
    $response.body = $response.body.replace(/"CanDownload":false,/g, '"CanDownload":true,');
    let body = JSON.parse($response.body);
    let user_id_result = $request.url.match(/\/Users\/(\w{32})/);
    if (typeof(user_id_result) != "undefined") {
      $persistentStore.write(user_id_result[1], 'user_id');
    }
    let query = getQueryVariable($request.url);
    $persistentStore.write(query['X-Emby-Client'], 'X-Emby-Client');
    $persistentStore.write(query['X-Emby-Device-Id'], 'X-Emby-Device-Id');
    $persistentStore.write(query['X-Emby-Client-Version'], 'X-Emby-Client-Version');
    $done({status: 200, headers: $response.headers, body: JSON.stringify(body) });
  }else{
    $done({});
  }
}

if ($request.url.indexOf('/Download') != -1){
  if($response.status==401){
    let host = getHost($request.url);
    let query = getQueryVariable($request.url);
    let video_id = $request.url.match(/\/Items\/(\S*)\/Download/)[1];
    let api_key = query.api_key;
    let media_source_id = query.mediaSourceId;
    let subtitle_stream_index = typeof(query.subtitleStreamIndex) != "undefined" ? query.subtitleStreamIndex : "";
    let type = query.type;
    let user_id = $persistentStore.read('user_id');
    let video_info_url = host + '/Users/' + user_id + '/Items/' + video_id;
    let X_Emby_Client = $persistentStore.read('X-Emby-Client');
    let X_Emby_Device_Id = $persistentStore.read('X-Emby-Device-Id');
    let X_Emby_Client_Version = $persistentStore.read('X-Emby-Client-Version');
    let X_Emby_Authorization = "MediaBrowser Device=\"Download\", DeviceId=\""+X_Emby_Device_Id+"\", Version=\""+X_Emby_Client_Version+"\", Client=\""+X_Emby_Client+"\", Token=\""+api_key+"\"";
    $httpClient.get({
      url: video_info_url,
      headers: {
          "User-Agent": "Download",
          "X-Emby-Authorization": X_Emby_Authorization,
      },
    }, function(error, response, data){
      if (error) {
        $notification.post("影片信息获取失败️", "", error);
        $done();
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
                    $done({status: 302, headers: {Location:shu_download_url}, body: ""});
                    break;
                case "vlc_download":
                    let vlc_download_url_scheme = generateVlcDownloadURLScheme(download_info, subtitle_stream_index);
                    console.log("《" + video_data.SortName + "》 VLC 下载地址:\n" + vlc_download_url_scheme + "\n");
                    $done({status: 302, headers: {Location:vlc_download_url_scheme}, body: ""});
                    break;
                case "nplayer_play":
                    let nplayer_url_scheme = generateNplayerURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 nPlayer 播放地址:\n" + nplayer_url_scheme + "\n");
                    $done({status: 302, headers: {Location:nplayer_url_scheme}, body: ""});
                    break;
                case "vlc_play":
                    let vlc_play_url_scheme = generateVlcPlayURLScheme(download_info, subtitle_stream_index);
                    console.log("《" + video_data.SortName + "》 VLC 播放地址:\n" + vlc_play_url_scheme + "\n");
                    $done({status: 302, headers: {Location:vlc_play_url_scheme}, body: ""});
                    break;
                case "infuse_play":
                    let infuse_url_scheme = generateInfuseURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 Infuse 播放地址:\n" + infuse_url_scheme + "\n");
                    $done({status: 302, headers: {Location:infuse_url_scheme}, body: ""});
                    break;
                case "iina_play":
                    let iina_url_scheme = generateIinaURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 IINA 播放地址:\n" + iina_url_scheme + "\n");
                    $done({status: 302, headers: {Location:iina_url_scheme}, body: ""});
                    break;
                case "movist_pro_play":
                    let movist_pro_scheme = generateMovistProURLScheme(download_info);
                    console.log("《" + video_data.SortName + "》 Movist Pro 播放地址:\n" + movist_pro_scheme + "\n");
                    $done({status: 302, headers: {Location:movist_pro_scheme}, body: ""});
                    break;
                default:
                    if (subtitle_stream_index !== "" && subtitle_stream_index != -1) {
                      let subtitle_download_url = "";
                      for (let key in download_info.subtitles) {
                        if (download_info.subtitles[key].index == subtitle_stream_index) {
                          subtitle_download_url = download_info.subtitles[key].url;
                          break;
                        }
                      }
                      if (subtitle_download_url === "") {
                        console.log("《" + video_data.SortName + "》 视频下载地址:\n" + download_info.video.original_url + "\n");
                        $done({status: 302, headers: {'Location': download_info.video.original_url}, body: ""});
                      }else{
                        console.log("《" + video_data.SortName + "》 字幕下载地址:\n" + subtitle_download_url + "\n");
                        $done({status: 302, headers: {'Location': subtitle_download_url}, body: ""});
                      }
                    }else{
                      console.log("《" + video_data.SortName + "》 视频下载地址:\n" + download_info.video.original_url + "\n");
                      $done({status: 302, headers: {'Location': download_info.video.original_url}, body: ""});
                    }
            }
            break;
          }
        }
        $done({});
      }
    });
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
  $done({status: $response.status, headers: $response.headers, body: body });
}

if ($request.url.indexOf('/web/modules/itemcontextmenu.js') != -1) {
    let body = $response.body;
    let find = ',"MediaStream"===item.Type&&item.IsExternal&&"Subtitle"===item.StreamType&&appHost.supports("filedownload")';
    let replace = '&&commands.push({name:"\u0053\u0068\u0075\u0020\u4e0b\u8f7d\u0020\u0028\u0020\u0069\u004f\u0053\u0020\u652f\u6301\u5916\u6302\u5b57\u5e55\u0020\u0029",id:"shu_download",icon:"download"})&&commands.push({name:"\u0056\u004c\u0043\u0020\u4e0b\u8f7d\u0020\u0028\u0020\u0069\u004f\u0053\u0020\u652f\u6301\u5916\u6302\u5b57\u5e55\u0020\u0029",id:"vlc_download",icon:"download"})&&commands.push({name:"\u006e\u0050\u006c\u0061\u0079\u0065\u0072\u0020\u64ad\u653e\u0020\u0028\u0020\u0069\u004f\u0053\u0020\u0029",id:"nplayer_play",icon:"play_arrow"})&&commands.push({name:"\u0056\u004c\u0043\u0020\u64ad\u653e\u0020\u0028\u0020\u0069\u004f\u0053\u0020\u652f\u6301\u5916\u6302\u5b57\u5e55\u0020\u0029",id:"vlc_play",icon:"play_arrow"})&&commands.push({name:"\u0049\u006e\u0066\u0075\u0073\u0065\u0020\u64ad\u653e\u0020\u0028\u0020\u0069\u004f\u0053\u002f\u006d\u0061\u0063\u004f\u0053\u0020\u0029",id:"infuse_play",icon:"play_arrow"})&&commands.push({name:"\u0049\u0049\u004e\u0041\u0020\u64ad\u653e\u0020\u0028\u0020\u006d\u0061\u0063\u004f\u0053\u0020\u0029",id:"iina_play",icon:"play_arrow"})&&commands.push({name:"\u004d\u006f\u0076\u0069\u0073\u0074\u0020\u0050\u0072\u006f\u0020\u64ad\u653e\u0020\u0028\u0020\u006d\u0061\u0063\u004f\u0053\u0020\u0029",id:"movist_pro_play",icon:"play_arrow"}),"MediaStream"===item.Type&&item.IsExternal&&"Subtitle"===item.StreamType&&appHost.supports("filedownload")';
    body = body.replace(find, replace);
    find = 'default:return commandProcessor.executeCommand(id,item,options).then(getResolveFn(id))';
    replace = 'case"download":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId);if(options.subtitleStreamIndex!==""&&options.subtitleStreamIndex!=-1){var SubtitleDownloadUrl=ItemDownloadUrl+"&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([SubtitleDownloadUrl])})}else{require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])})}return true;case"shu_download":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=shu_download&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"vlc_download":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return true}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=vlc_download&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"nplayer_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=nplayer_play&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"vlc_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return true}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=vlc_play&subtitleStreamIndex="+options.subtitleStreamIndex;require(["multi-download"]).then(function(responses){(0,responses[0])([ItemDownloadUrl])});return true;case"infuse_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=infuse_play&subtitleStreamIndex="+options.subtitleStreamIndex;top.location.href=ItemDownloadUrl;return true;case"iina_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=iina_play&subtitleStreamIndex="+options.subtitleStreamIndex;top.location.href=ItemDownloadUrl;return true;case"movist_pro_play":var mediaSourceId=options?options.mediaSourceId:null;if(mediaSourceId==null){return false}var ItemDownloadUrl=apiClient.getItemDownloadUrl(item.Id,mediaSourceId)+"&type=movist_pro_play&subtitleStreamIndex="+options.subtitleStreamIndex;top.location.href=ItemDownloadUrl;return true;default:return commandProcessor.executeCommand(id,item,options).then(getResolveFn(id))';
    body = body.replace(find, replace);
    $done({status: $response.status, headers: $response.headers, body: body });
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
      subtitle.filename = getFileName(media_streams.Path);
      subtitle.url = host + '/Videos/'+ video_id +'/' + media_source.Id + '/Subtitles/' + media_streams.Index + '/' + encodeURI(subtitle.filename) + '?api_key=' + api_key + '&sub_codec=' + media_streams.Codec + '&filename=' + encodeURI(subtitle.filename);
      subtitle.original_url = host + '/Videos/'+ video_id +'/' + media_source.Id + '/Subtitles/' + media_streams.Index + '/Stream.' + media_streams.Codec + '?api_key=' + api_key;
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
    command +='-o "' + data.subtitles[key].filename.replace(/"/g, '\"') + '" ' + '"' + data.subtitles[key].original_url + '" ';
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
      'url': data.subtitles[key].original_url,
      'name': data.subtitles[key].filename,
      'suspend': false,
    });
  }
  return 'shu://gui.download.http?urls=' + encodeURIComponent(JSON.stringify(urls));
}

function generateVlcPlayURLScheme(data, subtitle_stream_index) {
  let vlc_x_callback = "vlc-x-callback://x-callback-url/stream?url=" + encodeURIComponent(data.video.url);
  for (let key in data.subtitles) {
    if (data.subtitles[key].index == subtitle_stream_index) {
      vlc_x_callback += "&sub=" + encodeURIComponent(data.subtitles[key].url);
      break;
    }
  }
  return vlc_x_callback;
}

function generateVlcDownloadURLScheme(data, subtitle_stream_index) {
    let download_file = data.video.url;
    let download_filename = data.video.filename;
    for (let key in data.subtitles) {
      if (data.subtitles[key].index == subtitle_stream_index) {
        download_file = data.subtitles[key].url;
        download_filename = data.subtitles[key].filename;
        break;
      }
    }
    let vlc_x_callback = "vlc-x-callback://x-callback-url/download?url=" + encodeURIComponent(download_file) + "&filename=" + encodeURIComponent(download_filename);
    return vlc_x_callback;
}

function generateInfuseURLScheme(data) {
  return "infuse://x-callback-url/play?url=" + encodeURIComponent(data.video.url);
}

function generateIinaURLScheme(data) {
  return "iina://weblink?url=" + encodeURIComponent(data.video.url);
}

function generateMovistProURLScheme(data) {
  let info = JSON.stringify({
    "url": data.video.url,
    "title": data.video.filename,
  });
  return "movistpro:" + encodeURIComponent(info);
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
