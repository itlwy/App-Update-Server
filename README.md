# App-Update-Server
​	This library cooperates with another library of "AppSmartUpdate", and it provides update service/这个Nodejs服务例子主要配合APK自动更新库 :[AppSmartUpdate](https://github.com/itlwy/AppSmartUpdate)的使用

## 目录结构

src

	-public
	
		-app
	
			-UpdateManifest.json
	
		-index.css
	
		-index.html
	
		-index.js
	
	-utils
	
		-file_utils.js
	
	-publish_task.js
	
	-server.js
	
	-uploader.js


​	

## 安装

​	下载源码后，终端切换到项目根目录，执行：

```bash
npm install
```



## 运行

```
npm run start
```



## 发布应用

服务运行起来后，访问：http://<本机IP>:8000，即可畅快使用发布功能le~

### 首次使用

可以看到如下图1

​	![图1](https://github.com/itlwy/App-Update-Server/blob/master/resources/pic1.png)

​	首次使用发布功能时，版本号均为0，此时只需要设置首次发布的版本号即可，"强制更新"和"最低差分版本"会自动同步"发布版本号"。即，首次发布如下图：

![图2](https://github.com/itlwy/App-Update-Server/blob/master/resources/pic2.png)

### 非首次使用

![图3](https://github.com/itlwy/App-Update-Server/blob/master/resources/pic3.png)

​	可根据需要设置强制更新版本号和最低差分版本号，含义详见 APK自动更新库 :[AppSmartUpdate](https://github.com/itlwy/AppSmartUpdate)
