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
        const length = parseFloat(lengthInput.value);
        const width = parseFloat(widthInput.value);
        const thick = parseFloat(thickInput.value);
        const ndivx = length/dx;
        const ndivy = width/dx;
        const ndivz = thick/dx;
        console.log('Rmin Value:', rmin);
        // Send all parameters to the main process using IPC
        ipcRenderer.send('fetch-data', { rmin, dx, volfrac, length, width, thick, ndivx, ndivy, ndivz});
        ipcRenderer.send('send-dxD', {dx, length, width});  // send datas to rendererD
        ipcRenderer.send('send-dxO', {dx});  // send datas to rendererO
        ipcRenderer.send('send-dxFileD', {dx});  // send data to rendererFileD
        ipcRenderer.send('send-dxFileO', {dx});  // send data to rendererFileO

    });
});

