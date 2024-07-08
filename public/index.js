document.getElementById('upload-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const image = document.getElementById('image').files[0];
    const formData = new FormData();
    formData.append('image', image);
    try {
        const response = await fetch('http://localhost:8080/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('encryption-message').innerText = `File encrypted successfully. Download link: ${result.encryptedImagePath}`;
            document.getElementById('encryption-key').innerText = `Encryption Key: ${result.encryptionKey}`;
            sessionStorage.setItem('encryptedImagePath', result.encryptedImagePath);
            sessionStorage.setItem('encryptionKey', result.encryptionKey); // Store the encryption key
            sessionStorage.setItem('iv', result.iv); // Store the IV
        } else {
            document.getElementById('encryption-message').innerText = `Error: ${result.error}`;
        }
    } catch (error) {
        document.getElementById('encryption-message').innerText = `Error: ${error.message}`;
    }
  });
  
  document.getElementById('decrypt-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const key = document.getElementById('decrypt-key').value || sessionStorage.getItem('encryptionKey'); // Retrieve the encryption key from storage if not provided
    const iv = sessionStorage.getItem('iv'); // Retrieve the IV from storage
    const encryptedImagePath = sessionStorage.getItem('encryptedImagePath');
    try {
        const response = await fetch('http://localhost:8080/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ encryptedImagePath, key, iv })
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('decryption-message').innerText = `File decrypted successfully. Download link: ${result.decryptedImagePath}`;
        } else {
            document.getElementById('decryption-message').innerText = `Error: ${result.error}`;
        }
    } catch (error) {
        document.getElementById('decryption-message').innerText = `Error: ${error.message}`;
    }
  });
  