const reqUpdates = {};

const updater = async function() {
  const runners = [];
  for (const [key, value] of Object.entries(reqUpdates)) {
    runners.push({
      delegationId:key,
      eventId:value
    })
  }
  for(let i=0;i<runners.length;i++) {
    const run = function() {
      return new Promise((resolve, reject) => {
        validateDelegation(runners[i].delegationId, function (data) {
          let html = trackerRowHTML(JSON.parse(data.did), true);
          $('#trackerRow' + runners[i].eventId).replaceWith(html);
          setTimeout(function() {
            resolve();
          },(i*1000)+100);
        })
      })
    }
    await run();
  }

  handleReadingButtonEvents();
}
let updateTimer = null;

const securitization = async function() {
  const orgHTML = $('#btnSecurization').html();
  $('#btnSecurization').html('<div class="spinner-border" role="status"><span class="sr-only">warten...</span></div>');

  const url = 'https://api.corrently.io/v2.0/scope2/eventSecuritization';
  let startData = {
    jwt: $('#presentJWTContent').val(),
    iat: Math.round(new Date().getTime() / 1000)
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
        console.log("Securization Result",data);
        $('#jwtInput').val($('#presentJWTContent').val());
        qrVerify();
        $('#btnSecurization').html(orgHTML);
  })  
  
}
const trackerRowHTML = function (tracker, fromDelegation) {
  if(typeof tracker.err !== 'undefined') return '';
  let delegation = false;
  let disableManual = '';
  let delegationId = '';
  if ((tracker.reading == '[delegation]') && (typeof fromDelegation == 'undefined') && (fromDelegation !== null)) {
    const deepTracker = JSON.parse(JSON.stringify(tracker));
    delegation = true;
    let data = JSON.parse(deepTracker.did);
    // hier können wir einen Update Timer starten...
    reqUpdates[deepTracker.consumption] = deepTracker.eventId;
    delegationId = deepTracker.consumption;
    deepTracker.reading = data.reading;
    deepTracker.consumption = data.consumption;
    deepTracker.emission = data.emission;
    if(updateTimer == null) {
      updateTimer = setInterval(updater, 60000);
      updater();
    }
  }
  if (fromDelegation) { 
    if(tracker.ownerId !== window.wallet.address) {
      disableManual = ' disabled="disabled" '; 
    }
  }
  let multipl = 1;
  if (tracker.type == "generation") { multipl = -1; }
  let html = "";
  html += '<tr id="trackerRow' + tracker.eventId + '" data-delegation="' + delegationId + '">';
  try {

    tracker.did = JSON.parse(tracker.did);
  } catch (e) {
    tracker.did = {};
  }

  if ((tracker.did.aud == window.wallet.address) || (tracker.did.entity == window.wallet.address) || (tracker.ownerId == window.wallet.address)) {

    html += '<td title="Eigentümer" class="text-nowrap">';

    html += '<svg class="bi bi-wallet" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
    html += '<path d="M0 3a2 2 0 0 1 2-2h13.5a.5.5 0 0 1 0 1H15v2a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 0 12.5zm1 1.732V12.5A1.5 1.5 0 0 0 2.5 14h12a.5.5 0 0 0 .5-.5V5H2a1.99 1.99 0 0 1-1-.268M1 3a1 1 0 0 0 1 1h12V2H2a1 1 0 0 0-1 1"></path>';
    html += '</svg>';

    html += '<span class="">';
  } else {
    html += '<td title="Betrachter">';

    html += '<svg class="bi bi-link-45deg" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
    html += '<path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"></path>';
    html += ' <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"></path>';
    html += '</svg>';

    html += '<span class="text-muted">';
  }
  html += ' ' + tracker.name + '</span></td>';
  if(!isNaN(tracker.consumption) && !isNaN(tracker.emission) && ((''+tracker.consumption).substring(0,2) !== "0x")) {
    html += '<td align="right">' + (multipl * tracker.consumption / 1000).toFixed(3).replace('.', ',') + '</td>';
    html += '<td align="right">' + (multipl * tracker.emission / 1000).toFixed(3).replace('.', ',') + '</td>';
  } else {
    html += '<td>&nbsp;</td>';
    html += '<td>&nbsp;</td>';
  }
  if (tracker.consumption !== 0) {
    html += '<td align="right">' + Math.round(1000 * multipl * (tracker.emission / tracker.consumption)) + '</td>';
  } else {
    html += '<td>&nbsp;</td>';
  }
  const niceTime = function (timestamp) {
    timestamp *= 1000;
    const now = new Date().getTime();
    const differenceInSeconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(differenceInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (differenceInSeconds < 120) {
      return "gerade eben";
    } else if (differenceInSeconds < 3600) {
      return `vor ${minutes} Minuten`;
    } else if (differenceInSeconds < (2 * 86400)) {
      return `vor ${hours} Stunden`;
    } else {
      return new Date(timestamp).toLocaleString();
    }
  }


  html += '<td title="'+new Date(tracker.iat*1000).toLocaleString()+'">' + niceTime(tracker.iat) + '</td>';
  html += '<td>';
  html += '<button title="Manuelle Ablesung" ' + disableManual + ' style="background-color:#147a50;margin-right:5px" class="btn btn-primary btn-sm btnReading" data-eventId="' + tracker.eventId + '">';
  html += '<svg class="bi bi-speedometer" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a.5.5 0 0 1 .5.5V4a.5.5 0 0 1-1 0V2.5A.5.5 0 0 1 8 2M3.732 3.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 8a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 8m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.389.389 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.569l3.434-4.297a.389.389 0 0 0-.029-.518z"></path><path fill-rule="evenodd" d="M6.664 15.889A8 8 0 1 1 9.336.11a8 8 0 0 1-2.672 15.78zm-4.665-4.283A11.945 11.945 0 0 1 8 10c2.186 0 4.236.585 6.001 1.606a7 7 0 1 0-12.002 0z"></path></svg>';
  html += '</button>';
  html += '<button title="Nachweisen" style="background-color:#147a50;margin-right:5px;" class="btn btn-primary btn-sm btnPresent" data-eventId="' + tracker.eventId + '">';
  html += '<svg class="bi bi-postage" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
  html += '<path d="M4.75 3a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h6.5a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75zM11 12H5V4h6z"></path>';
  html += '<path d="M3.5 1a1 1 0 0 0 1-1h1a1 1 0 0 0 2 0h1a1 1 0 0 0 2 0h1a1 1 0 1 0 2 0H15v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1a1 1 0 1 0 0 2v1h-1.5a1 1 0 1 0-2 0h-1a1 1 0 1 0-2 0h-1a1 1 0 1 0-2 0h-1a1 1 0 1 0-2 0H1v-1a1 1 0 1 0 0-2v-1a1 1 0 1 0 0-2V9a1 1 0 1 0 0-2V6a1 1 0 0 0 0-2V3a1 1 0 0 0 0-2V0h1.5a1 1 0 0 0 1 1M3 3v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1"></path>';
  html += '</svg>';
  html += '</button>';

  html += '<button title="Teilen" ' + disableManual + ' style="background-color:#147a50;margin-right:5px;" class="btn btn-primary btn-sm btnShare" data-eventId="' + tracker.eventId + '">';
  html += '<svg class="bi bi-share" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
  html += '<path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"></path>';
  html += '</svg>';
  html += '</button>';


  html += '<button title="Inhaberschaft übertragen" ' + disableManual + ' style="background-color:#e6b41e;margin-right:5px;" class="btn btn-primary btn-sm btnTransferTracker" data-eventId="' + tracker.eventId + '">';
  html += '<svg class="bi bi-forward" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
  html += '<path d="M9.502 5.513a.144.144 0 0 0-.202.134V6.65a.5.5 0 0 1-.5.5H2.5v2.9h6.3a.5.5 0 0 1 .5.5v1.003c0 .108.11.176.202.134l3.984-2.933a.51.51 0 0 1 .042-.028.147.147 0 0 0 0-.252.51.51 0 0 1-.042-.028zM8.3 5.647a1.144 1.144 0 0 1 1.767-.96l3.994 2.94a1.147 1.147 0 0 1 0 1.946l-3.994 2.94a1.144 1.144 0 0 1-1.767-.96v-.503H2a.5.5 0 0 1-.5-.5v-3.9a.5.5 0 0 1 .5-.5h6.3z"></path>';
  html += '</svg>';
  html += '</button>';

  html += '<button title="Löschen" style="background-color:#e6b41e;margin-right:5px;" class="btn btn-primary btn-sm btnRemoveTracker" data-eventId="' + tracker.eventId + '">';
  html += '<svg class="bi bi-trash3" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path></svg>';
  html += '</button>';

  html += '</td>';
  html += '</tr>';
  return html;
}

const qrVerify = function () {
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
      data.verification.payload.sig = "DIDSIG:" + JSON.stringify(data.verification.signer);
      renderDID({
        jwt: $('#jwtInput').val(),
        json: data.verification.payload
      })
    });
}
const renderDID = function (data2) {
  $('#btnSecurization').attr('disabled','disabled');
  if(data2.json.entity == window.wallet.address) {
    $('#btnSecurization').removeAttr('disabled');
  } else {
    $('#btnSecurization').attr('disabled','disabled');
  }
  $('#qrcode').html('');
  $('#presentJWTContent').val(data2.jwt);
  $('#presentJSON').val(JSON.stringify(data2.json, undefined, 4));
  let text = "";
  try {
    let type = "Stromverbrauch";
    let multpl = 1;
    if (data2.json.type == "generation") {
      type = "Erzeugung";
      multpl = -1;
    }
    text += "<strong>Kryptographisch geprüfter Sachverhalt</strong><br/><blockquote>Für den Inhaber der ID <abbr class='text-primary' title='Entity:" + data2.json.entity + "'>" + data2.json.entity.substring(0, 6) + "...</abbr> wird ";
    text += " " + type + " in " + data2.json.country + "-" + data2.json.zip + " unter der ID <abbr class='text-primary' title='" + data2.json.sub + "'>" + data2.json.sub.substring(0, 6) + "...</abbr> von " + (data2.json.consumption / 1000) + "kWh bei einer Emission von " + (multpl * data2.json.emission / 1000).toFixed(3).replace('.', ',') + "kgCO<sub></sub> ";
    text += "für den Zeitraum von " + new Date(data2.json.start * 1000).toLocaleString() + " bis " + new Date(data2.json.end * 1000).toLocaleString();
    text += " am " + new Date(data2.json.iat * 1000).toLocaleString() + " von der ID <abbr class='text-primary' title='Notary:" + data2.json.notary + "'>" + data2.json.notary.substring(0, 6) + "...</abbr>  bestätigt ";
    text += " mit der digitalen Signatur <abbr class='text-primary' title='" + data2.json.sig + "'>" + data2.json.sig.substring(0, 6) + "...</abbr>";
    if(data2.json.mpo == "0x0") {
      text += " Die Energiemessung erfolgte durch den Inhaber.";
    } else {
      text += " Die Energiemessung erfolgte durch den Messstellenbetreiber mit Kennung <abbr class='text-primary' title='" + data2.json.mpo + "'>"+data2.json.mpo.substring(0,6)+"...</abbr>.";
    }
    text += "</blockquote>.";
    text += "<br/><hr style='margin-top:15px;'><p class='text-muted'>" + data2.json.did + "</p>";
    
  } catch (e) { console.log(e);}

  $('#presentText').html(text);
  var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: data2.jwt,
    width: 512,
    height: 512,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
  // Problem: Wir wissen nicht, wieviel vorher .... vielleicht sollten wir dies über den Securation Call abrufen?

  $.getJSON("https://app.gruenstromindex.de/assets/js/deployment.json",async function(deployment) {
    $.getJSON("https://api.corrently.io/v2.0/scope2/eventTokens?eventId=" + data2.json.jti,async function(tokens) { 
        window.deploymentJSON = deployment;
        let html = '';
        let openConsumption = 0;
        let openEmission = 0;
        let openGeneration = 0;
        let openSaving = 0;
        if(data2.json.type  == 'consumption') {
            openConsumption = data2.json.consumption;
            openEmission = data2.json.emission;
        } else {
          openGeneration = data2.json.consumption;
          openSaving = data2.json.emission;
        }
        html += '<table class="table table-condensed">';
        html += '<tr><th>&nbsp</th><th>Nachgewiesen (Tracker/NFT)</th><th>Nicht Verbrieft</th><th>Nicht Ausbezahlt</th></tr>';
        const contractEmission = new ethers.Contract(deployment.account.co2EmissionTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const co2emission = (await contractEmission.balanceOf(data2.json.jti)).toString() * 1 ;
        const contractSaving = new ethers.Contract(deployment.account.co2SavingTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const co2saving = (await contractSaving.balanceOf(data2.json.jti)).toString() * 1 ;
        const contractGeneration = new ethers.Contract(deployment.account.generationTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const generation = (await contractGeneration.balanceOf(data2.json.jti)).toString() * 1 ;
        const contractConsumption = new ethers.Contract(deployment.account.consumptionTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const consumption = (await contractConsumption.balanceOf(data2.json.jti)).toString() * 1 ;
        let reqSecu = false;
        let classHighlight='';
        let classPay='';
        if(Math.round(openConsumption)-1 > tokens[deployment.account.consumptionTKN]) {
          reqSecu = true;
          classHighlight='bg-success';
        } else {
          classHighlight='';
        }
        if(consumption > 0) {
          classPay='bg-warning';
        } else {
          classPay='';
        }
        html += '<tr><td>Stromnutzung</td><td>'+(openConsumption/1000).toFixed(3).replace('.', ',')+' kWh</td><td class="'+classHighlight+'">'+(openConsumption/1000 - tokens[deployment.account.consumptionTKN]/1000).toFixed(3).replace('.',',')+' kWh</td><td  class="' + classPay + '">' + (consumption / 1000).toFixed(3).replace('.', ',') + ' kWh</td></tr>';
        if(Math.round(openEmission)-1 > tokens[deployment.account.co2EmissionTKN]) {
          reqSecu = true;
          classHighlight='bg-success';
        } else {
          classHighlight='';
        }
        if(co2emission > 0) {
          classPay='bg-warning';
        } else {
          classPay='';
        }
        html += '<tr><td>&nbsp;mit CO<sub>2</sub> Emission</td><td>'+(openEmission/1000).toFixed(3).replace('.', ',')+' kg</td><td class="'+classHighlight+'">'+(openEmission/1000 - tokens[deployment.account.co2EmissionTKN]/1000).toFixed(3).replace('.',',')+' kg</td><td  class="' + classPay + '">' + (co2emission / 1000).toFixed(3).replace('.', ',') + ' kg</td></tr>';
        if(Math.round(openGeneration)-1 > tokens[deployment.account.generationTKN]) {
          reqSecu = true;
          classHighlight='bg-success';
        } else {
          classHighlight='';
        }
        if(generation > 0) {
          classPay='bg-warning';
        } else {
          classPay='';
        }
        html += '<tr><td>Stromerzeugung</td><td>'+(openGeneration/1000).toFixed(3).replace('.', ',')+' kWh</td><td class="'+classHighlight+'">'+(openGeneration/1000 - tokens[deployment.account.generationTKN]/1000).toFixed(3).replace('.',',')+' kWh</td><td  class="' + classPay + '">' + (generation / 1000).toFixed(3).replace('.', ',') + ' kWh</td></tr>';
        if(Math.round(openSaving)-1 > tokens[deployment.account.co2SavingTKN]) {
          reqSecu = true;
          classHighlight='bg-success';
        } else {
          classHighlight='';
        }
        if(co2saving > 0) {
          classPay='bg-warning';
        } else {
          classPay='';
        }
        html += '<tr><td>&nbsp;mit CO<sub>2</sub> Einsparung</td><td>'+(openSaving/1000).toFixed(3).replace('.', ',')+' kg</td><td class="'+classHighlight+'">'+(openSaving/1000 - tokens[deployment.account.co2SavingTKN]/1000).toFixed(3).replace('.',',')+' kg</td><td class="' + classPay + '">' + (co2saving / 1000).toFixed(3).replace('.', ',') + ' kg</td></tr>';
        html += '</table>';
        $('#secTable').html(html);
      });
  })

  $('#transferTKNTo').val(data2.json.entity);
  $('#formTransferTKN').off();
  $('#formTransferTKN').on('submit',async function(e) {
       const orgHTML = $('#btnTransferOwner').html();
       $('#btnTransferOwner').attr('disabled','disabled');
       $('#btnTransferOwner').html('<div class="spinner-border" role="status"><span class="sr-only">warten...</span></div>');
      e.preventDefault();
      const url = 'https://api.corrently.io/v2.0/scope2/eventCashout';

      let startData = {
        jwt: $('#presentJWTContent').val(),
        iat: new Date().getTime()
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
          console.log("TX Result",data);
          for(let i=0;i<data.length;i++) {
            if(typeof data[i].signedTx !== 'undefined') {
              window.wallet.sendTransaction(data[i].signedTx);
            }
          }
          $('#btnTransferOwner').html(orgHTML);
          $('#btnTransferOwner').removeAttr('disabled');
          renderDID(data2);
        });
  });
  window.localStorage.setItem('lastResolvedJWT', JSON.stringify(data2));
  updateLastResolved();
}

const updateLastResolved = function () {
  let html = '';
  if (window.localStorage.getItem('lastResolvedJWT') !== null) {
    let resolution = JSON.parse(window.localStorage.getItem('lastResolvedJWT'));
    html += '<h4>Letzte Prüfung</h4>';
    html += '<table class="table table-condensed">';
    html += '<tr><td>Entität</td><td><abbr class="text-primary" title="Entity:' + resolution.json.entity + '">' + resolution.json.entity.substring(0, 6) + '...</abbr></td></tr>';
    html += '<tr><td>Ort</td><td>' + resolution.json.country + "-" + resolution.json.zip + '</td></tr>';
    html += '<tr><td>Stromverbrauch</td><td>' + (resolution.json.consumption / 1000).toFixed(3).replace('.', ',') + ' kWh</td></tr>';
    html += '<tr><td>Emission</td><td>' + (resolution.json.emission / 1000).toFixed(3).replace('.', ',') + ' kgCO<sub>2</sub></td></tr>';
    html += '<tr><td>Zeitraum</td><td>' + new Date(resolution.json.start * 1000).toLocaleString() + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;bis</td><td>' + new Date(resolution.json.end * 1000).toLocaleString() + '</td></tr>';
    html += '</table>';
  }
  $('#lastResolvedFront').html(html);
}
const handleReadingButtonEvents = function () {
  $('.btnRemoveTracker').off();
  $('.btnRemoveTracker').on('click', function (e) {
    $('#modalRemoveTracker').modal('show');
    $('#modalRemoveTracker').attr('data', $(e.currentTarget).attr("data-eventId"));
    let testK = $(e.currentTarget).attr("data-eventId").substring(0, 5);

    $('#testKennung').html(testK);
    $('#removeTracker').attr('pattern', testK);

    $(e.currentTarget).attr("data-eventId");
    $('#removeTrackerFrm').off();
    $('#removeTrackerFrm').on('submit', function (e) {
      e.preventDefault();
      connectDB((db) => {
        deleteByID(db, $('#modalRemoveTracker').attr('data'), () => { });
        setTimeout(function () {
          location.reload()
        }, 100);
      });
    })
  });
  $('.btnShare').off();
  $('.btnShare').on('click',function(e) {
    $('#shareFooter').show();
    $('#shareWithId').hide();
    $('#shareModalBody').show();
    $('#modalShare').modal('show');
    $('#modalShare').attr('data', $(e.currentTarget).attr("data-eventId"));
 

    $('#btnShareCam').on('click', function (e) {
      $('#shareReader').show();
      function onScanSuccess(decodedText, decodedResult) {
        // handle the scanned code as you like, for example:  
        $('#shareTo').val(decodedText)
        $('#shareReader').hide();
      }
  
      function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // for example:
        console.warn(`Code scan error = ${error}`);
      }
      $('#shareReader').html('');
      let html5QrcodeScanner = new Html5QrcodeScanner(
        "shareReader",
        { fps: 10, qrbox: { width: 320, height: 200 } },
            /* verbose= */ false);
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    });
    $('#addShare').on('submit',async function(e) {
    $('#shareFooter').hide();
    e.preventDefault();
    connectDB((db) => {
      getByEventID(db, $('#modalShare').attr('data'), async (data) => {
          const url = 'https://api.corrently.io/v2.0/scope2/eventShare';
          let startData = {
            eventId: $('#modalShare').attr('data'),
            delegated: $('#shareTo').val(),
            did: JSON.parse(data.did),
            iat: Math.round(new Date().getTime() / 1000)
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
              $('#shareModalBody').hide();
              $('#shareWithId').show();
              var qrcode = new QRCode(document.getElementById("shareQRCode"), {
                text: data.delegationId,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
              });
              $('#shareId').val(data.delegationId);
              safeSendP2P($('#shareTo').val(), { type: "sharedTracker", delegationId: data.delegationId },"sharedTracker");
            });
      });
    });
    });
  });
  $('.btnTransferTracker').off();
  $('.btnTransferTracker').on('click', function (e) {
    $('#modalTransferTracker').modal('show');
    $('#modalTransferTracker').attr('data', $(e.currentTarget).attr("data-eventId"));

    $('#transferTrackerFrm').off();
    $('#transferTrackerFrm').on('submit', function (e) {
      e.preventDefault();
      connectDB((db) => {
        getByEventID(db, $('#modalTransferTracker').attr('data'), async (data) => {
          const url = 'https://api.corrently.io/v2.0/scope2/eventTransferOwnership';

          let startData = {
            eventId: $('#modalTransferTracker').attr('data'),
            transferTo: $('#transferTo').val(),
            did: JSON.parse(data.did),
            iat: Math.round(new Date().getTime() / 1000)
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
              if(typeof data.err !== 'undefined') {
                $('#modalAlert').attr("data", $('#modalTransferTracker').attr('data'));
                $('#managedAlert').html(data.err);
                $('#modalAlert').modal('show');
              }
              console.log("Transfer DID", data);
            });
        });
      })
    })
  });
  $('.btnReading').off();
  $('.btnReading').on('click', function (e) {
    connectDB((db) => {
      getByEventID(db, $(e.currentTarget).attr("data-eventId"), (data) => {
        $('#trackerName').html(data.name);
        $('#readingUpdate').val(data.reading / 1000);
        $('#readingUpdate').attr('data-eventId', data.eventId);
        $('#readingUpdate').attr('min', data.reading / 1000);
        $('#modalReading').modal('show');
      });
    });
  });
  $('.btnPresent').off();
  $('.btnPresent').on('click', function (e) {
    $('#modalPresentation').modal('show');
    $('#presentText').html('');
    $('#presentJSON').val('');
    $('#presentJWTContent').val('');
    $('#secTable').html('');
    connectDB((db) => {
      getByEventID(db, $(e.currentTarget).attr("data-eventId"), async (data) => {
        let vpdata = {
          did: data.did,
          iat: Math.round(new Date().getTime() / 1000)
        }
        const vp = await signJSON(vpdata);
        const url = 'https://api.corrently.io/v2.0/scope2/eventJWT';
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(vp)
        })
          .then(response => response.json())
          .then(data2 => {
            renderDID(data2);
          });
      });
    });
  });
}

