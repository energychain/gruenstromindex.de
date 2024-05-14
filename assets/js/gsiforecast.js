$(document).ready(function() {
    function renderGSI(zip) {
      let account = "0x0";
      if(typeof window.wallet !== 'undefined') {
        account = window.wallet.address;
      }
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
          $.getJSON("https://api.corrently.io/v2.0/gsi/dispatch?zip="+zip+"&account="+account,function(data) {
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
        $.getJSON("https://api.corrently.io/v2.0/gsi/prediction?zip="+zip+"&account="+account,function(data) {
            let points = [];
            let now = new Date().getTime();
            let firstStamp = -1;
            for(let i=0;i<data.forecast.length && points.length< 48;i++) {
                if(data.forecast[i].timeStamp> now) {
                  if(firstStamp=-1) firstStamp = i;
                    points.push( {
                          //  x:new Date(data.forecast[i].timeStamp).toLocaleString("de-DE"),
                          x:data.forecast[i].timeStamp,
                          y:Math.round(data.forecast[i].gsi),
                          t:new Date(data.forecast[i].timeStamp),
                          time:data.forecast[i].timeStamp * 1,
                          emission:data.forecast[i].co2_g_standard,
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
                let reco = "Stromnutzung schlecht";
                if(i > points.length/3) { bgcolor = "#e6b41e"; reco="Stromnutzung mittel"; }
                if(i > points.length*(2/3))  { bgcolor = "#147a50"; reco="Stromnutzung gut"; }
                points[i].backgroundColor = bgcolor;
                points[i].reco = reco;
            }
            points.sort((a,b) => a.t - b.t);

            const getOrCreateTooltip = (chart) => {
              let tooltipEl = chart.canvas.parentNode.querySelector('div');
            
              if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
                tooltipEl.style.borderRadius = '3px';
                tooltipEl.style.color = 'white';
                tooltipEl.style.opacity = 1;
                tooltipEl.style.pointerEvents = 'none';
                tooltipEl.style.position = 'absolute';
                tooltipEl.style.transform = 'translate(-50%, 0)';
                tooltipEl.style.transition = 'all .1s ease';
                tooltipEl.style.minWidth = '300px'; 
            
                const table = document.createElement('table');
                table.style.margin = '0px';
            
                tooltipEl.appendChild(table);
                chart.canvas.parentNode.appendChild(tooltipEl);
              }
            
              return tooltipEl;
            };
            
            const externalTooltipHandler = (context) => {
              // Tooltip Element
              const {chart, tooltip} = context;
              const tooltipEl = getOrCreateTooltip(chart);
            
              // Hide if no tooltip
              if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
              }
            
              // Set Text
              if (tooltip.body) {
                const titleLines = [tooltip.title + ": "+points[tooltip.dataPoints[0].dataIndex].reco] || [];
                const bodyLines = tooltip.body.map(b => b.lines);
                const tableHead = document.createElement('thead');
            
                titleLines.forEach(title => {
                  const colors = tooltip.labelColors[0];
                  const span = document.createElement('span');
                  span.style.background = colors.backgroundColor;
                  span.style.borderColor = colors.borderColor;
                  span.style.borderWidth = '2px';
                  span.style.marginRight = '10px';
                  span.style.height = '10px';
                  span.style.width = '10px';
                  span.style.display = 'inline-block';

                  const tr = document.createElement('tr');
                  tr.style.borderWidth = 0;
            
                  const th = document.createElement('th');
                  th.style.borderWidth = 0;
                  const text = document.createTextNode(title);
                  th.appendChild(span);
                  th.appendChild(text);
                  tr.appendChild(th);
                  tr.appendChild(document.createElement('th'));
                  tableHead.appendChild(tr);
                });
            
                const tableBody = document.createElement('tbody');
                bodyLines.forEach((body, i) => {
                  const colors = tooltip.labelColors[i];

                  const tr = document.createElement('tr');
                  tr.style.backgroundColor = 'inherit';
                  tr.style.borderWidth = 0;
            
                  const td = document.createElement('td');
                  td.style.borderWidth = 0;
                  const text = document.createTextNode("GrünstromIndex");
                  
                  td.appendChild(text);
                  tr.appendChild(td);
                  const td_gsivalue = document.createElement('td');
                  td_gsivalue.appendChild(document.createTextNode(points[tooltip.dataPoints[0].dataIndex].y));
                  tr.appendChild(td_gsivalue);

//                  td.appendChild(document.createElement('br'));
                 
  //                td.appendChild(document.createTextNode("CO2: "+points[tooltip.dataPoints[0].dataIndex].emission+"g/kWh"));
    //              tr.appendChild(td);
                  tableBody.appendChild(tr);
                  const trco2 = document.createElement('tr');
                  trco2.style.backgroundColor = 'inherit';
                  trco2.style.borderWidth = 0;
                  const tdco2 = document.createElement('td');
                  tdco2.style.borderWidth = 0;
                  const textco2 = document.createTextNode("CO2 Emission");
                  tdco2.appendChild(textco2);
                  trco2.appendChild(tdco2);
                  const tdco2value = document.createElement('td');
                  tdco2value.appendChild(document.createTextNode(points[tooltip.dataPoints[0].dataIndex].emission+"g/kWh"));
                  trco2.appendChild(tdco2value);
                  tableBody.appendChild(trco2);
                });
            
                const tableRoot = tooltipEl.querySelector('table');
            
                // Remove old children
                while (tableRoot.firstChild) {
                  tableRoot.firstChild.remove();
                }
            
                // Add new children
                tableRoot.appendChild(tableHead);
                tableRoot.appendChild(tableBody);
              }
            
              const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;
            
              // Display, position, and set styles for font
              tooltipEl.style.opacity = 1;
              tooltipEl.style.left = positionX + tooltip.caretX + 'px';
              tooltipEl.style.top = positionY + tooltip.caretY + 'px';
              tooltipEl.style.font = tooltip.options.bodyFont.string;
              tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
            };

            const ctx = document.getElementById('chart'+zip).getContext('2d');
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: points.map(item => item.x),
                datasets: [{
                  label: 'GrünstromIndex',
                  data: points.map(item => item.y),
                  backgroundColor: points.map(item => item.backgroundColor),
                  borderColor: '#000',  
                  borderWidth: 1,
                  fill: true,
                }]
              },
              options: {
               responsive: true,
                scales: {
                  y: {
                    min:0,
                    max:100
                  },
                  x: {
                    type:"time",
                    parser: function(utcMoment) {
                      return moment(utcMoment, 'x'); // parse input as moment object
                    },
                    time: {
                      tooltipFormat: 'DD.MM HH:mm',
                      unit: 'hour',
                     displayFormats: {
                        hour: 'ddd HH:mm' // display format for hour unit
                      },
                    },
                  
                    ticks: {
                      callback: function(value, index, values) {
                        const momentValue = moment(values[index].value);
                        return momentValue.format('ddd HH:mm'); // return desired format
                      }
                    },
                    min: points[0].x,
                    max: points[0].x + Math.round((points[points.length-1].x - points[0].x)/4),
                  }
                },
                
                onClick: function(e, elements) {
                  if(typeof elements[0] !== 'undefined') {
                    const clickedIndex = elements[0].index;
                    $('#switchTime').val(new Date(points[clickedIndex].time).toLocaleString("de-DE"));
                    $('#switchName').val('');
                    $('#switchTime').attr('data',points[clickedIndex].time);
                    $('.submitSwitch').removeAttr('disabled');
                    $('.withWallet').show();
                    window.localStorage.setItem("doWallet","true");
                    $('#modalSwitch').modal('show');
                  }
                }, 
                
                plugins: {
                  tooltip: {
                    enabled:false,
                    intersect: false,
                    mode: 'index',
                    external: externalTooltipHandler
                    /*
                    callbacks: {
                      title: function(context) {
                       
                        // This function returns the title of the tooltip, which can be empty if you don't want a title
                        return points[context[0].dataIndex].reco;
                      },
                      label: function(context) {
                        // This function returns the content of the tooltip
                        var dataset = context.dataset;
                        var index = context.dataIndex;
                        var value = dataset.data[index];
                        return 'GrünstromIndex: ' + value + '\n <br> SomeText, Emission: ' + value;
                      }
                    }
                    */
                  },
                  legend: {
                    display: false // Set display to false to hide the legend
                  },
                  zoom: {
                      pan: {
                        enabled: true,
                        mode: 'x',
                        min:points[0].x
                      },
                      zoom: {
                        wheel: {
                          enabled: false,
                        },
                        pinch: {
                          enabled: false
                        },
                          mode: 'x',
                        }
                    }
                  }
              }
            });
            window.fcchart = chart;
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