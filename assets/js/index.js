let wallet;
const updateRates = function() {
    $.getJSON("https://api.corrently.io/v2.0/scope2/eventRates?account="+window.wallet.address,function(data) {
       
        let iat = 0;
        let rates = {};
        for(let i=0;i<data.length;i++) {
            rates[data[i].type] = data[i].rate;
            if(data[i].iat > iat ) iat = data[i].iat;
        }
        window.eventRates = rates;
        $('#rateAsk').html(Math.round(rates.ask));
        $('#rateBid').html(Math.round(rates.bid));
        let tradeInfo = 'Keine Handelsfreigabe vorhanden!';
        if(typeof rates.trade !== "undefined") {
            tradeInfo = '';
        }
        $('#rateUpdateTime').html(new Date(iat * 1000).toLocaleString()+" - "+tradeInfo);
       
     });
}
const withWallet = function(fn) {
    setInterval(updateRates,900000);
    updateRates();
    var qrcode = new QRCode(document.getElementById("profileQR"), {
        text: window.wallet.address,
        width: 400,
        height: 400,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      $('img').addClass('img-fluid');
      $('canvas').addClass('img-fluid');
      $('#showAddress').val(window.wallet.address);
      if(location.protocol == "http:") { 
        console.log("No socket support");
        window.ipcsocket = null;
            return;
     } else {
        let signal_server = "https://signal.corrently.cloud";
        const socket = io(signal_server);
        socket.on(''+window.wallet.address, (message) => {
          try {
              message = JSON.parse(message);
          } catch(e) {}  
          if(message.type == "sharedTracker") {
              $('#modalManaged').modal('show');
              $('#managedTrackerId').val(message.delegationId);
              $('#modalTracker').modal('hide');
          }
          console.log('Push:', message);
        });
        window.ipcsocket = socket;
     }
}

const fallbackBrowserWallet = function() {
    if(window.localStorage.getItem("deviceKey")===null) {
        // If no Web3 provider is available, create a random wallet
        wallet = ethers.Wallet.createRandom();
        window.localStorage.setItem("deviceKey",wallet.privateKey);
    }
    if (!wallet) {
        console.log("Fallback to insecure Browser Wallet");
        window.provider = new ethers.providers.JsonRpcProvider("https://rpc.stromkonto.net/");
        wallet = new ethers.Wallet(window.localStorage.getItem("deviceKey"), window.provider);
    }
    window.wallet = wallet;
    withWallet();
}
// Check if window.ethereum is available (MetaMask or other Web3 provider)
if (window.ethereum) {
    // Request account access
    window.ethereum.request({ method: 'eth_requestAccounts' })
    .then(async result =>  {
        account = result[0];

        // Create a provider using the Web3 provider from MetaMask
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        window.provider = provider;
        try {
            await window.ethereum // Or window.ethereum if you don't support EIP-6963.
              .request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x141FD98" }],
              });
          } catch (switchError) {
            console.log("Switch Error",switchError);
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
              try {
                await window.ethereum // Or window.ethereum if you don't support EIP-6963.
                  .request({
                    method: "wallet_addEthereumChain",
                    params: [
                      {
                        chainId: "0x141FD98",
                        chainName: "Corrently",
                        rpcUrls: ["https://rpc.stromkonto.net/"],
                        nativeCurrency: {
                            decimals: 18,                        
                            name: "Corrently GrünstromNachweis",
                            symbol: "CORI"
                        }
                      },
                    ],
                  });
              } catch (addError) {
                console.log("addError",addError);
                // Handle "add" error.
              }
            }
            console.log("Other Error");
            // Handle other "switch" errors.
          }
        // Get the signer (MetaMask account)
        const signer = await provider.getSigner();
        window.wallet = signer;
        // Get the address of the signer (MetaMask account)
        signer.getAddress().then((address) => {
            window.wallet.address = address;
            withWallet();
        });
    })
    .catch(error => {
        console.error(error);
        fallbackBrowserWallet();
    });
}  else fallbackBrowserWallet();

$(document).ready(function() {
    $('#doWallet').on('change',function() {
        if($('#doWallet').is(':checked')) {
            $('.withWallet').show();
            window.localStorage.setItem("doWallet","true");
        } else {
            $('.withWallet').hide();
            window.localStorage.setItem("doWallet","false");
        }
    });
    if(window.localStorage.getItem("doWallet") == "true") {
        $('.withWallet').show();
        $('#doWallet').attr('checked','checked');
    } else {
        $('.withWallet').hide();
    }


    $('#openProfile').on('click',function() {
        $('#modalProfile').modal('show');
    });
    function getUrlParameter(paramName) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(paramName);
      }

    const addOrt = function(zip) {
        let orte = [];
        if(window.localStorage.getItem("orte") !== null) {
            try {
                    orte = JSON.parse(window.localStorage.getItem("orte"));
                    
            } catch(e) {}
        }
        if(orte.length == 0) {
            $('#n1ort').show();
        }
        let found = false;
        for(let i=0;i<orte.length;i++) {
            if(""+orte[i] == ""+zip) found =true;
        }
        if(!found) {
            orte.push(""+zip);
        }
        window.localStorage.setItem("orte",JSON.stringify(orte));
        location.href = "?";
    }
    $('#gsiOrt').on('click',function() {
        $('#modalOrt').modal('show');
    });
    $('#addOrt').on('submit',function(e) {
        e.preventDefault();
        addOrt($('#postleitzahl').val());
    });
    if(getUrlParameter("q") !== null) {
        addOrt(""+getUrlParameter("q"));
    }
    document.body.addEventListener("click", function(event) {
        if (event.target.tagName === "A" && event.target.getAttribute("href").startsWith("#")) {
          event.preventDefault(); // Prevent default anchor link behavior
          const target = document.querySelector(event.target.getAttribute("href"));
          const navbarHeight = document.querySelector("nav").offsetHeight + 30; // Get navbar height
      
          const targetTop = target.offsetTop - navbarHeight; // Calculate target position adjusted for navbar
      
          window.scrollTo({
            top: targetTop,
            behavior: "smooth" // Smooth scrolling animation
          });
        }
      });
    $('#addGSIOrt').on('submit',function(e) {
        e.preventDefault();
        addOrt($('#gsiFrontAdd').val());
    })
    $('#gsiFrontAdd').on('input',function() {
        if( (""+$(this).val()).length == 5) {
            $.getJSON("https://api.corrently.io/v2.0/stromdao/strommix?zip="+$(this).val()+"&account="+window.wallet.address, function(data) {
                $('#previewOrt').val(data.cityname);
            })
        }  
    });
})



