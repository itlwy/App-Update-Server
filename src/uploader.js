var multer = require('multer');
var path = require('path');
var fileUtil = require('./file_utils');


var Uploader = function (options) {
    this.options = options || { destination: path.join(__dirname, 'public/app/temp') };
    this.storage = multer.diskStorage({
        //设置上传后文件路径，uploads文件夹会自动创建。
        destination: function (req, file, cb) {
            fileUtil.checkAndCreateDir(this.options['destination']);
            cb(null, this.options['destination']);
        }.bind(this),
        //给上传文件重命名，获取添加后缀名
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }.bind(this)
    });
    this.upload = multer({
        storage: this.storage,
        limits: { fileSize: 100 * 1024 * 1024 }  // unit:bytes
    }).single('file');

};

Uploader.prototype.handle = function (req, res, callback) {
    this.upload(req, res, callback);
};

module.exports = function (options) {
    return new Uploader(options);
};