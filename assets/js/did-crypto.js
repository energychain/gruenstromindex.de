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
  json.sig = await window.wallet.signMessage(JSON.stringify(json));
  return json
}

