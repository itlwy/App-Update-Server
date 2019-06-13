'use strict'

var path = require('path');
var express = require('express');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));

var manifest_file = path.join(__dirname, 'public/app/UpdateManifest.json');
var rootPath = path.join(__dirname, 'public/app');
var Uploader = require('./uploader')({
    destination: rootPath + '/temp'
});
var publish_task_func = require('./publish_task');

app.get('/update', (req, res) => {
    var option = {
        headers: {
            "Content-Type": "application/json"
        }
    };
    res.sendFile(manifest_file, option, (err) => {
        if (err) {
            console.error(err);
        } else {
            // console.log('Sent:', file);
        }
    });
});

app.post('/update', (req, res) => {
    Uploader.handle(req, res, function (err) {
        if (err) {
            res.status(500).end(`parse post body occur some errors , error:${err.code} ,message:${err.message}`);
            console.error(err);
            return;
        }
        if (req.file) {
            var PublishTask = new publish_task_func({
                manifest_file,
                rootPath,
                // 此属性设置时，生成的 UpdateManifest.json里的所有文件url会加上此前缀，否则用相对于UpdateManifest的路径来表示
                // baseURLPath:'http://192.168.2.107:8000/app'  
            });
            PublishTask.start(req, res);
        } else {
            res.status(400).end(`the new apk file must provide!!!`);
        }
    });
});

app.listen(8000, () => { console.log('listening on port 8000') });

