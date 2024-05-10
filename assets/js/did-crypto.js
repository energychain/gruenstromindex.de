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

window.signedDelegations = {};
const signJSON = async (json) => {
    while(typeof window.wallet == "undefined") { 
        await new Promise(r => setTimeout(r, 10000));
    }
  
  json.sig = await window.wallet.signMessage(JSON.stringify(json));
  return json
}

const safeSendP2P = async (eventId, payload,type) => {
    try {
        window.ipcsocket.emit("push",JSON.stringify({
            eventId: eventId,
            payload:payload,
            type:type,
            sender:window.wallet.address
        }));
    } catch(e) {
        console.error("IPC Error",e);
    } 
}
