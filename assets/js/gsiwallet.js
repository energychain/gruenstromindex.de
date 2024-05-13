$(document).ready(function(){
    $.getJSON("https://app.gruenstromindex.de/assets/js/deployment.json",async function(deployment) {

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
        
        const renderRow = async function(account,label) {
            const contractEmission = new ethers.Contract(deployment.account.co2EmissionTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
            const co2emission = (await contractEmission.balanceOf(account)).toString() * 1 ;
            const contractSaving = new ethers.Contract(deployment.account.co2SavingTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
            const co2saving = (await contractSaving.balanceOf(account)).toString() * 1 ;
            const contractGeneration = new ethers.Contract(deployment.account.generationTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
            const generation = (await contractGeneration.balanceOf(account)).toString() * 1 ;
            const contractConsumption = new ethers.Contract(deployment.account.consumptionTKN, deployment.ABI, new ethers.providers.JsonRpcProvider(deployment.RPC));
            const consumption = (await contractConsumption.balanceOf(account)).toString() * 1 ;

            let html = '<tr>';
            html += '<td>' + label + '</td>';
            html += '<td>' + account + '</td>';
            html += '<td>' + Math.round(consumption/1000).toFixed(3).replace('.', ',') + ' kWh</td>';
            html += '<td>' + Math.round(generation/1000).toFixed(3).replace('.', ',') + ' kWh</td>';
            html += '<td>' + Math.round(co2emission/1000).toFixed(3).replace('.', ',') + ' kg</td>';
            html += '<td>' + Math.round(co2saving/1000).toFixed(3).replace('.', ',') + ' kg</td>';
            html += '</tr>';
            return html;
        }
        const renderTable = async function() {
            let html = '';
            html += '<table class="table table-condensed">';
            html += '<thead>';
            html += '<tr><th>Tracker</th><th>Account</th><th>Verbrauch</th><th>Erzeugung</th><th>CO<sub>2</sub>-Emission</th><th>CO<sub>2</sub>-Einsparung</th></tr>';
            html += '</thead>';
            html += '<tbody>';
            html += await renderRow(window.wallet.address,'Meine Wallet');
            html += '</tbody>';
            html += '</table>';
            $('#walletTable').html(html);
        }
        renderTable();
    });
});