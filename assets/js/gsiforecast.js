$(document).ready(function() {
    function renderGSI(zip) {
        let html = '';
        html += '<div style="margin-bottom:50px;margin-top:10px;"><div class="card" id="card'+zip+'">'
        html += '<div class="card-body" style="background: var(--bs-card-cap-bg);">';
        html += '<h4 class="card-title">';
        html += '<span style="color: #147a50;">Grünstrom</span><span style="color: #e6b41e;" id="city'+zip+'">Ort</span>';
        html += '<button class="btn btn-light dispatchBtn" style="padding-top:0" data="'+zip+'" type="button" id="dispatchBtn'+zip+'">'
        html += '<svg class="bi bi-info-circle" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">';
        html += '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path>';
        html += '<path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"></path>';
        html += '</svg>';
        html += '</button>';
        html += '<button class="btn btn-light float-end" type="button" id="removeBtn'+zip+'" style="margin-top: -5px;"><svg class="bi bi-trash3" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path></svg></button></h4>';
        html += '<div><canvas id="chart'+zip+'"></canvas></div>';
        html += '</div>';
        html += '</div></div>';
        $('#card'+zip).remove();
        $('#gruenstromOrt').append($(html));
        $('#removeBtn'+zip).off();
        $('#removeBtn'+zip).on('click',function() {
            let orte = [];
            if(window.localStorage.getItem("orte") !== null) {
                try {
                        orte = JSON.parse(window.localStorage.getItem("orte"));
                } catch(e) {}
            }
            let norte = [];
            for(let i=0;i<orte.length;i++) {
                if(orte[i] !== zip) norte.push(orte[i]);
            }
            window.localStorage.setItem("orte",JSON.stringify(norte));
            location.reload();
        });
        $('#dispatchBtn'+zip).off();
        $('#dispatchBtn'+zip).on('click',function(e) {
          $('#dispatchBtn'+zip).attr('disabled', 'disabled');
          $('#modalDispatch').modal('show');
          $('#dispatchBody').html('');
          $('#dispatchTitle').html('wird geladen...');
          $.getJSON("https://api.corrently.io/v2.0/gsi/dispatch?zip="+zip+"&account="+window.wallet.address,function(data) {
            let html = '<h4>Energiequellen</h4>';
            html += '<table class="table table-condensed">';
            let sources = [];
            for (let [key, value] of Object.entries(data.postmix)) {
              if(key == "Kl�rgas") key = "Klärgas";
              sources.push({
                label:key,
                value:value * 1
              })
            }
            sources.sort((a,b) => b.value - a.value);

            for (let i=0;(i<sources.length && i<5);i++) {
              value = (sources[i].value*100).toFixed(1).replace('.',',') + "%";
              html += '<tr><td>'+sources[i].label+'</td><td align="right">'+value+'</td></tr>';
            }
            html += '</table>';
            html += '<h4>Herkunftsorte</h4>';
            
            html += '<table class="table table-condensed">';
            for (let i=0;(i<data.dispatch_from.length && i<5);i++) {
                html += '<tr><td>'+data.dispatch_from[i].location.prettyLabel+'</td><td align="right">'+(data.dispatch_from[i].energy*100).toFixed(1).replace('.',',')+'%</td></tr>';
            }
            html += '</table>';
            html += '<p class="text-muted">Zeitraum: '+new Date(data.timeframe.start).toLocaleDateString()+' - '+new Date(data.timeframe.end).toLocaleDateString()+' - Entfernung: ~'+data.avg_distance_km.toFixed(1).replace('.',',')+' km</p>'
            $('#dispatchBody').html(html);
            $('#dispatchTitle').html('<span style="color: #147a50;">Grünstrom</span><span style="color: #e6b41e;" id="city69256">Mix</span> - Top 5 - '+data.center.city);

            $('#dispatchBtn'+zip).removeAttr('disabled');
          });         
        })
        $.getJSON("https://api.corrently.io/v2.0/gsi/prediction?zip="+zip+"&account="+window.wallet.address,function(data) {
            let points = [];
            let now = new Date().getTime();
            let firstStamp = -1;
            for(let i=0;i<data.forecast.length && points.length< 48;i++) {
                if(data.forecast[i].timeStamp> now) {
                  if(firstStamp=-1) firstStamp = i;
                    points.push( {
                            x:new Date(data.forecast[i].timeStamp).toLocaleString("de-DE"),
                            y:Math.round(data.forecast[i].gsi),
                            t:data.forecast[i].timeStamp,
                            backgroundColor:"#ff0000"
                    }); 
                }
            }
            if(firstStamp !== -1) {
              const gsiEvent = new CustomEvent('mqtt-publish', {detail:JSON.stringify({ topic: "gsi/"+zip, message: ""+data.forecast[firstStamp].gsi})});
              document.dispatchEvent(gsiEvent);
              const co2Event = new CustomEvent('mqtt-publish', {detail:JSON.stringify({ topic: "co2/"+zip, message: ""+data.forecast[firstStamp].co2_g_standard})});
              document.dispatchEvent(co2Event);
            }
            $('#city'+zip).html(data.location.city);
            $('#orteNav').append('<li class="nav-item text-center"><a class="nav-link" href="#card'+zip+'"><svg class="bi bi-pin-map" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" style="color: #147a50;" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z"></path><path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"></path></svg><br/>'+data.location.city+'</a></li>');
            points.sort((a,b) => a.y - b.y);
            for(let i=0;i<points.length;i++) {
                let bgcolor = "#909090";
                if(i > points.length/3) bgcolor = "#e6b41e";
                if(i > points.length*(2/3))  bgcolor = "#147a50";
                points[i].backgroundColor = bgcolor;
            }
            points.sort((a,b) => a.t - b.t);
            for(let i=0;i<points.length;i++) {
                if((i % 6 !== 0)&&(i!==0)) {
                    points[i].x = "";
                }
            }
            
            const ctx = document.getElementById('chart'+zip).getContext('2d');
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: points.map(item => item.x),
                datasets: [{
                  label: 'GrünstromIndex',
                  data: points.map(item => item.y),
                  backgroundColor: points.map(item => item.backgroundColor),
                  borderColor: '#000',  // Optional: Set border color for bars
                  borderWidth: 1       // Optional: Set border width for bars
                }]
              },
              options: {
                scales: {
                  yAxes: [{
                    ticks: {
                      beginAtZero: true
                    }
                  }]
                },
                onClick: function(e, elements) {
                  if(typeof elements[0] !== 'undefined') {
                    const clickedIndex = elements[0].index;
                    $('#switchTime').val(new Date(points[clickedIndex].t).toLocaleString("de-DE"));
                    $('#switchName').val('');
                    $('#switchTime').attr('data',points[clickedIndex].t);
                    $('.submitSwitch').removeAttr('disabled');
                    $('#modalSwitch').modal('show');
                  }
                },
                plugins: {
                    legend: {
                      display: false // Set display to false to hide the legend
                    }
                }
              }
            });
        });
    }
    let orte = window.localStorage.getItem("orte");
    let initialized = false;
    if((typeof orte !== 'undefined') && (orte !== null)) {
        try {
            orte = JSON.parse(orte);
            for(let i=0;i<orte.length;i++) {
                renderGSI(orte[i]); 
            }       
            initialized = true;  
        } catch(e) {console.log(e);}
    } 
    if(!initialized) {
      $('#n1ort').show();
    }
});