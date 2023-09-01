const { ipcRenderer } = require('electron');


document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const rminInput = document.getElementById('rminInput');

    fetchButton.addEventListener('click', async () => {
        const rmin = parseFloat(rminInput.value);
        console.log('Rmin Value:', rmin);

        // Send all parameters to the main process using IPC
    ipcRenderer.send('fetch-data', { rmin});
    });
});

