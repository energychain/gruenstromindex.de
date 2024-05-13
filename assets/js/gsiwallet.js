$(document).ready(function(){
    const renderRow = async function(account,label,header) {
        const deployment = window.deploymentJSON;
        const contractEmission = new ethers.Contract(deployment.account.co2EmissionTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const co2emission = (await contractEmission.balanceOf(account)).toString() * 1 ;
        const contractSaving = new ethers.Contract(deployment.account.co2SavingTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const co2saving = (await contractSaving.balanceOf(account)).toString() * 1 ;
        const contractGeneration = new ethers.Contract(deployment.account.generationTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const generation = (await contractGeneration.balanceOf(account)).toString() * 1 ;
        const contractConsumption = new ethers.Contract(deployment.account.consumptionTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
        const consumption = (await contractConsumption.balanceOf(account)).toString() * 1 ;
        
        let html = '<div class="card" style="margin: 10px;">';
        html += '<div class="card-header">';
        if( (typeof header === 'undefined') || (header === null) ){
            html += '<h4>' + label + '</h4>';
        //  html += '<abbr title="'+account+'">' + account.substring(0,6) + '...</abbr>';
            html += account;
        } else {
            html += '<form id="frmJWTValidate">';
            html += '<div class="input-group"><span class="input-group-text"><svg class="bi bi-person-check-fill fs-2" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" style="color: #147a50;">';
            html += '            <path fill-rule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"></path>';
            html += '            <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"></path>';
            html += '        </svg></span><input id="jwtInput" value="'+account+'"class="form-control" type="text" placeholder="(0x...)" name="jwtInput" required minlength="10" /><button id="openQRCam" class="btn btn-primary" type="button" style="background: #147a50;"><svg class="bi bi-camera-fill" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
            html += '            <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"></path>';
            html += '             <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"></path>';
            html += '        </svg></button><button class="btn btn-primary" type="submit" style="background: #147a50;"><svg class="bi bi-play-circle" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
            html += '            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path>';
            html += '            <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"></path>';
            html += '        </svg></button></div>';
            html += '</form>';
        }

        html += '</div>';
        html += '<div class="card-body">';
            html += '<div class="row">';
                    html += '<div class="col-6" style="padding-bottom:15px">';
                        html += '<h5>'+deployment.label[deployment.account.consumptionTKN].display +'</h5>';
                        html +=  (Math.round(consumption)/ deployment.label[deployment.account.consumptionTKN].div).toFixed(3).replace('.', ',');
                        html +=  '<span class="text-muted">'+deployment.label[deployment.account.consumptionTKN].unit+'</span>';
                    html += '</div>';
                html += '<div class="col-6" style="padding-bottom:15px">';
                    html += '<h5>'+deployment.label[deployment.account.co2EmissionTKN].display +'</h5>';
                    html +=  (Math.round(co2emission)/ deployment.label[deployment.account.co2EmissionTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.co2EmissionTKN].unit+'</span>';
                html += '</div>';
                html += '<div class="col-6" style="padding-bottom:15px">';
                    html += '<h5>'+deployment.label[deployment.account.generationTKN].display +'</h5>';
                    html +=  (Math.round(generation)/ deployment.label[deployment.account.generationTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.generationTKN].unit+'</span>';
                html += '</div>';
                html += '<div class="col-6" style="padding-bottom:15px">';
                    html += '<h5>'+deployment.label[deployment.account.co2SavingTKN].display +'</h5>';
                    html +=  (Math.round(co2saving)/ deployment.label[deployment.account.co2SavingTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.co2SavingTKN].unit+'</span>';
                html += '</div>';
            html += '</div>';
        html += '</div>';
        html += '<div class="card-footer">';
            html += '<div class="row">';
                html += '<div class="col-6">';
                    html += '<h5>Strom</h5>';
                    html +=  (Math.round(consumption-generation)/ deployment.label[deployment.account.consumptionTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.consumptionTKN].unit+'</span>';
                html += '</div>';
                html += '<div class="col-6">';
                    html += '<h5>'+deployment.label[deployment.account.co2EmissionTKN].display +'</h5>';
                    html +=  (Math.round(co2emission-co2saving)/ deployment.label[deployment.account.co2EmissionTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.co2EmissionTKN].unit+'</span>';
                html += '</div>';
            html += '</div>';
        html += '</div>';

        html += '</div>';
        return html;
    }

    $.getJSON("https://app.gruenstromindex.de/assets/js/deployment.json",async function(deployment) {
        window.deploymentJSON = deployment;
        let kinds = '';
        for (const [key, value] of Object.entries(deployment.label)) {
           kinds += '<option value="'+key+'">'+value.display+'</option>';
        }
        $('#tokenKinds').html(kinds);

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

        const renderTable = async function() {
            connectDB((db) => {
                getAllEntries(db, async (data) => {
                    let html = '<div class="row">';
                    for(let i=0;i<data.length;i++) {
                        html += '<div class="col-6">';
                        html += await renderRow(data[i].eventId,""+data[i].name);
                        html += '</div>';
                    }
                    html += '</div>';
                    $('#walletTable').html(html);
                });
            });
        }
        renderTable();

        const secUpdate = function() {
            if(typeof window.wallet == 'undefined') {
                setTimeout(secUpdate, 1000);
            } else {
                updEntity(window.wallet.address);
            }
        }
        secUpdate();

    });
    const updEntity = async (addr) => {
        if((typeof addr === 'undefined')||(addr == null)) addr = $('#jwtInput').val();
        console.log('Render',addr);
        $('#meineWallet').html(await renderRow(addr,'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-person-fill-lock fs-1" style="color: #147a50;"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5v-1a1.9 1.9 0 0 1 .01-.2 4.49 4.49 0 0 1 1.534-3.693C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4m7 0a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1"></path></svg> Diese Identität',true));
        updEvents();
    }

    const updEvents = () => {
        $('#frmJWTValidate').on('submit', function (e) {
            e.preventDefault();
            updEntity();
        });
    
        $('#openQRCam').on('click', function (e) {
            $('#modalQR').modal('show');
        
            function onScanSuccess(decodedText, decodedResult) {
              // handle the scanned code as you like, for example:  
              $('#modalQR').modal('hide');
              $('#jwtInput').val(decodedText);
             updEntity();
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
    }
   
    $('#executeContract').on('submit',async function(e) {
        e.preventDefault();
        const contract = new ethers.Contract($('#tokenKinds').val(), window.deploymentJSON.ABI, window.wallet);
        const tx = await contract.transfer($('#recipient').val(),1000 * $('#amount').val());
        const receipt = await tx.wait();
        console.log(receipt);
    });
});