const validateDelegation = async function (delegationId, delegationCb) {
  const listenToId = function(id) {
    if((typeof window.ipcsocket == 'undefined')||(window.ipcsocket==null)) return;
    if(typeof window.validateDelegationSignatures[id] == 'undefined') {
      window.validateDelegationSignatures[id] = "[ipc]";
    }
    console.log("Listining for",id);
    window.ipcsocket.on(''+id, (message) => {
      msg = JSON.parse(message); 
      try {
        msg = JSON.parse(msg);
      } catch(e) {
        
      } 
      if(msg.type == "updateDID") {
        //delete message.type;
        msg.did = msg.did;
        msg.reading = "[delegation]";
        msg.consumption = id;
        msg.emission = id;
        msg.ownerId = msg.did.ownerId;

        if(msg.did.eventId !== id) {
          if(typeof window.validateDelegationSignatures[msg.did.eventId] == 'undefined') {
            listenToId(msg.did.eventId);
          }
        }

        // as it is a Delegation we need to add the delegation ID not the real eventId
        msg.eventId = id;
        // Lets try with pure Update 
        delegationCb(msg);
      } else {
        console.log("Ignore socket msg",msg);
      }
    });
  }

  const url = 'https://api.corrently.io/v2.0/scope2/eventDelegation';
  let startData = {
    delegationId: delegationId,
    iat: Math.round(new Date().getTime() / 1000)
  };
  if(typeof window.validateDelegationSignatures == 'undefined') window.validateDelegationSignatures = {};
  if(typeof window.validateDelegationSignatures[delegationId] == 'undefined') {
    window.validateDelegationSignatures[delegationId] = "[pending]";
     window.validateDelegationSignatures[delegationId] = await signJSON(startData);
     listenToId(delegationId);
  } else {
    if(window.validateDelegationSignatures[delegationId] == "[pending]") {
      setTimeout(() => {
        validateDelegation(delegationId,delegationCb);           
      },3000);
      console.log("Pending",delegationId);
      return;
    }
  }

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(window.validateDelegationSignatures[delegationId])
  })
    .then(response => response.json())
    .then(data => {
      connectDB((db) => {
        if(typeof data == 'undefined') { console.log("No Data");return; }
        if(typeof db == 'undefined') { console.log("No DB");return; }
        data.did = JSON.stringify(data);
        data.reading = "[delegation]";
        data.consumption = delegationId;
        data.emission = delegationId;
        data.ownerId = data.did.ownerId;
        if(typeof window.validateDelegationSignatures[data.eventId] == 'undefined') {
          if(typeof data.err == 'undefined') {
            listenToId(data.eventId);
          }
        }
        addData(db, data, () => {
          delegationCb(data);
        });
        if(typeof window.ipcsocket !== 'undefined') {
          if(data.reading !== ' [delegation]') {
            data.type = "updateDID";
            data.sender = window.wallet.address;
            if(typeof data.err == 'undefined') {
                safeSendP2P(data.eventId, JSON.stringify(data),"updateDelegate");
            }
          }
        }
      });
    });
}

