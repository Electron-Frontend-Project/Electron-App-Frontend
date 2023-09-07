const { ipcRenderer } = require('electron');


document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const rminInput = document.getElementById('rminInput');
    const volfracInput = document.getElementById('volFracInput');
     

    fetchButton.addEventListener('click', async () => {
        const rmin = parseFloat(rminInput.value);
        const dx = 1e-3;
        const volfrac = parseFloat(volfracInput.value);
        const maxfam = 200;
        const emod = 200e9;
        const pe = 3;
        const length = 1.2;
        const width = 0.6;
        const thick = 0.6;
        const ndivx = 20;
        const ndivy = 10;
        const ndivz = 10;
        console.log('Rmin Value:', rmin);

        // Send all parameters to the main process using IPC
    ipcRenderer.send('fetch-data', { rmin, dx, volfrac, maxfam, emod, pe, length, width, thick, ndivx, ndivy, ndivz});
    });
});

