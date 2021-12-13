/**
 * @description [emby调用第三方播放器播放 支持：Infuse、nPlayer、VLC 、IINA、Movist Pro]
 */

let requestURL = $request.url;
let addLink = '/Users';
let embyPlguin = '/plugin/scheme/';
if(requestURL.indexOf(addLink) != -1){  // 添加外部播放器链接
  let host = getHost(requestURL);
  let query = getQueryVariable(requestURL);
  let obj = JSON.parse($response.body);

  let infusePlay = [];
  let nplayerPlay = [];
  let vlcPlay = [];
  let iinaPlay = [];
  let movistproPlay = [];
  let shuDownload = [];

  if(obj.MediaSources){
    obj.MediaSources.forEach((item, index) => {
      let fileName = item['Path'] ? item['Path'].substring(item['Path'].lastIndexOf('/') + 1) : obj.Name;
      let videoUrl = host + '/Videos/'+ obj.Id +'/stream/' + encodeURIComponent(fileName) + '?MediaSourceId='+ item.Id +'&Static=true&api_key='+ query['X-Emby-Token'] + '&filename=' + encodeURIComponent(fileName);
      let shuInfo = [{
        'header': {
          'User-Agent': 'Download',
        },
        'url': videoUrl,
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
          shuInfo.push({
            'header': {
              'User-Agent': 'Download',
            },
            'url': host + '/Videos/'+ obj.Id +'/' + item.Id + '/Subtitles/' + t['Index'] + '/Stream.' + t['Codec'] + '/' + encodeURIComponent(subtitleFileName) + '?api_key=' + query['X-Emby-Token'] + '&filename=' + encodeURIComponent(subtitleFileName),
            'name': subtitleFileName,
            'suspend': false,
          });
        }
      });

      infusePlay.push({
        Url: host + embyPlguin + 'infuse://x-callback-url/play?url='+ encodeURIComponent(videoUrl),
        Name: 'Infuse'+ Name
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
        Name: 'Shu'+ Name
      });
    });
  }

  if(obj.ExternalUrls){ // 兼容终点站的原生 url schema 连接
    obj.ExternalUrls = obj.ExternalUrls.filter(function(item) {
      return !(item.Name.indexOf("Infuse") != -1 || item.Name.indexOf("nPlayer") != -1 || item.Name.indexOf("VLC") != -1 || item.Name.indexOf("IINA") != -1 || item.Name.indexOf("Movist Pro") != -1);
    });
  }

  obj.ExternalUrls = [...nplayerPlay, ...infusePlay, ...vlcPlay, ...shuDownload, ...iinaPlay, ...movistproPlay, ...obj.ExternalUrls];

  $done({
    body: JSON.stringify(obj)
  });
}else if(requestURL.indexOf(embyPlguin) != -1){  // 打开外部播放器
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
}else if(requestURL.indexOf('/Videos/') != -1 && (requestURL.indexOf('/stream/') != -1 || requestURL.indexOf('/Subtitles/') != -1) ){  // 资源路径伪静态
  let query = getQueryVariable(requestURL);
  if (typeof(query['filename']) == "undefined" || query['filename'] == "") {
    $done({});
  }
  let isSurge = typeof $httpClient != "undefined";
    if(isSurge){
    requestURL = $request.url.replace('/' + query['filename'], '');
    $done({
      url: requestURL,
      headers: $request.headers
    });
  } else {
    requestURL = $request.path.replace('/' + query['filename'], '');
    $done({
      path: requestURL,
      headers: $request.headers
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
