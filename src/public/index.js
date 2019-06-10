// var publishTextInfo_ele = $('publishTextInfo');

var updateObj;
$(document).ready(function () {
    $.getJSON('update', function (data) {
        updateObj = data;
        $('#currentVersion').val(updateObj.newVersion);
        $('#forceVersion').val(updateObj.minVersion);
        $('#minIncrementalVersion').val(updateObj.minAllowPatchVersion);
        $('#apkVersion').val(updateObj.newVersion + 1);
    });
});