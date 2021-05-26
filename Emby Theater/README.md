# macOS 上完美使用 Emby Theater 方案

## 一、下载并安装 Emby Theater

下载 [EmbyTheater.zip](https://github.com/rartv/EmbyPublic/releases/download/0.0.33/EmbyTheater.zip) 解压出 `Emby Theater.app`，拖到 `应用程序` 文件夹里

*应用源码：[https://github.com/thura10/emby-theater-electron](https://github.com/thura10/emby-theater-electron)*

## 二、安装 mpv

```shell
brew install --HEAD mpv
```

## 三、替换 libass ，字幕就完美了

由于上面安装的 `libmpv` 对于某些中文字幕会乱码，所以下面给出一个解决办法。( 原因: [https://zrstea.com/261/](https://zrstea.com/261/) )

### 步骤：

1. 下载这个 [libass.rb](https://github.com/rartv/EmbyPublic/releases/download/0.0.33/libass.rb) 这个文件。比我保存到了系统下载目录 `~/Downloads` 里；
2. 进入下载目录 `cd ~/Downloads` ；
3. 卸载安装 `libmpv` 时安装的 `libass` ，然后重新编译并安装，命令如下：

```shell
brew uninstall libass --ignore-dependencies && brew install fontconfig 
brew install -s libass.rb
```

*以上三个步骤方案来至: [@PANINI](https://t.me/PAN1N1) 和 [@xinzhe he](https://t.me/hexinzhe)*

## 四、客户端解锁

1. 在 `应用程序`文件夹中找到 `Emby Theater.app`，右键 `显示包内容` 。找到 `Contents/Resources/app/main.js` 文件，用文本编辑器打开；
2. 搜索找到

```javascript
    function getAppBaseUrl() {

        var url = 'https://tv.emby.media';

        //url = 'http://localhost:8088';
        return url;
    }
```

替换为

```javascript
    function getAppBaseUrl() {

        var url = 'https://tv.emby.neko.re';

        //url = 'http://localhost:8088';
        return url;
    }
```

保存即可

*方法来源：[https://neko.re/archives/225.html](https://neko.re/archives/225.html)*
