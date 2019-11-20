'use strict'

var bsdiff = require('bsdiff-nodejs');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');


var diff = (oldAPKPath, newAPKPath, apkPatchPath) => {
    return bsdiff.diff(oldAPKPath, newAPKPath, apkPatchPath, (result) => {
        // console.log('diff:' + String(result).padStart(4) + '%');
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
};

var PublishTask = function (options) {
    if (!options) {
        throw new Error('options of PublishTask must be provided')
    }
    this.options = options;
    this.manifest_file = options.manifest_file;
    this.rootPath = options.rootPath;
    this.baseURLPath = options.baseURLPath;
};

PublishTask.prototype.start = function (req, res) {
    this.req = req;
    this.res = res;
    this.origin = this.req.headers.origin;
    var manifest_str = fs.readFileSync(this.manifest_file).toString();
    this.manifest_obj = JSON.parse(manifest_str);

    this.publishTextInfo = this.req.body.publishTextInfo;
    this.apkVersion = this.req.body.apkVersion;   // 最新apk版本
    this.forceVersion = this.req.body.forceVersion;  //强制更新版本
    this.minIncrementalVersion = this.req.body.minIncrementalVersion;  //最低差分版本
    this.originalname = this.req.file.originalname;

    this.newAPKPath = this.req.file.path;
    readFileMd5(this.newAPKPath)
        .then((result) => {
            this.newAPKHash = result;
            if (this.manifest_obj.newVersion != 0) {
                // need diff
                this.diffPublish();
            } else {
                this.fullPublish();
            }
        })
        .catch(this.handleError);
};

PublishTask.prototype.diffPublish = function () {
    var lastVersion = parseInt(this.apkVersion) - 1
    var lastDir = path.join(this.rootPath, 'v' + lastVersion);
    if (!fs.existsSync(lastDir)) {
        fs.mkdirSync(lastDir)
    }
    var oldAPKPath = path.join(this.rootPath, this.originalname);
    if (!fs.existsSync(oldAPKPath)) {
        this.handleError(new Error("can't find last version file, please verify the fileName you uploaded is the same as before"));
        return;
    }

    var apkPatchName = lastVersion + 'to' + this.apkVersion + '.patch';
    var apkPatchPath = path.join(lastDir, apkPatchName);
    diff(oldAPKPath, this.newAPKPath, apkPatchPath)
        .then((result) => {
            var newAPKStat = fs.statSync(this.newAPKPath)
            var newAPKSize = newAPKStat.size     // 字节为单位

            var fileName = this.originalname
            var dotIndex = fileName.lastIndexOf('.')
            var fileName = fileName.substring(0, dotIndex) + 'v' + lastVersion + fileName.substring(dotIndex, fileName.length);
            fs.renameSync(path.join(this.rootPath, this.originalname), path.join(lastDir, fileName));
            fs.renameSync(this.newAPKPath, path.join(this.rootPath, this.originalname));

            var patchStat = fs.statSync(apkPatchPath)
            var patchSize = patchStat.size     // 字节为单位

            this.manifest_obj.minVersion = parseInt(this.forceVersion);
            this.manifest_obj.minAllowPatchVersion = parseInt(this.minIncrementalVersion);
            this.manifest_obj.newVersion = parseInt(this.apkVersion);
            this.manifest_obj.tip = this.publishTextInfo;
            this.manifest_obj.size = newAPKSize
            this.manifest_obj.apkURL = this.baseURLPath ? this.baseURLPath + "/" + this.originalname : this.originalname;
            this.manifest_obj.hash = this.newAPKHash

            this.manifest_obj.patchInfo['v' + lastVersion] = {
                patchURL: this.baseURLPath ? this.baseURLPath + "/" + path.join('v' + lastVersion + '/' + apkPatchName) : path.join('v' + lastVersion + '/' + apkPatchName),
                tip: this.publishTextInfo + "(本次更新包大小:" + patchSize + 'byte)',
                hash: this.newAPKHash,
                size: patchSize
            }
            fs.writeFileSync(this.manifest_file, JSON.stringify(this.manifest_obj, null, 4));
            this.res.end('publish app succeed');
        })
        .catch(this.handleError);
}

PublishTask.prototype.fullPublish = function () {
    // first use
    var newAPKStat = fs.statSync(this.newAPKPath)
    var newAPKSize = newAPKStat.size     // 字节为单位

    fs.renameSync(this.newAPKPath, path.join(this.rootPath, this.originalname));
    this.manifest_obj.newVersion = parseInt(this.apkVersion);
    this.manifest_obj.minVersion = this.manifest_obj.newVersion;
    this.manifest_obj.minAllowPatchVersion = this.manifest_obj.newVersion;

    this.manifest_obj.tip = this.publishTextInfo;
    this.manifest_obj.size = this.newAPKSize;

    this.manifest_obj.apkURL = this.baseURLPath ? this.baseURLPath + "/" + this.originalname : this.originalname;
    this.manifest_obj.hash = this.newAPKHash;
    fs.writeFileSync(this.manifest_file, JSON.stringify(this.manifest_obj, null, 4));
    this.res.end('publish app succeed');
};

PublishTask.prototype.handleError = function (err) {
    console.error(err);
    this.res.status(500).end(`bsdiff error , error:${err.code} ,message:${err.message}`);
};

module.exports = function (options) {
    return new PublishTask(options);
};