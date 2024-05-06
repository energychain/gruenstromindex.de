let mqttsettings = null;
let mqttclient = null;
let msgtarget = null;
let initialconnect = false;

if(typeof importScripts !== 'undefined') importScripts("./mqtt.min.js");
if(typeof importScripts !== 'undefined') importScripts("./indexdb_tracker.js");

const eventq = [];

const localClient = function(mqttsettings) {
    const client = mqtt.connect(mqttsettings.url);
    client.on("connect", () => {
        client.subscribe(mqttsettings.root+"presence", (err) => {
          if (!err) {
           // console.log("subscribed to",mqttsettings.root+"presence");
            client.publish(mqttsettings.root+"presence", "sw-connected");
            initialconnect=true;
            client.state = {
                title: "mqtt-connected",
                err: null,
                color: '#147a50'
            }
          } else {
            client.state = {
                title: "mqtt-connectfail",
                err: "Failed to Connect",
                color: '#000000'
            }
          }
        });
    });
    client.on("error", (err) => {
        client.state = {
            title: "mqtt-error",
            err: err,
            color: '#ff0000'
        };
        console.error('MQTT Client',err);
        if(msgtarget !== null) {
            msgtarget.postMessage(JSON.stringify(client.state));
        }
    });
    client.on("close", (err) => {
        client.state = {
            title: "mqtt-close",
            err: err,
            color: '#000000'
        };
        console.error('MQTT Client (close)',err);
        if(msgtarget !== null) {
            msgtarget.postMessage(JSON.stringify(client.state));
        }
    });
    client.on("message", (topic, message) => {
        // message is Buffer
        if(msgtarget !== null) {
            msgtarget.postMessage(JSON.stringify({topic:topic,message:message.toString()}));
        }    
        // Handle Reading updates
        const pattern = "/(.+?)\/tracker\/([a-fA-F0-9]+)\/reading/";
        
        const match = topic.match(/tracker\/(0x[a-fA-F0-9]+?)\/reading/);
        if((match !== null) && (match.length>0)) {
            const eventId = match[1];
            connectDB((db) => {
                getByEventID(db, eventId, async (data) => {
                    let updateData = {
                      did: JSON.parse(data.did),
                      reading:1 * message.toString(),
                      iat: Math.round(new Date().getTime()/1000)
                    };
                    data.pending = JSON.stringify(updateData);

                    updateByEventID(db, data.eventId, data, () => {
                        msgtarget.postMessage(JSON.stringify({topic:topic,message:message}));
                    });
                })
            });
        } else {
            msgtarget.postMessage(JSON.stringify({topic:topic,message:message}));
        }

    });
    return client;
};

self.addEventListener("message", (event) => {
    try {
        let payload = JSON.parse(event.data);
        msgtarget = event.source;
    
        if(typeof payload.mqttsettings !== 'undefined') {
            mqttsettings = payload.mqttsettings;  
        }
        if((mqttclient == null) && (mqttsettings !== null)) {
            mqttclient = localClient(mqttsettings);  
        }
        const processMessage = function() {
            let message = eventq.pop();
            try {
                if(!initialconnect) {
                    throw new Error("Initial Connect Failed");
                }
                if((typeof message.publish !== 'undefined')&&(message.publish !== null)) { 
                    message.publish=JSON.parse(message.publish);
                    mqttclient.publish(mqttsettings.root+message.publish.topic, message.publish.message);
                }
                if(typeof message.subscribe !== 'undefined') {
                    mqttclient.subscribe(mqttsettings.root+message.subscribe, (err) => {
                        if (!err) {
                            // console.log("subscribed to",mqttsettings.root+message.subscribe);
                        } else {
                            console.error('MQTT Subscribe',err);
                        }
                    });
                }
                if(mqttclient !== null) {
                    event.source.postMessage(JSON.stringify(mqttclient.state));
                    mqttclient.publish(mqttsettings.root+"presence", "ui");
                }
                if(eventq.length > 0) {
                    setTimeout(processMessage,100);
                }
            } catch(e) {
                eventq.push(message);
                setTimeout(processMessage,100);
            }
        }
        eventq.push(payload);
        processMessage();
    } catch(e) {

    }
});