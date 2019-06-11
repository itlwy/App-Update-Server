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
                rootPath
            });
            PublishTask.start(req, res);
        } else {
            res.status(400).end(`the new apk file must provide!!!`);
        }
    });
});

app.listen(8000, () => { console.log('listening on port 8000') });

