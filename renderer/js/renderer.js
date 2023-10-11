const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const rminInput = document.getElementById('rminInput');
    const volfracInput = document.getElementById('volFracInput');
    const dxInput = document.getElementById('dxInput');
    const lengthInput = document.getElementById('lengthInput');
    const widthInput = document.getElementById('widthInput');
    const thickInput = document.getElementById('thickInput');
     
    fetchButton.addEventListener('click', async () => {
        const rmin = parseFloat(rminInput.value);
        const dx = parseFloat(dxInput.value);
        const volfrac = parseFloat(volfracInput.value);
       // const maxfam = 200;   
       // const emod = 200e9;  
       // const pe = 3;        
        const length = parseFloat(lengthInput.value);
        const width = parseFloat(widthInput.value);
        const thick = parseFloat(thickInput.value);
        const ndivx = length/dx;
        const ndivy = width/dx;
        const ndivz = thick/dx;
        console.log('Rmin Value:', rmin);

        // Send all parameters to the main process using IPC
        ipcRenderer.send('fetch-data', { rmin, dx, volfrac, length, width, thick, ndivx, ndivy, ndivz});
        ipcRenderer.send('send-dxD', {dx});
        ipcRenderer.send('send-dxO', {dx});
    });
});

