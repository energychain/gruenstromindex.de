const trackerRowHTML = function(tracker,fromDelegation) {
  let delegation = false;
  let disableManual = '';
  if((tracker.reading == '[delegation]') && (typeof fromDelegation == 'undefined') && (fromDelegation !== null)) {
    delegation = true;
   
    let data = JSON.parse(tracker.did);
    
    // hier können wir einen Update Timer starten...
    const updater =function(tracker) {
      validateDelegation(tracker.consumption,function(data) {
        let html = trackerRowHTML(JSON.parse(data.did),true);
        $('#trackerRow'+tracker.eventId).replaceWith(html);
        handleReadingButtonEvents();
      })

    }
    updater(tracker);
    setInterval(function() { 
      updater(tracker); 
    }, 900000);

    tracker.reading = data.reading;
    tracker.consumption = data.consumption;
    tracker.emission = data.emission;
  }
  if(fromDelegation) {  disableManual = ' disabled="disabled" '; }
  
  let html = "";
  html += '<tr id="trackerRow'+tracker.eventId+'">';
  html += '<td>'+tracker.name+'</td>';
  html += '<td align="right">'+(tracker.consumption/1000).toFixed(3).replace('.',',')+'</td>';
  html += '<td align="right">'+(tracker.emission/1000).toFixed(3).replace('.',',')+'</td>';
  html += '<td>'+new Date(tracker.iat*1000).toLocaleString()+'</td>';
  html += '<td>';
  html += '<button title="Nachweisen" style="background-color:#147a50;margin-right:5px;" class="btn btn-primary btn-sm btnPresent" data-eventId="'+tracker.eventId+'">';
  html += '<svg class="bi bi-postage" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
  html += '<path d="M4.75 3a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h6.5a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75zM11 12H5V4h6z"></path>';
  html += '<path d="M3.5 1a1 1 0 0 0 1-1h1a1 1 0 0 0 2 0h1a1 1 0 0 0 2 0h1a1 1 0 1 0 2 0H15v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1h-1.5a1 1 0 1 0-2 0h-1a1 1 0 1 0-2 0h-1a1 1 0 1 0-2 0h-1a1 1 0 1 0-2 0H1v-1a1 1 0 1 0 0-2v-1a1 1 0 1 0 0-2V9a1 1 0 1 0 0-2V6a1 1 0 0 0 0-2V3a1 1 0 0 0 0-2V0h1.5a1 1 0 0 0 1 1M3 3v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1"></path>';
  html += '</svg>';
  html += '</button>';
  html += '<button title="Manuelle Ablesung" '+disableManual+' style="background-color:#147a50;" class="btn btn-primary btn-sm btnReading" data-eventId="'+tracker.eventId+'">';
  html += '<svg class="bi bi-speedometer" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a.5.5 0 0 1 .5.5V4a.5.5 0 0 1-1 0V2.5A.5.5 0 0 1 8 2M3.732 3.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 8a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 8m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.389.389 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.569l3.434-4.297a.389.389 0 0 0-.029-.518z"></path><path fill-rule="evenodd" d="M6.664 15.889A8 8 0 1 1 9.336.11a8 8 0 0 1-2.672 15.78zm-4.665-4.283A11.945 11.945 0 0 1 8 10c2.186 0 4.236.585 6.001 1.606a7 7 0 1 0-12.002 0z"></path></svg>';
  html += '</button>';
  html += '</td>';
  html += '</tr>';
  return html;
}

