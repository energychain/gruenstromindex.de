window.hknask = {}

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
        
        let html = '<div style="margin-bottom:15px;padding:10px;" class="h-100"><div class="card h-100" style="" id="card_' + account + '">';
        html += '<div class="card-header">';
        if( (typeof header === 'undefined') || (header === null) ){
            html += '<h4>' + label + '</h4>';
        //  html += '<abbr title="'+account+'">' + account.substring(0,6) + '...</abbr>';
            html += '<button class="btn btn-sm btn-light openAccount" data="' + account + '">' + account + '</button>';
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
            // If we set the Header we are in main so lets populate history Channel....
            $('#txHistory').html('');
            const createHistory = async function() {
                const getTxsForContract = async function(erc20conctract) {
                    let fullLog = [];
                    let rfilter = erc20conctract.filters.Transfer(null, account, null);
                    let rlogs = await erc20conctract.queryFilter(rfilter);
                    fullLog = fullLog.concat(rlogs);
                    let sfilter = erc20conctract.filters.Transfer(account, null, null);
                    let slogs = await erc20conctract.queryFilter(sfilter);
                    fullLog = fullLog.concat(slogs);
                    fullLog.sort((a,b) => b.blockNumber - a.blockNumber);
                    return fullLog;
                }
                let logs = [];
                logs = logs.concat(await getTxsForContract(contractSaving));
                logs = logs.concat(await getTxsForContract(contractEmission));
                logs = logs.concat(await getTxsForContract(contractGeneration));
                logs = logs.concat(await getTxsForContract(contractConsumption));
                logs.sort((a,b) => b.blockNumber - a.blockNumber);
                let html = '';
                html += '<div class="card"><div class="card-header"><h4>Transaktionen</h4></div>';
                html += '<div class="card-body">';
                html += '<table class="table table-condensed table-striped">';
                html += '<thead>';
                html += '<tr><th>Block #</th><th>Art</th><th>ID</th><th>Menge</th></tr>'
                html += '</thead>';
                html += '<tbody>';
                for(let i=0;i<logs.length;i++) {
                    html += '<tr>';
                    html += '<td>'+logs[i].blockNumber+'</td>';
                    html += '<td>'+window.deploymentJSON.label[logs[i].address].display+'</td>';
                    let multpl = 1;
                    if(logs[i].args[0] == account) {
                        html += '<td><button class="btn btn-sm openAccount btn-light" data="'+logs[i].args[1]+'">' + logs[i].args[1] + '</button></td>';
                        multpl = -1;
                    } else {
                        let label = logs[i].args[0].toString();
                        if(logs[i].args[0].toString()=="0x0000000000000000000000000000000000000000") {
                            label = "Verbriefung";
                        }
                        html += '<td><button class="btn btn-sm openAccount btn-light" data="'+logs[i].args[0]+'">' + label + '</button></td>'; 
                    }
                    let amount = logs[i].args[2].toString() * multpl;
                    html += '<td align="right">' + (amount/1000).toFixed(3).replace('.',',') + ' '+window.deploymentJSON.label[logs[i].address].unit+'</td>';
                    html += '</tr>';
                }
                html += '</tbody>';
                html += '</table>';
                html += '</div></div>';
                $('#txHistory').html(html);
                $('.openAccount').off();
                $('.openAccount').on('click', async function(e) {
                        $('#meineWallet').html(await renderRow($(this).attr("data"),'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-person-fill-lock fs-1" style="color: #147a50;"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5v-1a1.9 1.9 0 0 1 .01-.2 4.49 4.49 0 0 1 1.534-3.693C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4m7 0a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1"></path></svg> Diese Identität',true));
                });
            }
            createHistory();
        }

        html += '</div>';

        let ehtml = '';
        let hkns = window.localStorage.getItem("hkns");
        let viaHKN = {};

        if((typeof hkns !== 'undefined') && (hkns !== null)) {
                hkns = JSON.parse(hkns);    
                let eventHKNS = [];
                for(let j=0;j<hkns.length;j++) {
                    if(hkns[j].eventId == account) eventHKNS.push(hkns[j]);
                }
                eventHKNS = eventHKNS.sort((a,b) => b.iat - a.iat);
                if(eventHKNS.length > 0) {
                    ehtml += '<h5>Letzte 5 Einzelnachweise (eigene Brieftasche)</h5><table class="table table-condensed">';
                    for(let i=0;(i<eventHKNS.length) && (i<5);i++) {
                        if(typeof viaHKN[eventHKNS[i].contract] == 'undefined') viaHKN[eventHKNS[i].contract] = 0;
                        viaHKN[eventHKNS[i].contract] += 1 * eventHKNS[i].amount;
                        ehtml += '<tr><td>'+eventHKNS[i].block+'</td>';
                        ehtml += '<td>'+new Date(eventHKNS[i].iat * 1000).toLocaleString()+'</td>';
                        ehtml += '<td>'+deployment.label[eventHKNS[i].contract].display+'</td>';
                        ehtml += '<td align="right">'+(eventHKNS[i].amount/1000).toFixed(3).replace('.', ',')+deployment.label[eventHKNS[i].contract].unit+'</td>';
                        ehtml += '</tr>';
                    }
                    ehtml += '</table>';
                }


        }

        html += '<div class="card-body">';
            html += '<div class="row">';
                    html += '<div class="col-6" style="padding-bottom:15px">';
                        if(typeof viaHKN[deployment.account.consumptionTKN] == 'undefined') viaHKN[deployment.account.consumptionTKN] = 0;
                        html += '<h5>'+deployment.label[deployment.account.consumptionTKN].display +'</h5>';
                        html +=  (Math.round(consumption + viaHKN[deployment.account.consumptionTKN])/ deployment.label[deployment.account.consumptionTKN].div).toFixed(3).replace('.', ',');
                        html +=  '<span class="text-muted">'+deployment.label[deployment.account.consumptionTKN].unit+'</span>';
                    html += '</div>';
                html += '<div class="col-6" style="padding-bottom:15px">';
                    if(typeof viaHKN[deployment.account.co2EmissionTKN] == 'undefined') viaHKN[deployment.account.co2EmissionTKN] = 0;
                    html += '<h5>'+deployment.label[deployment.account.co2EmissionTKN].display +'</h5>';
                    html +=  (Math.round(co2emission + viaHKN[deployment.account.co2EmissionTKN])/ deployment.label[deployment.account.co2EmissionTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.co2EmissionTKN].unit+'</span>';
                html += '</div>';
                html += '<div class="col-6" style="padding-bottom:15px">';
                     if(typeof viaHKN[deployment.account.generationTKN] == 'undefined') viaHKN[deployment.account.generationTKN] = 0;
                    html += '<h5>'+deployment.label[deployment.account.generationTKN].display +'</h5>';
                    html +=  (Math.round(generation  + viaHKN[deployment.account.generationTKN])/ deployment.label[deployment.account.generationTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.generationTKN].unit+'</span>';
                html += '</div>';
                html += '<div class="col-6" style="padding-bottom:15px">';
                    if(typeof viaHKN[deployment.account.co2SavingTKN] == 'undefined') viaHKN[deployment.account.co2SavingTKN] = 0;
                    html += '<h5>'+deployment.label[deployment.account.co2SavingTKN].display +'</h5>';
                    html +=  (Math.round(co2saving  + viaHKN[deployment.account.co2SavingTKN])/ deployment.label[deployment.account.co2SavingTKN].div).toFixed(3).replace('.', ',');
                    html +=  '<span class="text-muted">'+deployment.label[deployment.account.co2SavingTKN].unit+'</span>';
                html += '</div>';
            html += '</div>';
            html += ehtml;
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
        html += '</div>'; // encapsulated DIV
        return html;
    }

    $.getJSON("https://app.gruenstromindex.de/assets/js/deployment.json",async function(deployment) {
        window.deploymentJSON = deployment;
        let kinds = '';
        for (const [key, value] of Object.entries(deployment.label)) {
           kinds += '<option value="'+key+'" data-unit="'+value.unit+'" data-type="'+value.type+'">'+value.display+'</option>';
        }
        $('#tokenKinds').html(kinds);
        kinds += '<option disabled>Fiat € - EUR</option>';
        kinds += '<option disabled>Fiat $ - USD</option>';
        kinds += '<option disabled>Crypto - ETH</option>';
        kinds += '<option disabled>Crypto - SOL</option>';
        $('#tknTypes').html(kinds);
        $('#sendTokenAccount').html($('#tokenKinds').val());
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
                    updEvents();
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

        let hkns = window.localStorage.getItem("hkns");
        let ehtml = '<div class="card"><div class="card-body">'; 
        ehtml += '<table class="table table-condensed table-striped">';
        ehtml += '<thead>';
        ehtml += '<tr><th>&nbsp;</th><th>Kennung</th><th>Datum</th><th>Quelle</th><th>Art</th><th>Wert</th><th>Gewandelt</th></tr>';
        ehtml += '</thead>';
        ehtml += '<tbody>';
        checkrunners = [];
        if((typeof hkns !== 'undefined') && (hkns !== null)) {
            hkns = JSON.parse(hkns);    
            hkns = hkns.sort((a,b) => b.iat - a.iat);
            let eventHKNS = [];
          
            for(let j=0;j<hkns.length;j++) {
                ehtml += '<tr><td id="status_'+hkns[j].hkn+'">';
                ehtml += '<svg class="bi bi-person-fill-exclamation" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                ehtml += '<path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4"></path>';
                ehtml += '<path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"></path>';
                ehtml += '</svg></td>';
                ehtml += '<td><abbr title="'+hkns[j].hkn+'">'+hkns[j].hkn.substring(0,6)+'...</abbr></td>';
                ehtml += '<td>'+new Date(hkns[j].iat * 1000).toLocaleString()+'</td>';
                ehtml += '<td><a href="#card_'+hkns[j].eventId+'"><abbr title="'+hkns[j].eventId+'">'+hkns[j].eventId.substring(0,6)+'...</abbr></a></td>';
                ehtml += '<td>'+deployment.label[hkns[j].contract].display+'</td>';
                ehtml += '<td align="right">'+(hkns[j].amount/1000).toFixed(3).replace('.', ',')+''+deployment.label[hkns[j].contract].unit+'</td>';
                ehtml += '<td align="right"><span id="settled_'+hkns[j].hkn+'">-</span>'+deployment.label[hkns[j].contract].unit+'</td>';
                ehtml += '<td><button class="btn btn-primary btn-sm btnValuta" id="ask'+hkns[j].hkn+'" style="background-color:#a0a0a0;" data="'+hkns[j].hkn+'" data-idx="'+j+'">';
                ehtml += '<svg class="bi bi-cash-coin" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
                ehtml += '<path fill-rule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8m5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0"></path>';
                ehtml += '<path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1h-.003zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195l.054.012z"></path>';
                ehtml += '<path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083c.058-.344.145-.678.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1z"></path>';
                ehtml += '<path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 5.982 5.982 0 0 1 3.13-1.567z"></path>';
                ehtml += '</svg>';
                ehtml += '</button></td>';
                ehtml += '</tr>';
                checkrunners.push(hkns[j]);
            }
        }
        checkrunners.reverse();
        ehtml += '</tbody>';
        ehtml += '</table>';
        ehtml += '</div></div>';
        $('#hknsTable').html( ehtml );

        const doChecks = async () => {
            const runner = checkrunners.pop();
            const hkn = new ethers.Contract(runner.hkn, deployment.HKN.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
            const owner = (await hkn.owner());

            // Need to check if we are either the owner or have tokens

            let ihtml = '';
            if(owner == window.wallet.address) {              
                ihtml += '<svg class="bi bi-person-check-fill" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="#147a50" viewBox="0 0 16 16">';
                ihtml += '<path fill-rule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"></path>';
                ihtml += '<path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"></path>';
                ihtml += '</svg>';
            } else {
                ihtml += '<svg class="bi bi-person-fill-x" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="#e6b41e" viewBox="0 0 16 16">';
                ihtml += '<path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4"></path>';
                ihtml += '<path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m-.646-4.854.646.647.646-.647a.5.5 0 0 1 .708.708l-.647.646.647.646a.5.5 0 0 1-.708.708l-.646-.647-.646.647a.5.5 0 0 1-.708-.708l.647-.646-.647-.646a.5.5 0 0 1 .708-.708"></path>';
                ihtml += '</svg>';
            }
            $('#status_'+runner.hkn).html(ihtml);
            const partials = new ethers.Contract(await hkn.partials(),deployment.ABI,new ethers.providers.JsonRpcProvider(deployment.RPC));
            
            const settled = ((await partials.balanceOf(runner.hkn)).toString() * 1);
            
            $('#settled_'+runner.hkn).html( ((runner.amount - settled)/1000).toFixed(3).replace('.',',') );
            const url = 'https://api.corrently.io/v2.0/scope2/eventAsk';
                let startData = {
                    hkn: runner.hkn,
                    iat:Math.round(new Date().getTime()/1000),
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
                        runner.ask = data;
                        if(typeof data.err == 'undefined') {
                            window.hknask[runner.hkn] = data;
                            $('#ask'+runner.hkn).css('background-color','#147a50');
                        } else {
                            $('#ask'+runner.hkn).css('background-color','#e6b41e');
                        }
                });
            
            if(checkrunners.length > 0) {
                setTimeout(doChecks, 300);
            }
        }
        doChecks();
        $('.btnValuta').off();
        $('.btnValuta').on('click', function (e) {
            const calculateRevenue = function() {
                let youget = (hkns[$('#modalHKN').attr('data-idx')].amount * $('#faktor').val());
                let txt = "";
                txt += "Bei vollständigem Verkauf von "+(hkns[$('#modalHKN').attr('data-idx')].amount/1000).toFixed(3).replace('.',',')+""+deployment.label[hkns[$('#modalHKN').attr('data-idx')].contract].unit;
                txt += " "+deployment.label[hkns[$('#modalHKN').attr('data-idx')].contract].display+" aus diesem Nachweis, werden "+(youget/1000).toFixed(3).replace('.',',');
                txt += deployment.label[$('#tknTypes').val()].unit + " ";
                txt += deployment.label[$('#tknTypes').val()].display + " ";
                txt += "gutgeschrieben.";
                $('#hlpKurs').html(txt);
                $('#targetUnit').html(deployment.label[$('#tknTypes').val()].unit);
            }
            if(typeof window.hknask[$(this).attr('data')] !== 'undefined') {
                $('#faktor').val(window.hknask[$(this).attr('data')].targetAmount/1000);
                $('#tknTypes').val(window.hknask[$(this).attr('data')].targetTkn);
            }
            let options = $('#tknTypes').children('option')
            for(let i=0;i<options.length;i++) {
                if(typeof $(options[i]).attr('data-unit') !== 'undefined') {
                    if ( ($(options[i]).attr('data-unit') !== deployment.label[hkns[$(this).attr('data-idx')].contract].unit) && 
                        ($(options[i]).attr('data-type') !== deployment.label[hkns[$(this).attr('data-idx')].contract].type)
                     ){
                        $(options[i]).removeAttr('disabled');
                        $(options[i]).attr('selected','selected');
                        $('#tknTypes').val($(options[i]).attr('value'));
                    } else {
                        $(options[i]).attr('disabled','disabled');
                        $(options[i]).removeAttr('selected');
                    }
                }
                 
            }
            $('#modalHKN').modal('show');
            $('#modalHKN').attr('data',$(this).attr('data'));
            $('#modalHKN').attr('data-idx',$(this).attr('data-idx'));
            $('#sourceType').html(deployment.label[hkns[$(this).attr('data-idx')].contract].display);
            $('#sourceUnit').html(deployment.label[hkns[$(this).attr('data-idx')].contract].unit);
            $('#tknTypes').off();
            $('#tknTypes').change(calculateRevenue);
            $('#faktor').off();
            $('#faktor').change(calculateRevenue);
            $('#addOffer').off();
            $('#deleteOffer').off();
            $('#deleteOffer').on('click',async function(e) {
                const url = 'https://api.corrently.io/v2.0/scope2/eventOffer';

                let startData = {
                    hkn: hkns[$('#modalHKN').attr('data-idx')].hkn,
                    balance: 0,
                    account: window.wallet.address,
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
                        location.reload();
                   });
            });
            $('#addOffer').on('submit',async function(e) {
                e.preventDefault();
                $('#submitOffer').attr('disabled','disabled');
                const erc20conctract = new ethers.Contract(hkns[$('#modalHKN').attr('data-idx')].contract,deployment.ABI,window.wallet);
                // Update Allowance
                const erc20tx = await erc20conctract.approve(hkns[ $('#modalHKN').attr('data-idx')].contract,hkns[$('#modalHKN').attr('data-idx')].amount);
                const erc20receipt = await erc20tx.wait();
                console.log('erc20tx',erc20receipt);
                const url = 'https://api.corrently.io/v2.0/scope2/eventOffer';

                let startData = {
                    hkn: hkns[$('#modalHKN').attr('data-idx')].hkn,
                    sourceTkn: hkns[$('#modalHKN').attr('data-idx')].contract,
                    issued:hkns[$('#modalHKN').attr('data-idx')].iat,
                    iat:Math.round(new Date().getTime()/1000),
                    targetTkn: $('#tknTypes').val(),
                    targetAmount: Math.round($('#faktor').val() * 1000),
                    balance: hkns[$('#modalHKN').attr('data-idx')].amount,
                    account: window.wallet.address,
                    allowance:erc20receipt,
                    did:hkns[$('#modalHKN').attr('data-idx')].did
                };
                console.log("Offer Data",startData);
                fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(await signJSON(startData))
                })
                    .then(response => response.json())
                    .then(data => {
                        location.reload();
                   });
            });
            calculateRevenue();
        });
    });
    const updEntity = async (addr) => {
        $('#runTransferBtn').attr('disabled','disabled');
        $('#gasAlert').hide();
        if((typeof addr === 'undefined')||(addr == null)) addr = $('#jwtInput').val();
        $('#meineWallet').html(await renderRow(addr,'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-person-fill-lock fs-1" style="color: #147a50;"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5v-1a1.9 1.9 0 0 1 .01-.2 4.49 4.49 0 0 1 1.534-3.693C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4m7 0a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1"></path></svg> Diese Identität',true));
        updEvents();
        $('#profileQR').html('');
        var qrcode = new QRCode(document.getElementById("profileQR"), {
            text: addr,
            width: 400,
            height: 400,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
          if(addr == window.wallet.address) {
            $('#runTransferBtn').removeAttr('disabled');
            window.provider.getBalance(window.wallet.address).then(function(balance) {
                balance = balance.toString() * 1;
                if(balance < 10000) {
                    $('#gasAlert').show();
                }
            });
        }
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
        $('.openAccount').off();
        $('.openAccount').on('click', async function(e) {
                $('#meineWallet').html(await renderRow($(this).attr("data"),'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="bi bi-person-fill-lock fs-1" style="color: #147a50;"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5v-1a1.9 1.9 0 0 1 .01-.2 4.49 4.49 0 0 1 1.534-3.693C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4m7 0a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1"></path></svg> Diese Identität',true));
        });
    }

    $('#scanRecipient').on('click',function(e) {
        $('#modalQR').modal('show');
        
        function onScanSuccess(decodedText, decodedResult) {
          // handle the scanned code as you like, for example:  
          $('#modalQR').modal('hide');
          $('#recipient').val(decodedText);
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
   
    $('#executeContract').on('submit',async function(e) {
        e.preventDefault();
        $('#runTransferBtn').attr('disabled','disabled');
        const orgHhtml = $('#executeContract').html();
        $('#executeContract').html('<div class="spinner-border" role="status"><span class="sr-only">warten...</span></div>');
        const contract = new ethers.Contract($('#tokenKinds').val(), window.deploymentJSON.ABI, window.wallet);
        const tx = await contract.transfer($('#recipient').val(),100 * $('#amount').val());
        const receipt = await tx.wait();
        console.log(receipt);
        $('#amount').val(0);
        $('#recipient').val('');
        $('#runTransferBtn').removeAttr('disabled');
        $('#executeContract').html(orgHhtml);
    });
    $('#tokenKinds').on('change',async function(e) {
        $('#sendTokenAccount').html($('#tokenKinds').val());
    })


    
});