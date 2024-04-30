const dbSwitchName = "green";
const storeSwitchName = "switch";
const dbSwitchVersion = 8;

function connectSwitchDB(callback) {
    const request = indexedDB.open(dbSwitchName, dbSwitchVersion);
    let db = null;
    request.onupgradeneeded = (event) => {
            db = event.target.result;
            const objectStore = db.createObjectStore(storeSwitchName, { keyPath: "sig"});
            objectStore.createIndex("name", "name", { unique: false });
            objectStore.createIndex("time", "time", { unique: false });
            objectStore.createIndex("state", "state", { unique: false });
    };
    
    request.onsuccess = (event) => {
        db = event.target.result;
        callback(db);
    };
    
    request.onerror = (event) => {
     console.error("Error opening database:", event.target.error);
    };
}


function addSwitchData(db,data, callback) {
    console.log(data);
  const transaction = db.transaction(storeSwitchName, "readwrite");
  const objectStore = transaction.objectStore(storeSwitchName);
    const request = objectStore.add(data);

    request.onerror = (event) => {
    console.error("Error adding data:", event.target.error);
    };

    request.onsuccess = (event) => {
    callback();
    };
}

function getBySwitchID(db, eventId, callback) {
    const transaction = db.transaction(storeSwitchName, "readonly");
    const objectStore = transaction.objectStore(storeSwitchName);
    const request = objectStore.get(eventId);
  
    request.onerror = (event) => {
      console.error("Error getting data:", event.target.error);
    };
  
    request.onsuccess = (event) => {
      const result = event.target.result;
      callback(result);
    };
}

function updateBySwitchID(db, eventId, data, callback) {
    const transaction = db.transaction(storeSwitchName, "readwrite");
    const objectStore = transaction.objectStore(storeSwitchName);
    data.switchId = eventId; // Set the key of the entry to the eventId variable

    const request = objectStore.put(data);
  
    request.onerror = (event) => {
      console.error("Error updating data:", event.target.error);
    };
  
    request.onsuccess = (event) => {
      callback();
    };
  }

  function deleteBySwitchID(db, eventId, callback) {
    const transaction = db.transaction(storeSwitchName, "readwrite");
    const objectStore = transaction.objectStore(storeSwitchName);
  
    const request = objectStore.delete(eventId);
  
    request.onerror = (event) => {
      console.error("Error deleting data:", event.target.error);
    };
  
    request.onsuccess = (event) => {
      callback();
    };
  }