const qrVerify = function() {
  const url = 'https://api.corrently.io/v2.0/scope2/eventResolver';
        
  let startData = {
    jwt: $('#jwtInput').val()
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
    data.verification.payload.did = data.verification.issuer;
    data.verification.payload.sig = "DIDSIG:"+JSON.stringify(data.verification.signer);
    renderDID({
      jwt: $('#jwtInput').val(),
      json:data.verification.payload
    })
  });
}
const renderDID = function(data2) {
  
  $('#qrcode').html('');
  $('#presentJWTContent').val(data2.jwt);
  $('#presentJSON').val(JSON.stringify(data2.json, undefined, 4));
  let text = "";
  try {
   text +="<strong>Kryptographisch geprüfter Sachverhalt</strong><br/><blockquote>Für den Inhaber der ID <abbr class='text-primary' title='Consumer:"+data2.json.consumer+"'>"+data2.json.consumer.substring(0,6)+"...</abbr> wird ";
    text += "ein Stromverbrauch in "+data2.json.country+"-"+data2.json.zip+" unter der ID <abbr class='text-primary' title='"+data2.json.sub+"'>"+data2.json.sub.substring(0,6)+"...</abbr> von "+(data2.json.consumption/1000)+"kWh bei einer Emission von "+(data2.json.emission/1000).toFixed(3).replace('.',',')+"kgCO<sub></sub> ";
    text += "für den Zeitraum von "+new Date(data2.json.start*1000).toLocaleString()+" bis "+new Date(data2.json.end*1000).toLocaleString();
    text += " am "+new Date(data2.json.iat*1000).toLocaleString()+" von der ID <abbr class='text-primary' title='Notary:"+data2.json.notary+"'>"+data2.json.notary.substring(0,6)+"...</abbr>  bestätigt ";
    text += " mit der digitalen Signatur <abbr class='text-primary' title='"+data2.json.sig+"'>"+data2.json.sig.substring(0,6)+"...</abbr>  </blockquote."
    text += "<br/><hr style='margin-top:15px;'><p class='text-muted'>"+data2.json.did+"</p>";
  } catch(e) {}

 $('#presentText').html(text);
  var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: data2.jwt,
    width: 512,
    height: 512,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.M
 });

 window.localStorage.setItem('lastResolvedJWT', JSON.stringify(data2));
 updateLastResolved();
}

const updateLastResolved = function() {
  let html = '';
  if(window.localStorage.getItem('lastResolvedJWT') !== null) {
    let resolution = JSON.parse(window.localStorage.getItem('lastResolvedJWT'));
    html += '<h4>Letzte Prüfung</h4>';
    html += '<table class="table table-condensed">';
    html += '<tr><td>Verbraucher Kennung</td><td>'+resolution.json.consumer+'</td></tr>';
    html += '<tr><td>Ort</td><td>'+resolution.json.country+"-"+resolution.json.zip+'</td></tr>';
    html += '<tr><td>Stromverbrauch</td><td>'+(resolution.json.consumption/1000).toFixed(3).replace('.',',')+' kWh</td></tr>';
    html += '<tr><td>Emission</td><td>'+(resolution.json.emission/1000).toFixed(3).replace('.',',')+' kgCO<sub>2</sub></td></tr>';
    html += '<tr><td>Zeitraum</td><td>'+new Date(resolution.json.start*1000).toLocaleString()+'</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;bis</td><td>'+new Date(resolution.json.end*1000).toLocaleString()+'</td></tr>';
    html += '</table>';
  }
  $('#lastResolvedFront').html(html);
}
const handleReadingButtonEvents = function() {
  $('.btnReading').off();
  $('.btnReading').on('click',function(e) {
    connectDB((db) => {
      getByEventID(db, $(e.currentTarget).attr("data-eventId"), (data) => {
          $('#trackerName').html(data.name);
          $('#readingUpdate').val(data.reading/1000);
          $('#readingUpdate').attr('data-eventId',data.eventId);
          $('#readingUpdate').attr('min',data.reading/1000);
          $('#modalReading').modal('show');
      });
    });
  });
  $('.btnPresent').off();
  $('.btnPresent').on('click',function(e) {
    $('#modalPresentation').modal('show');
    connectDB((db) => {
      getByEventID(db, $(e.currentTarget).attr("data-eventId"),async (data) => {
        let vpdata = {
          did:data.did,
          iat:Math.round(new Date().getTime()/1000)
        }
        const vp = await signJSON(vpdata);
        const url = 'https://api.corrently.io/v2.0/scope2/eventJWT';
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(await signJSON(vp))
        })
        .then(response => response.json())
        .then(data2 => {
            renderDID(data2);
        });
      });
    });
  });
}

