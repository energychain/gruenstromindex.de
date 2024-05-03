$(document).ready(function(){
    function getUrlParameter(paramName) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(paramName);
    }

    const initOSID = function() {
        $('#oneSignalId').val(OneSignal.User.PushSubscription.id);
        if( $('#oneSignalId').val().length < 5) {
            setTimeout(initOSID, 1000);
        } else {
            $('#sendMessage').val(getUrlParameter("switch")+" "+getUrlParameter("state"));
            $('#sendAt').val(new Date(1 * getUrlParameter("time")).toLocaleString());
            $('#sendAt').attr('data',getUrlParameter("time"));
            $('#pushScheduler').on('submit', function(e) {
                e.preventDefault();
                const url = 'https://api.corrently.io/v2.0/scope2/pushScheduler';
                
                let startData = {
                  name:"Corrently GrünstromSchalter",
                  content:$('#sendMessage').val(),
                  after:new Date($('#sendAt').attr('data') * 1).toISOString().substring(0,16),
                  title:"Corrently GrünstromSchalter",
                  id:$('#oneSignalId').val()
                };
                
                fetch(url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(startData)
                })
                .then(response => response.json())
                .then(data => {
                     location.href='./?#gsiTracker';
                });
            });
        
        }
    }


    setTimeout(initOSID, 1000);
});