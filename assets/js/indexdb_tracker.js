const dbName = "corrently";
const storeName = "tracker";
const dbVersion = 8;

function connectDB(callback) {
    const request = indexedDB.open(dbName, dbVersion);
    let db = null;
    request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore(storeName, { keyPath: "eventId"});
      objectStore.createIndex("ownerId", "ownerId", { unique: false });
      objectStore.createIndex("zip", "zip", { unique: false });
      objectStore.createIndex("gsi", "gsi", { unique: false });
      objectStore.createIndex("reading", "reading", { unique: false });
      objectStore.createIndex("name", "name", { unique: false });
      objectStore.createIndex("iad", "iad", { unique: false });
      objectStore.createIndex("sig", "sig", { unique: true });
      objectStore.createIndex("did", "did", { unique: true });
      objectStore.createIndex("consumption", "consumption", { unique: false });
      objectStore.createIndex("emission", "emission", { unique: false });
      objectStore.createIndex("pending", "pending", { unique: false });
      objectStore.createIndex("type", "type", { unique: false });
    };
    
    request.onsuccess = (event) => {
        db = event.target.result;
        callback(db);
    };
    
    request.onerror = (event) => {
     console.error("Error opening database:", event.target.error);
    };
}


function addData(db,data, callback) {
  if(typeof data.err !== 'undefined') callback({err:data.err});
  const transaction = db.transaction(storeName, "readwrite");
  const objectStore = transaction.objectStore(storeName);
  try {
    const request = objectStore.add(data);

    request.onerror = (event) => {
       updateByEventID(db, data.eventId, data, callback);
    };

    request.onsuccess = (event) => {
       callback();
    };
  } catch(e) {
    updateByEventID(db, data.eventId, data, callback);
  }
}

function getByEventID(db, eventId, callback) {
    const transaction = db.transaction(storeName, "readonly");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.get(eventId);
  
    request.onerror = (event) => {
      console.error("Error getting data:", event.target.error);
    };
  
    request.onsuccess = (event) => {
      const result = event.target.result;
      callback(result);
    };
}

function updateByEventID(db, eId, data, callback) {
  if(typeof $ !== 'undefined') {  // Might be in case of call by service worker!
    if($('#modalAlert').hasClass('show')) {
      setTimeout(function() {
        updateByEventID(db, eId, data, callback);
      },5000);
    }
  }
  const eventId = eId;
  const did = JSON.parse(data.did);
   // Handle error cases in local Memmory
   if(typeof data.reading === 'undefined') {
      if(typeof  $('#readingUpdate').attr('data-eventId') !== 'undefined') {
        $('#modalAlert').attr("data", eventId);
        $('#managedAlert').html(did.err);
        $('#managedAlert').show();
        $('#modalAlert').modal('show');
      }
    callback(data);
   } else {
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);
      data.eventId = eventId; // Set the key of the entry to the eventId variable

      if(typeof did.err !== 'undefined') {
          $('#modalAlert').attr("data", eventId);
          $('#managedAlert').html(did.err);
          $('#managedAlert').show();
          $('#modalAlert').modal('show');
          console.log(did.err);
          return;
      } 
      const request = objectStore.put(data);
    
      request.onerror = (event) => {
        console.error("Error updating data:", event.target.error);
      };
    
      request.onsuccess = (event) => {
        callback(data);
      };
    }
  }

  function deleteByID(db, eventId, callback) {
    const transaction = db.transaction(storeName, "readwrite");
    const objectStore = transaction.objectStore(storeName);
  
    const request = objectStore.delete(eventId);
  
    request.onerror = (event) => {
      console.error("Error deleting data:", event.target.error);
    };
  
    request.onsuccess = (event) => {
      callback();
    };
  }