$(document).ready(function(){
    const initOSID = function() {
        $('#oneSignalId').val(OneSignal.User.onesignalId);
        if( $('#oneSignalId').val().length < 5) {
            setTimeout(initOSID, 1000);
        }
    }
    setTimeout(initOSID, 1000);
});