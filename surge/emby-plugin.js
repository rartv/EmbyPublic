/**
 * @description [emby调用第三方播放器播放 支持：Infuse、nPlayer、VLC 、IINA、Movist Pro]
 */

let requestURL = $request.url.toLowerCase();
let headers = $request.headers;
let embyPlguin = '/plugin/scheme/';
if(requestURL.indexOf('/users') != -1){  // 添加外部播放器链接
  let host = getHost(requestURL);
  let query = getQueryVariable(requestURL);
  let obj = JSON.parse($response.body);

  // 获取 Emby Token
  let embyToken = typeof(headers['X-Emby-Token']) != "undefined" ? headers['X-Emby-Token'] : query['x-emby-token'];

  let infusePlay = [];
  let infusePlayLater = [];
  let infuseDownload = [];
  let nplayerPlay = [];
  let vlcPlay = [];
  let iinaPlay = [];
  let movistproPlay = [];
  let shuDownload = [];

  if(obj.MediaSources){
    obj.MediaSources.forEach((item, index) => {
      let fileName = item['Path'] ? item['Path'].substring(item['Path'].lastIndexOf('/') + 1) : obj.FileName;
      let suffix = fileName.substring(fileName.lastIndexOf("."));
      let videoUrl = host + '/videos/'+ obj.Id +'/stream/' + encodeURIComponent(fileName) + '?MediaSourceId='+ item.Id +'&Static=true&api_key='+ embyToken + '&filename=' + encodeURIComponent(fileName);
      let externalSubtitles = [];
      let shuVideoUrl = host + '/videos/'+ obj.Id +'/stream' + suffix + '?MediaSourceId='+ item.Id +'&Static=true&api_key='+ embyToken;
      let shuInfo = [{
        'header': {
          'User-Agent': 'Download',
        },
        'url': shuVideoUrl,
        'name': fileName,
        'suspend': false,
      }];

      let Name = '';
      item['MediaStreams'].forEach((t, i) => {
        if(t['Type'] === 'Video'){
          if (item['Name'] && t['DisplayTitle']) {
            Name = ' - ' + item['Name'] + ' (' + t['DisplayTitle'] + ')'
          } else if (item['Name']) {
            Name = ' - ' + item['Name']
          } else if (t['DisplayTitle']) {
            Name = ' - ' + t['DisplayTitle']
          }
        }

        if(t['Type'] === 'Subtitle' && t['IsExternal'] && t['Path']){
          let subtitleFileName = t['Path'].substring(t['Path'].lastIndexOf('/') + 1)
          let subtitleUrl = host + '/videos/'+ obj.Id +'/' + item.Id + '/subtitles/' + t['Index'] + '/stream.' + t['Codec'] + '/' + encodeURIComponent(subtitleFileName) + '?api_key=' + embyToken + '&filename=' + encodeURIComponent(subtitleFileName);
          externalSubtitles.push(subtitleUrl);
          shuInfo.push({
            'header': {
              'User-Agent': 'Download',
            },
            'url': subtitleUrl,
            'name': subtitleFileName,
            'suspend': false,
          });
        }
      });

      // Infuse 播放
      if (externalSubtitles.length == 0) {
        // 无外挂字幕播放
        infusePlay.push({
          Url: host + embyPlguin + 'infuse://x-callback-url/play?url='+ encodeURIComponent(videoUrl),
          Name: 'Infuse播放'+ Name
        });
      } else {
        // 有外挂字幕播放（Infuse 7.6.2 及以上版本）
        infusePlay.push({
          Url: host + embyPlguin + 'infuse://x-callback-url/play?url='+ encodeURIComponent(videoUrl) + '&sub=' + encodeURIComponent(externalSubtitles[0]),
          Name: 'Infuse播放'+ Name
        });
      }

      // Infuse 下载（Infuse 7.6.2 及以上版本）
      infuseDownload.push({
        Url: host + embyPlguin + 'infuse://x-callback-url/save?url='+ encodeURIComponent(videoUrl) + '&download=1',
        Name: 'Infuse下载'+ Name
      });

      // 无外挂字幕稍后播放（Infuse 7.6.2 及以上版本）
      infusePlayLater.push({
        Url: host + embyPlguin + 'infuse://x-callback-url/save?url='+ encodeURIComponent(videoUrl),
        Name: 'Infuse稍后播放'+ Name
      });

      nplayerPlay.push({
        Url: host + embyPlguin + 'nplayer-'+ videoUrl,
        Name: 'nPlayer'+ Name
      });

      vlcPlay.push({
        Url: host + embyPlguin + 'vlc-x-callback://x-callback-url/stream?url='+ encodeURIComponent(videoUrl),
        Name: 'VLC'+ Name
      });

      iinaPlay.push({
        Url: host + embyPlguin + 'iina://weblink?url='+ encodeURIComponent(videoUrl),
        Name: 'IINA'+ Name
      });

      let movistproInfo = {
        "url": videoUrl,
        "title": fileName
      };
      movistproPlay.push({
        Url: host + embyPlguin + 'movistpro:' + encodeURIComponent(JSON.stringify(movistproInfo)),
        Name: 'Movist Pro' + Name
      });

      shuDownload.push({
        Url: host + embyPlguin + 'shu://gui.download.http?urls='+ encodeURIComponent(JSON.stringify(shuInfo)),
        Name: 'Shu下载'+ Name
      });
    });
  }

  if(obj.ExternalUrls){ // 兼容终点站的原生 url schema 连接
    obj.ExternalUrls = obj.ExternalUrls.filter(function(item) {
      return !(item.Name.indexOf("Infuse") != -1 || item.Name.indexOf("nPlayer") != -1 || item.Name.indexOf("VLC") != -1 || item.Name.indexOf("IINA") != -1 || item.Name.indexOf("Movist Pro") != -1);
    });
  } else {
    obj.ExternalUrls = [];
  }

  obj.ExternalUrls = [...infusePlay, ...infusePlayLater, ...infuseDownload, ...shuDownload, ...nplayerPlay, ...vlcPlay, ...iinaPlay, ...movistproPlay, ...obj.ExternalUrls];
  $done({
    body: JSON.stringify(obj)
  });
}else if(requestURL.indexOf(embyPlguin) != -1){  // 打开外部播放器
  requestURL = requestURL.replace("mediasourceid", "MediaSourceId");
  let isSurge = typeof $httpClient != "undefined";
  let LocationURL = requestURL.split(embyPlguin)[1];
  let modifiedStatus = 'HTTP/1.1 302 Found';
  if(isSurge){
    modifiedStatus = 302;
  }
  $done({
    status: modifiedStatus, 
    headers: { Location: LocationURL }, 
    body: ""
  });
}else if(requestURL.indexOf('/videos/') != -1 && (requestURL.indexOf('/stream/') != -1 || requestURL.indexOf('/subtitles/') != -1) ){  // 资源路径伪静态
  let query = getQueryVariable(requestURL);
  if (typeof(query['filename']) == "undefined" || query['filename'] == "") {
    $done({});
  }
  headers['User-Agent'] = "Emby/2 CFNetwork/1410.0.3 Darwin/22.6.0";
  let isSurge = typeof $httpClient != "undefined";
    if(isSurge){
    requestURL = $request.url.replace('/' + query['filename'], '');
    $done({
      url: requestURL,
      headers: headers
    });
  } else {
    requestURL = $request.path.replace('/' + query['filename'], '');
    $done({
      path: requestURL,
      headers: headers
    });
  }
}else {
  $done({});
}

function getHost(url) {
  return url.toLowerCase().match(/^(https?:\/\/.*?)\//)[1];
}

function getQueryVariable(url) {
  let index = url.lastIndexOf('?');
  let query = url.substring(index + 1, url.length);
  let vars = query.split("&");
  let querys = new Object();
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");
    querys[pair[0]] = pair[1]
  }
  if (Object.keys(querys).length == 0) {
    return null;
  } else {
    return querys;
  }
}