const validateDelegation = async function(delegationId,delegationCb) {
  const url = 'https://api.corrently.io/v2.0/scope2/eventDelegation';
  
let startData = {
  delegationId: delegationId,
  iat: Math.round(new Date().getTime()/1000)
};

fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(await signJSON(startData))
  })
  .then(response => response.json())
  .then(data => {
      connectDB((db) => {
          data.did = JSON.stringify(data);
          data.reading = "[delegation]";
          data.consumption = delegationId;
          data.emission = delegationId;
          data.ownerId = data.did.ownerId;
     
          addData(db, data, () => {
            delegationCb(data);
          });
        });
  });
}

const updateDid = async function(updateData) {
  const data = updateData;
  
 if(data.reading == data.did.reading) {
  // console.log("Replay");
  return;
 }
  const url = 'https://api.corrently.io/v2.0/scope2/eventUpdate';
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(await signJSON(updateData))
  })
  .then(response => response.json())
  .then(data2 => {
      connectDB((db) => {
          data.did = JSON.stringify(data2);
          data.reading = data2.reading;
          data.consumption = data2.consumption;
          data.emission = data2.emission;
          data.iat = data2.iat;
          data.eventId = data2.eventId;
          data.name = data2.name;
          // Here we publish

          updateByEventID(db, data2.eventId, data, () => {
            $('#trackerRow'+data.eventId).replaceWith(trackerRowHTML(data));
            handleReadingButtonEvents();
         }); 

         const consumptionEvent = new CustomEvent('mqtt-publish', {detail:JSON.stringify({ topic: "tracker/"+data.eventId+"/consumption", message: ""+data.consumption})});
         document.dispatchEvent(consumptionEvent);

         const emissionEvent = new CustomEvent('mqtt-publish', {detail:JSON.stringify({ topic: "tracker/"+data.eventId+"/emission", message: ""+data.emission})});
         document.dispatchEvent(emissionEvent);

      });
  });
}

