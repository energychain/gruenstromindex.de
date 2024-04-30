if(window.localStorage.getItem("deviceKey")===null) {
    const wallet = ethers.Wallet.createRandom();
    window.localStorage.setItem("deviceKey",wallet.privateKey);
}
window.wallet = new ethers.Wallet(window.localStorage.getItem("deviceKey"));


$(document).ready(function() {
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



