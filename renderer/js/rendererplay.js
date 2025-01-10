const path = require('path');
const { ipcRenderer } = require('electron');
//const jardir = 'C:/Users/suuser/Desktop/PDTO-GitHub/PDTO-Project/pdtopolys/fea/target/';
//const jardir = "C:/Users/suuser/Desktop/Electron-Github/Electron-App-Frontend/";
const jardir = path.resolve(__dirname, '../');

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    const pauseButton = document.getElementById('pause-button');

    playButton.addEventListener('click', async () => {
        console.log("Clicked play button..");
        ipcRenderer.send('start-backend', jardir);
    });
        
    ipcRenderer.on('jar-path', (event, jarPath) => {
        console.log(`Received JAR path: ${jarPath}`);
    });

    // Listen to the stdout data from the backend and run it to the console
    ipcRenderer.on('backend-output', (event, data) => {
        console.log(`Backend Output: ${data}`);
    });

    // Listen to the stderr data from the backend and run it to the console
    ipcRenderer.on('backend-error', (event, data) => {
        console.error(`Backend Error: ${data}`);
    });

    // Listen to the process shutdown event and run it to the console
    ipcRenderer.on('backend-close', (event, data) => {
        console.log(data);
    });

    stopButton.addEventListener('click', async () => {
        console.log("Clicked stop button..");
        ipcRenderer.send('stop-backend');
    });

    pauseButton.addEventListener('click', async () => {
        console.log("Clicked pause button..");
        ipcRenderer.send('pause-backend');
    });
});
