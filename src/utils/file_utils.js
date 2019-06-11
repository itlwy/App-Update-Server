var fs = require('fs');
var path = require('path');
//递归创建目录 同步方法
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

// 判断日志目录是否存在，不存在时创建日志目录
function checkAndCreateDir(dir) {
    if (!fs.existsSync(dir)) {
        mkdirsSync(dir);
    }
}

function pUnlink(filePath) {
    var p = new promise(function (resolve, reject) {
        fs.unlink(filePath, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve('删除成功!');
            }
        });
    });
    return p;
};

function pReadFile(filePath, encode) {
    var p1 = new Promise(function (resolve, reject) {
        fs.readFile(filePath, encode, function (error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
    return p1;
}

function pWriteFile(filePath, content) {
    var p1 = new Promise(function (resolve, reject) {
        fs.writeFile(filePath, content, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve('');
            }
        });
    });
    return p1;
}

var deleteFile = function (file) {
    if (fs.existsSync(file.path)) {
        fileUtil.pUnlink(file.path)
            .then(function (result) {

            })
            .catch(function (error) {
                logger.error(error.message);
            });
    }
};

module.exports = {
    checkAndCreateDir: checkAndCreateDir,
    mkdirsSync: mkdirsSync,
    pUnlink: pUnlink,
    deleteFile: deleteFile,
    pReadFile: pReadFile,
    pWriteFile: pWriteFile
};
