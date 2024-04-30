$(function() {
    $('#orteNav').append('<li class="nav-item text-center"><a class="nav-link" href="#gsiMap"><svg class="bi bi-map" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" style="color: #147a50;" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103M10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8zm-6-.8V1.11l-4 .8v12.98z"></path></svg><br/>Deutschland</a></li>');
    let hridx = 0;
    let isFullScreen = false;
    let markers = {};
    var map = new L.map('map',{ zoomControl: false }); // Using Leaflet library for example
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<span id="time"></span><span class="text-muted">&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors / Data: <a href="https://stromdao.de/">STROMDAO GmbH</a></span>'
        }).addTo(map);
    map.setView([51.0062186,10.5910947], 6); // Center on Germany (adjust as needed)


    const control = L.control.layers(null, null, { // Empty baselayers and overlays
        position: 'topright'
        });
          
    control.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'time');
    div.innerHTML = document.getElementById("time").outerHTML;
    div.style.backgroundColor = 'rgba(255,255,255,0.6)'; // Set background color
    div.style.padding = '5px'; // Add padding
    div.style.borderRadius = '3px'; // Add border radius
    div.style.color = '#000'; // Set text color
    div.style.fontSize = '14px'; // Adjust font size
    return div;
    };
          
    control.addTo(map);

          // Set position (right: 10px, top: 10px)
    control.setPosition('topright');

    window.resizeMap = () => {
    const mapContainer = map.getContainer();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    if (isFullScreen) {
            location.reload();
        } else {
            // Set map container to full size and position (fullscreen)
            mapContainer.style.height = `${windowHeight-80}px`;
            mapContainer.style.width = `${windowWidth}px`;
            mapContainer.style.position = 'absolute';
            mapContainer.style.left = '0';
            mapContainer.style.top = '0';
            $('section').hide();
            $('#gsiMap').show();
            $('.navbar').hide();
            map.invalidateSize(true); 

            // Hide other elements
        }
    }

    $('#swichMapFS').on('click',function() {
    window.resizeMap();
    $('#fsctrl').show();
    })

    $('#exitFS').on('click',function() {
        location.reload();
    });

  function updateMap(data_to_map,isfirst,idx) {

    hridx = idx;
    const now = new Date();
    now.setHours(now.getHours() + idx + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    $('#time').html(now.toLocaleString('de-DE').substring(0,16));
    if(typeof data_to_map === 'undefined') data_to_map = window.mapdata;
    window.mapdata = data_to_map;
    if(typeof data_to_map == 'undefined') return;

        data_to_map = data_to_map.sort((a,b) => a.gsi - b.gsi);
        for (var i = 0; i < data_to_map.length; i++) {
                var person = data_to_map[i];
               if(typeof person.lat != 'undefined' && typeof person.lng != 'undefined') {
                    if(new Date().getTime() - (person.time+3600000) < 0) {
                        function calculateStdDev(data) {
                
                            if (!Array.isArray(data)) {
                                throw new Error("Input data must be an array");
                            }
                            const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
                            const squaredDeviations = data.map(value => Math.pow(value - mean, 2));
                            const variance = squaredDeviations.reduce((acc, val) => acc + val, 0) / data.length;
                            return {stdev:Math.sqrt(variance),mean:mean,variance:variance};
                        }
                        const drawMarker = function(person) {
                            if(typeof person.gsix !== 'undefined')  {
                                const deriv = calculateStdDev(person.gsix);
                                let iconUrl = '/assets/img/yellow.png';
                                if(person.gsix[hridx] < deriv.mean - deriv.stdev) iconUrl = '/assets/img/black.png';
                                if(person.gsix[hridx] > deriv.mean + deriv.stdev) iconUrl = '/assets/img/green.png';
                                if(typeof markers[person.time + " "+person.zip] !== 'undefined') {
                                    map.removeLayer(markers[person.time + " "+person.zip]);
                                    delete markers[person.time + " "+person.zip];
                                }
                                markers[person.time + " "+person.zip] = L.marker([person.lng, person.lat],{ icon:L.icon({iconUrl: iconUrl, iconAnchor:   [30, 30]}),title:Math.round(person.gsix[hridx]) }).addTo(map);
                                markers[person.time + " "+person.zip].bindPopup(`<a href="?q=${person.zip}" style="text-decoration:none"><strong>+</strong> GrünstromOrt</a>`);
                                markers[person.time + " "+person.zip].on('popupopen', function() {
                                          if (window.hrMoveInterval) {
                                            clearInterval(window.hrMoveInterval); // Stop the interval if open
                                          }
                                });
                                markers[person.time + " "+person.zip].on('popupclose', function() {
                                      clearInterval(window.hrMoveInterval); 
                                     
                                        window.hrMoveInterval = setInterval(function() {
                                              hridx++;
                                              if(hridx > 48) hridx = 0;
                                              updateMap(window.mapdata,false,hridx);       
                                        }, 2000); 
                                      
                                    });
                              }
                        }
                        
                        let firstTo = i;
                        if(isfirst) firstTo = i * 10;
                        (function(markerData) {
                        setTimeout(function() {
                            drawMarker(markerData);
                        }, firstTo); 
                        })(person);
                    }        
                }
        }
  }

  $.getJSON("https://api.corrently.io/v2.0/gsi/live?t="+new Date().getTime(), function(data_to_map) {
    updateMap(data_to_map,true,hridx);
  });

  // Update map periodically (optional)
  setInterval(function() {
    $.getJSON("https://api.corrently.io/v2.0/gsi/live?t="+new Date().getTime(), function(data_to_map) {
      updateMap(data_to_map,false,hridx);
    });
  }, 30000); 
  window.hrMoveInterval = setInterval(function() {
      hridx++;
      if(hridx > 48) hridx = 0;
      updateMap(window.mapdata,false,hridx);       
  }, 2000); 


});