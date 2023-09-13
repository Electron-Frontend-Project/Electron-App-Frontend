const { ipcRenderer } = require('electron');

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

document.addEventListener('DOMContentLoaded', () => {
    const readFile = document.getElementById('readFileDD');
    readFile.addEventListener('click', async () => {
        const filePath = 'C:/Users/suuser/Desktop/PDTO4/topology/builtmesh/solidR2.msh'; // Replace with the actual file path
        ipcRenderer.send('read-file2', filePath);
    });
});

ipcRenderer.on('file-read-error2', (event, errorMessage) => {
    // Handle the file read error here in the renderer process
    console.error('File read error:', errorMessage);
});

ipcRenderer.on('file-not-found2', (event, errorMessage) => {
    // Handle the file not found error here in the renderer process
    console.error('File not found:', errorMessage);
});

ipcRenderer.on('file-data2', (event, data) => {
  // Handle the received data here in the renderer process
    const lines = data.split('\n');
    console.log(lines);
    // Create a scene, camera, and renderer
    const scene = new THREE.Scene();  
    scene.background = new THREE.Color( "#ffffff" );  

    
    
    // Get the container element by its class name
    const container = document.querySelector('.design-part');   
    // Create a camera with appropriate aspect ratio and size
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);  
    const renderer = new THREE.WebGLRenderer(); 
    // Set the renderer's size to match the container
    renderer.setSize(width, height);    
    // Append the renderer's canvas to the container
    container.appendChild(renderer.domElement); 
    // Create OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );


    
    
    // Add ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    // Add a directional light to the scene
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // White light, 50% intensity
    directionalLight.position.set(1, 1, 1); // Set the direction of the light
    scene.add(directionalLight);

    // sphere
    lines.forEach(line => {
        const values = line.split('\t'); // tab separated

        if (values.length === 3) {
            const x = parseFloat(values[0]);
            const y = parseFloat(values[1]);
            const z = parseFloat(values[2]);

            const radius = 0.03; // Kürelerin yarıçapı
            const widthSegments = 32; // Kürenin yüzey bölümleri
            const heightSegments = 32; // Kürenin yükseklik bölümleri

            const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
            const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            scene.add(sphere);
        }
    });

    camera.position.z = 5;

    const animate = () => {
        requestAnimationFrame(animate);
        controls.update(); // Update controls in the animation loop
        renderer.render(scene, camera);
        
    };

    animate();
});



















