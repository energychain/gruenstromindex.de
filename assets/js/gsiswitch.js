
const switchRowHTML = function(data) {
    let html = "";
    let state = "-";
    if(data.state == 1) state = "an";
    if(data.state == 0) state = "aus";
    html += '<tr id="switchSig'+data.sig+'">';
    html += '<td>'+new Date(data.time).toLocaleString()+'</td>';
    html += '<td>'+data.name+'</td>';
    html += '<td align="right">'+state+'</td>';
    html += '<td>';
    html += '<button class="btn btn-light float-end removeSwitch" type="button" id="removeSwitch'+data.sig+'" data-sig="'+data.sig+'" style="margin-top: -5px;"><svg class="bi bi-trash3" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path></svg></button>';
    html += '</td>';
    html += '</tr>';
    return html;
}

$(document).ready(function() {
    
    $('#gsiAddTracker').on('click',function() {
        $('#modalTracker').modal('show');
    });

    $('#switchForm').on('submit',async function(e) {
        $('.submitSwitch').attr('disabled',true);

        const switchData = {
            state: e.originalEvent.submitter.value,
            time: $('#switchTime').attr('data') * 1,
            name: $('#switchName').val()
        }

        connectSwitchDB( async (db) => {
            addSwitchData(db,await signJSON(switchData), () => { 
                console.log("Data added successfully.");
                location.reload()
                });
        });
    });

    function getAllEntries(db, callback) {
        const transaction = db.transaction(storeSwitchName, "readonly");
        const objectStore = transaction.objectStore(storeSwitchName);
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
   
        entries.sort((a,b) => a.name < b.name);
        for(let i=0;i<entries.length;i++) {
            $('#switchExist').append('<option data-tokens="'+entries[i].name+'">'+entries[i].name+'</option>');
        }
        let html = '<table class="table table-condensed">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>Zeitpunkt</th>';
        html += '<th>Schalter</th>';
        html += '<th style="text-align:right">Vorgang</th>';
        html += '<th>&nbsp;</th>'
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        const now = new Date().getTime();
        let existingPublished = {};
        entries.sort((a,b) => a.time - b.time);
        for(let i=0;i<entries.length;i++) {
            if(entries[i].time < now) {
                connectSwitchDB((db) => {
                    deleteBySwitchID(db, entries[i].sig, () => {});
                });
            } else {
                html += switchRowHTML(entries[i]);
                let state = "none";
                if(entries[i].state == 0) state ="on";
                if(entries[i].state == 1) state ="off";
                if(typeof existingPublished[entries[i].name + '_'+ state] === 'undefined') {
                    existingPublished[entries[i].name + '_'+ state] = entries[i].time;
                    const switchEvent = new CustomEvent('mqtt-publish', {detail:JSON.stringify({ topic: "switch/"+entries[i].name+"/"+state, message: ""+entries[i].time})});
                    document.dispatchEvent(switchEvent);
                }
            }
        }
      
        html += '</tbody>';
        html += '</table>';
      
        return html;
      }
      connectSwitchDB((db) => {
        getAllEntries(db, (entries) => {
            if(entries.length > 0) {
                const table = createTable(entries);
                $('#allSwitches').html(table);
                $('#trackerNav').append('<li class="nav-item text-center"><a class="nav-link" href="#gsiSwitch"><svg style="color: #147a50;" class="bi bi-toggles" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4.5 9a3.5 3.5 0 1 0 0 7h7a3.5 3.5 0 1 0 0-7zm7 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m-7-14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m2.45 0A3.49 3.49 0 0 1 8 3.5 3.49 3.49 0 0 1 6.95 6h4.55a2.5 2.5 0 0 0 0-5zM4.5 0h7a3.5 3.5 0 1 1 0 7h-7a3.5 3.5 0 1 1 0-7"></path></svg><br/>Schalter</a></li>');
            } else {
                $('#allSwitches').html("Auf den Balken einer Uhrzeit des GrünstromIndex eines Ortes klicken, um einen Schalter zu erstellen.");
            }
          $('#switchExist').on('change',function() {
                $('#switchName').val($('#switchExist').val()); 
          });
          $('.removeSwitch').off();
          $('.removeSwitch').on('click',function() {
              const sig = $(this).attr('data-sig');
              connectSwitchDB((db) => {
                deleteBySwitchID(db, sig, () => {});
                setTimeout(function() {
                    location.reload()
                },100);
              });
          });
        });
      });
});