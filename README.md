这是我编写的第一个 nodejs 程序，自动从[大树漫画](https://www.dashuhuwai.com/)抓取航海王（ONE PIECE）漫画图片。本程序仅在 Linux 上通过了测试，如果要在别的系统上使用，可能需要稍微调整代码。本程序不会持续维护，您可以修改代码实现抓取其他漫画。

## 安装依赖

使用包管理器安装 chromium，默认可执行文件路径在 /usr/bin/chromium。

Debian/Ubuntu：

```shell
apt install -y chromium
```

Redhat/Fedora：

```shell
dnf install -y chromium
```

ArchLinux/Manjaro：

```shell
pacman -Sy chromium
```

如果 chromium 不在 /usr/bin/chromium，或使用 chrome，请将 index.js 中的`CHROME_BIN` 修改到正确路径。

安装 nodejs 依赖：

```shell
npm --registry=https://registry.npm.taobao.org install
```

# 运行程序

```shell
node index.js > log.txt
```

# 选项设置

您可以安装您的需求修改 index.js 中的变量，默认设置如下：

```javascript
const CHROME_BIN = '/usr/bin/chromium'; // Linux 使用 chromium
const COMMIC_DIR = 'images'; // 漫画存放路径
const FAILED_URLS_FILE = 'failed-urls.txt'; // 下载失败的 url 存放路径
const FIRST_CHARPER = 1081; // 网站中第一话编号
const CHARPERS = 1034; // ONE PIECE 总话数
```

