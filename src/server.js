'use strict'

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var express = require('express');
var bsdiff = require('bsdiff-nodejs');
var manifest_file = path.join(__dirname, 'public/app/UpdateManifest.json');
var rootPath = path.join(__dirname, 'public/app');
var uploader = require('./uploader')({
    destination: rootPath + '/temp'
});

var app = express();
app.use(express.static(path.join(__dirname, 'public')));

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
    uploader.handle(req, res, function (err) {
        if (err) {
            res.status(500).end(`parse post body occur some errors , error:${err.code} ,message:${err.message}`);
            console.error(err);
            return;
        }
        if (req.file) {
            handleUpdate(req, res);
        } else {
            res.status(400).end(`the new apk file must provide!!!`);
        }
    });
});

var httpBasePath = 'http://192.168.2.107:8000/public/app';

var handleUpdate = function (req, res) {

    var manifest_str = fs.readFileSync(manifest_file).toString();
    var manidest_obj = JSON.parse(manifest_str);

    var publishTextInfo = req.body.publishTextInfo;
    var apkVersion = req.body.apkVersion;   // 最新apk版本
    var forceVersion = req.body.forceVersion;  //强制更新版本
    var minIncrementalVersion = req.body.minIncrementalVersion;  //最低差分版本
    var destPath = rootPath;
    var newAPKPath = req.file.path;

    if (manidest_obj.newVersion != 0) {
        // need diff
        var lastVersion = parseInt(apkVersion) - 1
        var lastDir = path.join(destPath, 'v' + lastVersion);
        if (!fs.existsSync(lastDir)) {
            fs.mkdir(lastDir)
        }
        var oldAPKPath = path.join(destPath, req.file.originalname);
        var apkPatchName = lastVersion + 'to' + apkVersion + '.patch';
        var apkPatchPath = path.join(lastDir, apkPatchName); 
        diff(oldAPKPath, newAPKPath, apkPatchPath)
            .then((result) => {
                return readFileMd5(newAPKPath);
            })
            .then((result) => {
                var newAPKHash = result;
                var newAPKStat = fs.statSync(newAPKPath)
                var newAPKSize = newAPKStat.size     // 字节为单位

                var fileName = req.file.originalname
                var dotIndex = fileName.lastIndexOf('.')
                var fileName = fileName.substring(0, dotIndex) + 'v' + lastVersion + fileName.substring(dotIndex, fileName.length);
                fs.renameSync(path.join(destPath, req.file.originalname), path.join(lastDir, fileName));
                fs.renameSync(req.file.path, path.join(destPath, req.file.originalname));

                var patchStat = fs.statSync(apkPatchPath)
                var patchSize = patchStat.size     // 字节为单位

                manidest_obj.minVersion = parseInt(forceVersion);
                manidest_obj.minAllowPatchVersion = parseInt(minIncrementalVersion);
                manidest_obj.newVersion = parseInt(apkVersion);
                manidest_obj.tip = publishTextInfo
                manidest_obj.size = newAPKSize
                manidest_obj.apkURL = path.join(httpBasePath, req.file.originalname);
                manidest_obj.hash = newAPKHash

                manidest_obj.patchInfo['v' + lastVersion] = {
                    patchURL: path.join(httpBasePath, 'v' + lastVersion + '/' + apkPatchName),
                    tip: publishTextInfo + "(本次更新包大小:" + patchSize + 'byte)',
                    hash: newAPKHash,
                    size: patchSize
                }
                fs.writeFileSync(manifest_file, JSON.stringify(manidest_obj, null, 4));
                res.end('publish app succeed');
            })
            .catch((err) => {
                console.error(err);
                res.status(500).end(`bsdiff error , error:${err.code} ,message:${err.message}`);
            });
    } else {
        // first use
        readFileMd5(newAPKPath)
            .then((result) => {
                var newAPKHash = result;
                var newAPKStat = fs.statSync(newAPKPath)
                var newAPKSize = newAPKStat.size     // 字节为单位

                fs.renameSync(req.file.path, path.join(destPath, req.file.originalname));
                manidest_obj.newVersion = parseInt(apkVersion);
                manidest_obj.minVersion = manidest_obj.newVersion;
                manidest_obj.minAllowPatchVersion = manidest_obj.newVersion;

                manidest_obj.tip = publishTextInfo;
                manidest_obj.size = newAPKSize;
                manidest_obj.apkURL = path.join(httpBasePath, req.file.originalname);
                manidest_obj.hash = newAPKHash;
                fs.writeFileSync(manifest_file, JSON.stringify(manidest_obj, null, 4));
                res.end('publish app succeed');
            })
            .catch((err) => {
                console.error(err);
                res.status(500).end(`bsdiff error , error:${err.code} ,message:${err.message}`);
            });
    }
};

var diff = (oldAPKPath, newAPKPath, apkPatchPath) => {
    return new Promise((resolve, reject) => {
        bsdiff.diff(oldAPKPath, newAPKPath, apkPatchPath, (result, err) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};
var readFileMd5 = (url) => {
    return new Promise((reslove) => {
        var md5sum = crypto.createHash('md5');
        var stream = fs.createReadStream(url);
        stream.on('data', function (chunk) {
            md5sum.update(chunk);
        });
        stream.on('end', function () {
            var fileMd5 = md5sum.digest('hex');
            reslove(fileMd5);
        })
    })
}

app.listen(8000, () => { console.log('listening on port 8000') });


