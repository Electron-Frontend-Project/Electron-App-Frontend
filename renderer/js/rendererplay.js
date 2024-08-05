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

    stopButton.addEventListener('click', async () => {
        console.log("Clicked stop button..");
        ipcRenderer.send('stop-backend');
    });

    pauseButton.addEventListener('click', async () => {
        console.log("Clicked pause button..");
        ipcRenderer.send('pause-backend');
    });
});
