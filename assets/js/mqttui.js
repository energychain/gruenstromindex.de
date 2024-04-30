const mqttConnect = async function() {

    const mqttsettings = JSON.parse(window.localStorage.getItem("mqttsettings"));
    if(typeof mqttsettings.url !== 'undefined') {
      if (navigator.serviceWorker) {
       navigator.serviceWorker.register("./mqttsw.js");
    
        navigator.serviceWorker.addEventListener("message", (event) => {
          // event is a MessageEvent object
          try {
            let payload = JSON.parse(event.data);
            if(typeof payload.color !== 'undefined') {
              $('#mqttIcon').css('color',payload.color);  
            }
            if(typeof payload.title !== 'undefined') {
              $('#mqttIcon').attr('title',payload.title);
            }
          } catch(e) {
           // console.log("Undispatched",event.data);
          }
        });
    
        navigator.serviceWorker.ready.then((registration) => {
          const keepAliveSW = async function() {
            console.log("ping MQTT Connection");
            registration.active.postMessage(JSON.stringify({mqttsettings:mqttsettings}));
          } 
          setTimeout(keepAliveSW,10000); // wait 10 seconds before initial check for mwtt to come alive.
          setInterval(keepAliveSW, 60*1000);

          document.addEventListener('mqtt-publish', (event) => {
            registration.active.postMessage(JSON.stringify({publish:event.detail}));
          });

          document.addEventListener('mqtt-subscribe', (event) => {
            registration.active.postMessage(JSON.stringify({subscribe:event.detail}));
          });
          navigator.serviceWorker.onmessage = function(event) {
            try {
              if(typeof event.data == "undefined") return;
              let payload = JSON.parse(event.data);
              if(typeof payload.topic !== 'undefined') {
                const pattern = "/(.+?)\/tracker\/([a-fA-F0-9]+)\/reading/";
          
                const match = payload.topic.match(/tracker\/(0x[a-fA-F0-9]+?)\/reading/);
                
                if((match !== null) && (match.length>0)) {
                  
                  connectDB((db) => {
                    getByEventID(db,match[1],function(data) {
                      if(typeof data.pending !== 'undefined') {
                        updateDid(JSON.parse(data.pending));   
                      }                 
                    });
                  });
                }
              } else {
                // console.log("Undispatched MQTT",event.data);
              }
            } catch(e) {
              console.error("Error MQTT msg processing",e);
            }
          };
        });
  }
    }
}



$(document).ready(function() {

    $('#mqttForm').submit(function(e) {
        e.preventDefault();
        console.log("Test Connection");
        const mqttsettings = {
            url: $("#mqtturl").val(),
            root: $('#roottopic').val(),
            autoconnect: $("#mqttAutoConnect").is(":checked")
        }

        const client = mqtt.connect(mqttsettings.url);
        client.on("connect", () => {
            client.subscribe(mqttsettings.root+"presence", (err) => {
              if (!err) {
                console.log("MQTT probe ok");
                client.publish(mqttsettings.root+"presence", "probe");
                window.localStorage.setItem("mqttsettings", JSON.stringify(mqttsettings));
                $('#modalMQTT').modal('hide');
                if(mqttsettings.autoconnect == true) {
                    setTimeout('mqttConnect()', 1000);
                } else {
                    location.reload();
                }
              } else {
                console.error("MQTT Fehler", err);
              }
            });
          });
    });

    let settings = JSON.parse(window.localStorage.getItem("mqttsettings"));
    if((settings !== null) && (settings.autoconnect)) {
      mqttConnect();
    }
    if(settings!== null) {
      $('#roottopic').val(settings.root);
      $("#mqttAutoConnect").prop("checked", settings.autoconnect);
      $("#mqtturl").val(settings.url);
    } else {
      const populateRoot = function() {
        if(window.wallet) {
          $('#roottopic').val("gruenstrom/"+window.wallet.address+"/");
        } else {
          setTimeout(populateRoot, 1000);
        }
      }
      populateRoot();
    }

    $('#showMQTTSettings').on('click', function() {        
      $('#modalMQTT').modal('show'); 
  });
});