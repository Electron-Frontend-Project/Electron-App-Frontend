const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const playbutton = document.getElementById('readFileDD');

    playbutton.addEventListener('click', async () => {
       
        ipcRenderer.send('fetch-data-from-api');
    });
    // Listen for the API data response from the main process
    ipcRenderer.on('api-data-fetched', (event, data) => {
        // Process and use the data as needed
        console.log('Received data in renderer.js:', data);
      
        // Access specific values from the data
        const totnode = data.totnode;
        const It = data.It;
      
        // Use the values as needed
        console.log('totnode:', totnode);
        console.log('It:', It);

        const totalnode = document.getElementById('totnode');
        const it = document.getElementById('It');

        totalnode.textContent = "Total Node: " + totnode;
        it.textContent = "Current Iteration Number: " + It;
    });
});