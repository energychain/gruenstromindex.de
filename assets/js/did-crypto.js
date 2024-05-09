const getJSONSignee = (json) => {
    if(typeof json == "string") {
        json = JSON.parse(json);
    }
    
    // Backward compatibility to old GSI implementation
    if(typeof json.signature !== "undefined") {
        json.sig = json.signature;
        delete json.signature;
    }
    if(typeof json.sig == "undefined") {
        throw new Error("No signature in JSON");
    }
    const deepCopy = JSON.parse(JSON.stringify(json));
    const signature = json.sig;
    delete deepCopy.sig;
    return ethers.utils.verifyMessage(JSON.stringify(deepCopy), signature);
}

const signJSON = async (json) => {
    while(typeof window.wallet == "undefined") { 
        await new Promise(r => setTimeout(r, 10000));
    }
  json.sig = await window.wallet.signMessage(JSON.stringify(json));
  return json
}

const safeSendP2P = async (recipient, payload) => {
    try {
        window.ipcsocket.emit("push",JSON.stringify({
            recipient: recipient,
            payload:payload
        }));
    } catch(e) {
        console.error("IPC Error",e);
    } 
}

const receiveMessages = function(address) {
    const channel = '/'+address;
    client.subscribe(channel, function(message) {
        console.log(message);
    });
}

const establishP2P = () => {
    try {
        const client = new Faye.Client('https://signal.corrently.cloud/');

        client.disable('websocket'); // disable WebSockets to force the client to use long polling
        
        client.connect();
        window.p2pipc = client;

    } catch(e) {
        console.error(e);
    }

}