$(document).ready(function() {
    $('#trackerNav').append('<li class="nav-item text-center"><a class="nav-link" href="#gsiTracker"><svg class="bi bi-plugin" xmlns="http://www.w3.org/2000/svg" style="color: #147a50;" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 1 2.898 5.673c-.167-.121-.216-.406-.002-.62l1.8-1.8a3.5 3.5 0 0 0 4.572-.328l1.414-1.415a.5.5 0 0 0 0-.707l-.707-.707 1.559-1.563a.5.5 0 1 0-.708-.706l-1.559 1.562-1.414-1.414 1.56-1.562a.5.5 0 1 0-.707-.706l-1.56 1.56-.707-.706a.5.5 0 0 0-.707 0L5.318 5.975a3.5 3.5 0 0 0-.328 4.571l-1.8 1.8c-.58.58-.62 1.6.121 2.137A8 8 0 1 0 0 8a.5.5 0 0 0 1 0"></path></svg><br/>Tracker</a></li>');
    $('#gsiAddTracker').on('click',function() {
        $('#modalTracker').modal('show');
    });
    $('#addManagedBtn').on('click',function() {
        $('#modalManaged').modal('show');
        $('#modalTracker').modal('hide');
    });
    $('#addManaged').on('submit',function(e) {
      e.preventDefault();
      $('#submitManaged').attr('disabled',true);

      validateDelegation($('#managedTrackerId').val(),function() {
        location.reload();
      });
    });

    $('#addTracker').on('submit',function(e) {
        e.preventDefault();
        $('#submitTracker').attr('disabled',true);
        async function  startConsumption() {
            const postalCode = $('#postleitzahlTracker').val();
            if (!postalCode) {
                alert('Please enter a postal code.');
                return;
            }
        
            const url = 'https://api.corrently.io/v2.0/scope2/eventStart';
        
            let startData = {
              zip: postalCode,
              ownerId: window.wallet.address,
              name: $('#nameTracker').val(),
              reading:$('#readingTracker').val()*1000,
              iat: Math.round(new Date().getTime()/1000)
            };
            
            fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(await signJSON(startData))
            })
            .then(response => response.json())
            .then(data => {
                connectDB((db) => {
                    data.did = JSON.stringify(data);
                    addData(db, data, () => {
                      console.log("Data added successfully.");
                      location.reload()
                    });
                  });
            });
        }
        startConsumption();
    });

    function getAllEntries(db, callback) {
        const transaction = db.transaction(storeName, "readonly");
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.getAll();
      
        request.onerror = (event) => {
          console.error("Error getting data:", event.target.error);
        };
      
        request.onsuccess = (event) => {
          const results = event.target.result;
          callback(results);
        };
      }

      function createTable(entries) {
        let html = '<table class="table table-condensed">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>Name</th>';
        html += '<th style="text-align:right">Verbrauch (kWh)&nbsp;&nbsp;</th>';
        html += '<th style="text-align:right">CO<sub>2</sub>-Emission (kg)&nbsp;&nbsp;</th>';
        html += '<th>Aktualisierung</th>';
        html += '<th>&nbsp;</th>'
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
      
        for(let i=0;i<entries.length;i++) {
          html += trackerRowHTML(entries[i]);
          const gsiEvent = new CustomEvent('mqtt-subscribe', {detail:"tracker/"+entries[i].eventId+"/reading"});
          document.dispatchEvent(gsiEvent);

          if((entries[i].pending)&&(entries[i].pending.length > 0)) {
            updateDid(JSON.parse(entries[i].pending));
          }
        }
      
        html += '</tbody>';
        html += '</table>';
      
        return html;
      }
      connectDB((db) => {
       
        getAllEntries(db, (entries) => {
          if(entries.length < 1) {
            let html = '<button class="btn btn-light" id="gsiAddTrackerFront">';
            html += '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-plus-circle-fill" style="width: 30px;height: 30px;color: #147a50;">';
            html += '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"></path>';
            html += '</svg>';
            html += '&nbsp;Tracker erstellen</button>';
            $('#allTrackers').html(html);  
            $('#gsiAddTrackerFront').on('click',function() {
              $('#modalTracker').modal('show');
            })
        } else {
            const table = createTable(entries);
            $('#allTrackers').html(table);
          }

        
          handleReadingButtonEvents();

          $('#frmUpdateReading').on('submit',function(e) {
                e.preventDefault();
                $('#btnUpdateReading').attr('disabled',true);
                getByEventID(db, $('#readingUpdate').attr('data-eventId'), async (data) => {
                    const readingEvent = new CustomEvent('mqtt-publish', {detail:JSON.stringify({ topic: "tracker/"+$('#readingUpdate').attr('data-eventId')+"/reading", message: ""+$('#readingUpdate').val()*1000})});
                    document.dispatchEvent(readingEvent);
                  
                    let updateData = {
                      did: JSON.parse(data.did),
                      reading:$('#readingUpdate').val()*1000,
                      iat: Math.round(new Date().getTime()/1000)
                    };
                    updateDid(updateData);
                    $('#modalReading').modal('hide');
                    $('#btnUpdateReading').removeAttr('disabled');
                })

              
          });
        });
      });

      $('#frmJWTValidate').on('submit',function(e) {
        e.preventDefault();
        console.log("In Here");
        $('#modalPresentation').modal('show');
        qrVerify();
      });
      $('#openQRCam').on('click',function(e) {
        $('#modalQR').modal('show');

        function onScanSuccess(decodedText, decodedResult) {
          // handle the scanned code as you like, for example:  
          $('#modalQR').modal('hide');
          $('#jwtInput').val(decodedText);
          $('#modalPresentation').modal('show');
          qrVerify();
         
        }
        
        function onScanFailure(error) {
          // handle scan failure, usually better to ignore and keep scanning.
          // for example:
          console.warn(`Code scan error = ${error}`);
        }
        
        let html5QrcodeScanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: {width: 250, height: 250} },
          /* verbose= */ false);
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      });
      updateLastResolved();
});