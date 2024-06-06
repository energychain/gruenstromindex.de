$(document).ready(function() {
    async function encrypt(text, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            {name: 'PBKDF2'},
            false,
            ['deriveBits', 'deriveKey']
        );
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            key,
            {name: 'AES-GCM', length: 256},
            true,
            ['encrypt']
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            {name: 'AES-GCM', iv},
            keyMaterial,
            data
        );
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);
        return btoa(String.fromCharCode.apply(null, combined));
    }
    
    async function decrypt(encrypted, password) {
        const decoded = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            {name: 'PBKDF2'},
            false,
            ['deriveBits', 'deriveKey']
        );
        const salt = decoded.slice(0, 16);
        const iv = decoded.slice(16, 28);
        const data = decoded.slice(28);
        const keyMaterial = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            key,
            {name: 'AES-GCM', length: 256},
            true,
            ['decrypt']
        );
        const decrypted = await crypto.subtle.decrypt(
            {name: 'AES-GCM', iv},
            keyMaterial,
            data
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    $('#showKey').click(function() {
        $('#modalKey').modal('show');
     });
     $('.keyNav').off();
     $('.keyNav').on('click',function(e) {
        e.preventDefault();
        $('.keySection').hide();
        $('#'+$(this).attr("data")).show();
        $('#keyNavBtn').html($(this).html());
     });

     $('#createTransferCode').on('submit',async function(e) {
        e.preventDefault();
        const passphrase = $('#transfercode').val();
        const privateKey = window.localStorage.getItem('deviceKey');
        $('#transferKey').val(await encrypt(privateKey,passphrase));
        $('#transferKey').show();
        $('#cpExport').show();
        // transferQR
        $('#transferQR').html('<div id="transferImage"></div>');
        var qrcode = new QRCode(document.getElementById("transferImage"), {
            text: $('#transferKey').val(),
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
     });
     $('#readTransferCode').on('submit',async function(e) {
        e.preventDefault();
        $('#btnSubmitImport').attr('disabled','disabled');
        try {
            const privateKey = await decrypt($('#enteredTransferKey').val(),$('#transfercodeImp').val());
            window.localStorage.setItem('deviceKey',privateKey);
            window.location.reload();
        } catch(e) {
            $('#btnSubmitImport').removeClass('btn-dark');
            $('#btnSubmitImport').addClass('btn-danger');
            setTimeout(function() {
                $('#transfercodeImp').val("");
                $('#btnSubmitImport').removeClass('btn-danger');
                $('#btnSubmitImport').addClass('btn-dark');
                $('#btnSubmitImport').removeAttr('disabled');
            },2000);
        }
     });
     $('#cpExport').click(function() {
        const textarea = $('#transferKey');
        $('#cpExport').attr('disabled','disabled');
        navigator.clipboard.writeText(textarea.val()).then(function() {
            console.log('Text copied to clipboard');
            setTimeout(function() {
                    $('#cpExport').removeAttr('disabled');
            },5000);
        }, function() {
            console.error('Failed to copy text to clipboard');
        });
     });
     $('#readTransferCode').click(async function() {
        // Encoded data to be decrypted
        console.log(await decrypt($('#transferKey').val(),$('#transfercode').val()));

    });
    if (window.ethereum) {
            $('#showKey').hide();
    } else {
         $('#showKey').show();
    }

});