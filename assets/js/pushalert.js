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
            const commitBackend = function(time,href) {
                const url = 'https://api.corrently.io/v2.0/scope2/pushScheduler';
                let startData = {
                    name:"Corrently GrünstromSchalter",
                    content:$('#sendMessage').val(),
                    after:new Date(time * 1).toISOString(),
                    title:"Corrently GrünstromSchalter",
                    id:$('#oneSignalId').val()
                  };
                  if(time > 0 ) {
                    startData.after = new Date(time * 1).toISOString();
                  }
                fetch(url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(startData)
                  })
                  .then(response => response.json())
                  .then(data => {
                       location.href=href;
                  });
            }
            $('#sendMessage').val(getUrlParameter("switch")+" "+getUrlParameter("state"));
            $('#sendAt').val(new Date(1 * getUrlParameter("time")).toLocaleString());
            $('#sendAt').attr('data',getUrlParameter("time"));
            $('#pushScheduler').on('submit', function(e) {
                e.preventDefault();
                commitBackend($('#sendAt').attr('data'),'./?#gsiTracker')
            });
            $('#testButton').on('click', function(e) {
                commitBackend(0,'#');
            });
        }
    }


    setTimeout(initOSID, 1000);
});