# 使用 AltStore 自签安装 ipa 文件

**AltStore** 是一个类似于 Cydia Impactor 的 ipa 签名工具，它可把**未加壳**的 ipa 文件安装到非越狱的 iOS 系统中，并在 App 签名即将到期前自动续签

## 准备工作

- 系统：Windows 10 或 macOS 系统的电脑
- 一个专门用来签名的 Apple ID 。建议重新注册一个小号来签名，而非使用自己的主 Apple 账号

## 安装 AltServer（电脑端）

打开 [AltStore 官网](https://altstore.io/)，根据自己电脑类型，下载 Windows 或 macOS 的 AltServer 并安装

![iShot2021-02-19 15.03.17](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155211.png)

如果是 macOS 版，还需为系统 **邮件.app** 安装并启用 AltPlugin.mailbundle 插件

## 安装 AltStore（手机端）

![iShot2021-02-19 15.07.01](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155105.png)

先用数据线把手机和电脑连接，然后在 AltServer 上安装 AltStore，此时会要求输入你用来签名的 Apple ID，填写前面准备好的那个小号的账号密码。如果一切顺利，手机上会多出一个名叫 AltStore 的 App

![IMG_00060EF18AC1-1 2](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155212.jpg)

首次打开 AltStore 会提示 “**不受信任的开发者**”

![IMG_5137](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155106.jpg)

此时需要打开手机 **设置**->**通用**->**描述文件与设备管理** ，选择签名用的 Apple ID 账号邮箱

![IMG_5139](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155112.jpg)

“**信任**” 开发者

![iShot2021-02-19 15.26.51](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155112.png)

回到手机桌面，打开 AltStore ，登录签名用的 Apple ID 。和之前的安装 AltStore 时使用的 Apple ID 相同

## 使用 AltStore 安装 ipa

![iShot2021-02-19 15.36.43](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155113.png)

先把要安装的 ipa 文件放到 [Documents](https://itunes.apple.com/app/id364901807) 、[Shu](https://itunes.apple.com/app/id1282297037) 这类文件管理软件中，然后把 ipa 文件通过系统共享面板拷贝到 AltStore 中

![iShot2021-02-19 15.39.27](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155215.png)

签名并安装好 App 后可以，就可以在 AltStore 的 My Apps 中看到

![IMG_5135 2](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155059.jpg)

也可以在手机设置里的信任开发者 App 列表中看见

![IMG_5134](https://raw.githubusercontent.com/tingv/image/MWeb/2021/02/19/20210219155101.jpg)

启动自签安装的 App

## 自动续签

由于非开发者的 Apple ID 签名有效期只有 7 天，所以 7 天后还得继续一次签名。只要保持手机端 AltStore 和电脑端 AltServer 在同一 WIFI 下就会自动续签