const updateDid = async function (updateData) {
  if(typeof updateData.did !== 'undefined') {
    let did = updateData.did;
    try {
      did = JSON.parse(did);
    } catch(e) {}
    if(typeof did.err !== 'undefined') {
      console.log("updateDid cancelled ", did.err);
      return
    } 
  }
  const data = updateData;

  if (data.reading == data.did.reading) {
    console.log("Replay");
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
        data.type = data2.type;
        // Here we publish
        
        updateByEventID(db, data2.eventId, data, () => {
          $('#trackerRow' + data.eventId).replaceWith(trackerRowHTML(data));
          handleReadingButtonEvents();
        });
        safeSendP2P(data.eventId, data2,"updateDID");
        const consumptionEvent = new CustomEvent('mqtt-publish', { detail: JSON.stringify({ topic: "tracker/" + data.eventId + "/consumption", message: "" + data.consumption }) });
        document.dispatchEvent(consumptionEvent);

        const emissionEvent = new CustomEvent('mqtt-publish', { detail: JSON.stringify({ topic: "tracker/" + data.eventId + "/emission", message: "" + data.emission }) });
        document.dispatchEvent(emissionEvent);

      });
    });
}

$(document).ready(function () {
  
  $('#trackerNav').append('<li class="nav-item text-center withWallet"><a class="nav-link" href="#gsiTracker"><svg class="bi bi-plugin" xmlns="http://www.w3.org/2000/svg" style="color: #147a50;" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 1 2.898 5.673c-.167-.121-.216-.406-.002-.62l1.8-1.8a3.5 3.5 0 0 0 4.572-.328l1.414-1.415a.5.5 0 0 0 0-.707l-.707-.707 1.559-1.563a.5.5 0 1 0-.708-.706l-1.559 1.562-1.414-1.414 1.56-1.562a.5.5 0 1 0-.707-.706l-1.56 1.56-.707-.706a.5.5 0 0 0-.707 0L5.318 5.975a3.5 3.5 0 0 0-.328 4.571l-1.8 1.8c-.58.58-.62 1.6.121 2.137A8 8 0 1 0 0 8a.5.5 0 0 0 1 0"></path></svg><br/>Tracker</a></li>');
    /*
  $('#gsiAddTracker').on('click', function () {
    $('#modalTracker').modal('show');
  });*/
  
  $('#addManagedBtn').on('click', function () {
    $('#modalManaged').modal('show');
    $('#modalTracker').modal('hide');
  });
  $('#addManaged').on('submit', function (e) {
    e.preventDefault();
    $('#submitManaged').attr('disabled', true);

    validateDelegation($('#managedTrackerId').val(), function () {
      location.reload();
    });
  });

  $('#addTracker').on('submit', function (e) {
    e.preventDefault();
    $('#submitTracker').attr('disabled', true);
    async function startConsumption() {
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
        reading: $('#readingTracker').val() * 1000,
        iat: Math.round(new Date().getTime() / 1000),
        type: "consumption"
      };

      if ($("#typeGeneration").is(":checked")) {
        startData.type = "generation";
      }

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
    let html = '<div class="table-responsive"><table class="table table-condensed">';
    html += '<thead>';
    html += '<tr>';
    html += '<th>Name</th>';
    html += '<th style="text-align:right">Verbrauch (kWh)&nbsp;&nbsp;</th>';
    html += '<th style="text-align:right">CO<sub>2</sub>-Emission (kg)&nbsp;&nbsp;</th>';
    html += '<th style="text-align:right">Ø g/kWh</th>';
    html += '<th>Aktualisierung</th>';
    html += '<th>&nbsp;</th>'
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    let totalKWH = 0;
    let totalCO2 = 0;

    for (let i = 0; i < entries.length; i++) {
      if(typeof entries[i].err !== 'undefined') {
        $('#modalAlert').attr("data", entries[i].eventId);
        $('#managedAlert').html("Fehlende Datenbereitstellung für "+entries[i].eventId);
        $('#modalAlert').modal('show');
        continue;
      }
      try {
        const did = JSON.parse(entries[i].did);
        if (entries[i].type === "consumption") {
          totalKWH += did.consumption * 1;
          totalCO2 += did.emission * 1;
        } else {
          totalKWH += did.consumption * (-1);
          totalCO2 += did.emission * (-1);
        }
      } catch (e) {

      }
      html += trackerRowHTML(entries[i]);
      const gsiEvent = new CustomEvent('mqtt-subscribe', { detail: "tracker/" + entries[i].eventId + "/reading" });
      document.dispatchEvent(gsiEvent);

      if ((entries[i].pending) && (entries[i].pending.length > 0)) {
        updateDid(JSON.parse(entries[i].pending));
      }
    }

    html += '</tbody>';
    html += '</table></div>';
    if (totalKWH !== 0) {
      let avg = (totalCO2 / totalKWH) * 1000
      if (avg < 0) {
        $('#trackerBadge').css('background-color', '#147a50');
      } else {
        $('#trackerBadge').css('background-color', '#e6b41e');
      }
      $('#avgCO2').html(Math.round(avg));
      $('#avgCO2').attr('title',totalCO2 + "/" + (totalKWH/1000));
    }
    return html;
  }
  connectDB((db) => {

    getAllEntries(db, (entries) => {
      if (entries.length < 1) {
        let html = '<button class="btn btn-light" id="gsiAddTrackerFront">';
        html += '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-plus-circle-fill" style="width: 30px;height: 30px;color: #147a50;">';
        html += '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"></path>';
        html += '</svg>';
        html += '&nbsp;Tracker hinzufügen</button>';
        $('#allTrackers').html(html);
        $('#gsiAddTrackerFront').on('click', function () {
          $('#modalTracker').modal('show');
        })
      } else {
        let table = createTable(entries);
        table += '<hr/>';
        table += '<button class="btn btn-light" id="gsiAddTrackerFront">';
        table += '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-plus-circle-fill" style="width: 30px;height: 30px;color: #147a50;">';
        table += '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"></path>';
        table += '</svg>';
        table += '&nbsp;Tracker hinzufügen</button>';
        $('#allTrackers').html(table);
        $('#gsiAddTrackerFront').on('click', function () {
          $('#modalTracker').modal('show');
        })
        
      }


      handleReadingButtonEvents();

      $('#frmUpdateReading').on('submit', function (e) {
        e.preventDefault();
        $('#btnUpdateReading').attr('disabled', true);
        getByEventID(db, $('#readingUpdate').attr('data-eventId'), async (data) => {
          const readingEvent = new CustomEvent('mqtt-publish', { detail: JSON.stringify({ topic: "tracker/" + $('#readingUpdate').attr('data-eventId') + "/reading", message: "" + $('#readingUpdate').val() * 1000 }) });
          document.dispatchEvent(readingEvent);

          let updateData = {
            eventId: $('#readingUpdate').attr('data-eventId'),
            did: JSON.parse(data.did),
            reading: $('#readingUpdate').val() * 1000,
            iat: Math.round(new Date().getTime() / 1000)
          };
          updateDid(updateData);
          $('#modalReading').modal('hide');
          $('#btnUpdateReading').removeAttr('disabled');
        })


      });
      updater();
    });
  });
  $('#removeAlert').on('click',function(e) {
    connectDB((db) => {
      if(typeof reqUpdates[$('#modalAlert').attr("data")] !== 'undefined') {
        deleteByID(db, reqUpdates[$('#modalAlert').attr("data")], (dx) => { 
          deleteByID(db, $('#modalAlert').attr("data"), (dx) => { 
            setTimeout(function () {
              location.reload()
            }, 100);
          });
        });
      } else {
        deleteByID(db, $('#modalAlert').attr("data"), (dx) => { 
          setTimeout(function () {
            location.reload()
          }, 100);
        });
      }
    });
  });
  $('#frmJWTValidate').on('submit', function (e) {
    e.preventDefault();
    $('#modalPresentation').modal('show');
    qrVerify();
  });
  $('#openQRCam').on('click', function (e) {
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
      { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  });
  updateLastResolved();
  $('#manageAlert').on('click',function() {
    validateDelegation($('#modalAlert').attr("data"),function(cb) {
      console.log(cb);
      console.log("Might Reload?");
    })
  });
  $('#existingShares').on('click',function() {
        const eventId = $('#modalShare').attr('data');
        connectDB((db) => {
          getByEventID(db, $('#modalShare').attr('data'), async (data) => {
              const url = 'https://api.corrently.io/v2.0/scope2/eventShares';
              let startData = {
                eventId: $('#modalShare').attr('data'),
                did: JSON.parse(data.did),
                iat: Math.round(new Date().getTime() / 1000)
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
                  $('#tableShared').html('');
                  let html = '';
                  html += '<table class="table table-condensed">';
                  html += '<tr>';
                  html += '<th>Freigabe</th>';
                  html += '<th>An</th>';
                  html += '<th>Ab</th>';
                  html += '<th>Bis</th>';
                  html += '<th>&nbsp;</th>';
                  html += '</tr>';
                  for(let i=0;i<data.length;i++) {
                    if(typeof data[i].delegationId == 'undefined') continue;
                    if(typeof data[i].delegated == 'undefined') continue;
                    html += '<tr>';
                    html += '<td><abbr class="text-primary" title="' + data[i].delegationId + '">' + data[i].delegationId.substring(0, 6) + '...</abbr></td>';
                    html += '<td> <abbr class="text-primary" title="' + data[i].delegated + '">' + data[i].delegated.substring(0, 6) + '...</abbr></td>';
                    html += '<td>' + new Date(data[i].iat*1000).toLocaleString() + '</td>';
                    html += '<td>' + new Date(data[i].exp*1000).toLocaleString() + '</td>';
                    html += '<td>';
                    html += '<button title="Löschen" style="background-color:#e6b41e;margin-right:5px;" class="btn btn-primary btn-sm btnRemoveShare" data-delegationId="' + data[i].delegationId + '">';
                    html += '<svg class="bi bi-trash3" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path></svg>';
                    html += '</button>';
                    html += '</td>';
                    html += '</tr>';
                  }
                  html += '</table>';
                  $('#tableShared').html(html);
                  console.log("Our Shares", data);
                  $('#modalShare').modal('hide');
                  $('#modalShares').modal('show');
                  $('.btnRemoveShare').off();
                  $('.btnRemoveShare').on('click',function(e) {
                    const delegationId = $(this).attr('data-delegationId');
                    connectDB((db) => {
                      getByEventID(db, $('#modalShare').attr('data'), async (data) => {
                          const url = 'https://api.corrently.io/v2.0/scope2/eventShareRemove';
                          let startData = {
                            eventId: eventId,
                            delegationId: delegationId,
                            did: JSON.parse(data.did),
                            iat: Math.round(new Date().getTime() / 1000)
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
                                console.log("Should be removed",data);
                          })
                      });
                    });
                  });
                });
              });
          });
  });
  $('#btnManagedCam').on('click', function (e) {
    $('#managedReader').show();
    function onScanSuccess(decodedText, decodedResult) {
      // handle the scanned code as you like, for example:  
      $('#managedTrackerId').val(decodedText)
      $('#managedReader').hide();
    }

    function onScanFailure(error) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      console.warn(`Code scan error = ${error}`);
    }

    let html5QrcodeScanner = new Html5QrcodeScanner(
      "managedReader",
      { fps: 10, qrbox: { width: 320, height: 200 } },
          /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  });

  $('#btnSecurization').attr('disabled','disabled');
  $('#btnSecurization').on('click',function(e) {
    $('#btnSecurization').attr('disabled','disabled');
    securitization();
  });
});