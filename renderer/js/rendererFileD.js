const { ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
import { SelectionBox } from "./SelectionBox.js";
import { SelectionHelper } from "./SelectionHelper.js";

let flag = false, scene, scene2, renderer, renderer2, container, container2, width, width2, height, height2, CAM_DISTANCE, camera, camera2,
controls, controls2, axesHelper, spheres, facesPlanes, fixedObjectGroup, ambientLight, directionalLight, radius, widthSegments,
heightSegments, geometry, defaultMaterial, currentAxis, x, y, z, strain, designvar, dispx, dispy, dispz, sphere, selectedMeshes, 
isOrbitControlEnabled, selectionBox, helper, designPart, raycaster, dx, dx2
;
var INTERSECTED;
const selectedSphereIDs = [];
const removedSphereIDs = [];
let selectedFilePath = null;
var i=0;

document.addEventListener('DOMContentLoaded', () => {
    const sendFileButton = document.getElementById('sendFileButton');
    // click button
    sendFileButton.addEventListener('click', (event) => {
        // ask file path from main
        console.log("clicked1")
        ipcRenderer.send('request-file-path');
    });

    ipcRenderer.on('response-file-path', (event, filePath) => {
        console.log("Selected file: ", filePath);
        selectedFilePath = filePath;
    });

  /*  dx formula !!!!

    xx = coord[1][0] - coord[0][0],
    yy = coord[1][1] - coord[0][1],
    zz = coord[1][2] - coord[0][2];
    
    dx = Math.sqrt(xx*xx + yy*yy + zz*zz);
*/

    const readSelectedFile = document.getElementById('readSelectedFileD');
    const designPart = document.getElementById('scene-container1');
    const topologyPart = document.getElementById('scene-container2');
    const mainPart = document.getElementById('main-part');
    let isDesignPartOpen = false;
    readSelectedFile.addEventListener('click', async () => {
        if (isDesignPartOpen) {
            designPart.style.width = '50%';
            topologyPart.style.width = '50%';
            mainPart.style.flexDirection = 'row';
            isDesignPartOpen = false;
        } else {
            designPart.style.width = '100%';
            topologyPart.style.width = '0%';
            mainPart.style.flexDirection = 'column';
            isDesignPartOpen = true;
        }
        
        ipcRenderer.send('read-selected-file1', selectedFilePath)
    });
});

// to get dx form user
ipcRenderer.on('get-dxFileD', (event, data) => {    
    ({ dx: dx } = data);
    console.log("dx2 from rendererFileD ", dx );
});


ipcRenderer.on('selected-file-read-error1', (event, errorMessage) => {
    // Handle the file read error here in the renderer process
    console.error('File read error:', errorMessage);
});

ipcRenderer.on('selected-file-not-found1', (event, errorMessage) => {
    // Handle the file not found error here in the renderer process
    console.error('File not found:', errorMessage);
});

// to get selected sphere IDs (orange)
ipcRenderer.on('selected-spheres', (event, selectedMeshID) => {
    console.log('Received selectedMeshID in main process:', selectedMeshID); // Debugging log
    selectedSphereIDs.push(selectedMeshID);
});

// to get removed sphere IDs
ipcRenderer.on('removed-spheres', (event, removedID) => {
    console.log('Received removedID in main process:', removedID); // Debugging log
    removedSphereIDs.push(removedID);
    const index = selectedSphereIDs.indexOf(removedID);
    if (index !== -1) {
        selectedSphereIDs.splice(index, 1); // Remove ID from the array
        console.log(`Removed ID from removedID: ${removedID}`);
    }
    
    // rechange color of removed spheres
    spheres.forEach(sphere => {
        if (sphere.designvar === removedID) {
            // change color to green
            sphere.material.emissive.set(sphere.currentHex);
            
            // do not display infoBox
            document.getElementById("info-box1").style.display='none';
            // update INTERSECTED 
            if (INTERSECTED === sphere) {
                INTERSECTED = null;
            }
        }
    });
});


ipcRenderer.on('selected-file-data1', (event, data) => {
    // Handle the received data here in the renderer process
    const lines = data.split('\n');
    console.log("toplam: ", lines.length)
    if (lines.length >= 2) {
        console.log("First line: ", lines[0]);
        console.log("Second line: ", lines[1]);
        
        // take x,y,z coords from first line (skip the first element which is id)
        const coord1 = lines[0]
        .trim()
        .split('\t')
        .slice(1, 4) // Skip the first element (id) and take the next three (x, y, z)
        .map(val => parseFloat(val.trim())); // remove empty spaces

    // take x,y,z coords from second line (skip the first element which is id)
    const coord2 = lines[1]
        .trim()
        .split('\t')
        .slice(1, 4) // Skip the first element (id) and take the next three (x, y, z)
        .map(val => parseFloat(val.trim())); // remove empty spaces

    console.log("Parsed coord1: ", coord1);
    console.log("Parsed coord2: ", coord2);


    // check whether coords are read correctly
    if (coord1.every(val => !isNaN(val)) && coord2.every(val => !isNaN(val))) {
        // find dx 
        const xx = coord2[0] - coord1[0];
        const yy = coord2[1] - coord1[1];
        const zz = coord2[2] - coord1[2];
        dx2 = Math.sqrt(xx * xx + yy * yy + zz * zz);
        // Round dx to one decimal place
        dx2 = parseFloat(dx2.toFixed(1));

        console.log(`dx2: ${dx2}`);
        
    } else {
        console.error('Coordinates are missing or incorrect.');
    }
} else {
    console.error('Not enough lines found.');
}    
    if (dx2) {
        console.log('dx2:', dx2);
      
    }
    // Compare the two dx values
    if (dx !== dx2) {
        alert(`The calculated dx2 value (${dx2}) is different from the user-entered dx value (${dx}).`);
    } else {
        alert("The calculated dx value is the same as the user-entered dx2 value.");
    }

    if (flag) {
        disposeScene();
        flag = false;
    } else {
        initScene(lines);
        flag = true;
    }
});

// **Remove old scenes and models, spheres**
function disposeScene() {
    // Remove old scenes
    scene.remove(...scene.children);
    scene2.remove(...scene2.children);
    
    // Dispose of the renderers if they exist
    if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
    }
    
    if (renderer2) {
        renderer2.dispose();
        if (container2.contains(renderer2.domElement)) {
            container2.removeChild(renderer2.domElement);
        }
    }

    controls.dispose();
    controls2.dispose();
    
    // Dispose of spheres
    spheres.forEach(sphere => {
        sphere.geometry.dispose();
        sphere.material.dispose();
    });
    spheres = []; 

    // Dispose of selection box and helper if they exist
    if (selectionBox && selectionBox.dispose) {
        selectionBox.dispose();
    }
    if (helper && helper.dispose) {
        helper.dispose();
    }
}

function initScene(lines) {
    // Create a scene, camera, and renderer
    scene = new THREE.Scene();  
    scene2 = new THREE.Scene();
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0); // z axis 
    scene.background = new THREE.Color( "#ffffff" );    
    scene2.background = new THREE.Color( "#ffffff" );    
    // Get the container element by its class name
    container = document.querySelector('.design-part');   
    container2 = document.querySelector('.corner-boxD');
    
    // Create a camera with appropriate aspect ratio and size
    width = container.clientWidth;
    height = container.clientHeight;
    width2 = container2.clientWidth;
    height2 = container2.clientHeight;
    CAM_DISTANCE = 10;
    camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        0.1,
        50
    );	
  
    camera.zoom = 15 + dx;  
    camera2 = new THREE.OrthographicCamera(
        width2 / -2,
        width2 / 2,
        height2 / 2,
        height2 / -2,
        0.1,
        50
    ); 
    camera2.zoom = 10 + dx;
    camera2.updateProjectionMatrix();
    renderer = new THREE.WebGLRenderer(); 
    renderer2 = new THREE.WebGLRenderer(); 
    // Set the renderer's size to match the container
    renderer.setSize(width, height);   
    renderer2.setSize(width2, height2); 
    // Append the renderer's canvas to the container
    container.appendChild(renderer.domElement); 
    container2.appendChild(renderer2.domElement);
    // Create OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls2 = new OrbitControls(camera2, renderer2.domElement);

    axesHelper = new THREE.AxesHelper( 5 );
    scene2.add( axesHelper );
    // group of spheres to clickable
    spheres = [];
    facesPlanes = [];
    currentAxis = 'none';
    // fixed object group
    fixedObjectGroup = new THREE.Group();
    scene.add(fixedObjectGroup);
    // Add ambient light to the scene
    ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);
    // Add a directional light to the scene
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // White light, 50% intensity
    directionalLight.position.set(10, 10, 10); // Set the direction of the light
    scene.add(directionalLight);
    radius = dx/2; // Radius of spheres
    widthSegments = 32; // Surface parts of the sphere
    heightSegments = 32; // Height divisions of the sphere
    geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    defaultMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    // SPHERE
    lines.forEach(line => {
        const values = line.split('\t'); // tab separated
        if (values.length === 4) {
            x = parseFloat(values[1]);
            y = parseFloat(values[2]);
            z = parseFloat(values[3]);
            strain = 0;
            designvar = values[0]; // ID
           
            dispx = 0;
            dispy = 0;
            dispz = 0;        
            sphere = new THREE.Mesh(geometry, defaultMaterial.clone());        
            switch (currentAxis) {
                case 'x':
                    sphere.position.set(x, 0, 0);
                    break;
                case 'y':
                    sphere.position.set(0, y, 0);
                    break;
                case 'z':
                    sphere.position.set(0, 0, z);
                    break;
                default:
                    sphere.position.set(x, y, z);
                    break;
            }          
        
            scene.add(sphere); 
            sphere.designvar = designvar;
            sphere.displacement = dispx + " " + dispy + " " + dispz;
            sphere.strain = strain;
            spheres.push(sphere);     
        }        
    });
    
    // Pick/Add area for Force and BC
    class SelectionManager {
        constructor(camera, scene, renderer, buttonId, clearButtonId, listId, defaultColor, selectedColor) {
            this.camera = camera;
            this.scene = scene;
            this.renderer = renderer;
            this.selectionBox = new SelectionBox(camera, scene);
            this.helper = new SelectionHelper(renderer, 'sel_box');
            this.designPart = document.querySelector('.design-part');
            this.selectedMeshes = [];
            this.isOrbitControlEnabled = true;
            this.defaultColor = defaultColor;
            this.selectedColor = selectedColor;    
            this.initButton(buttonId);
            this.initClearButton(clearButtonId);
            this.listId = listId;    
            this.addEventListeners();
        }
    
        initButton(buttonId) {
            const button = document.getElementById(buttonId);
            button.addEventListener('click', () => {
                this.toggleOrbitControl(button);
            });
        }
    
        initClearButton(clearButtonId) {
            document.getElementById(clearButtonId).addEventListener('click', () => {
                this.clearSelectedMeshes();
            });
        }
    
        toggleOrbitControl(button) {
            if (button.style.backgroundColor === 'rgb(0, 123, 255)' || button.style.backgroundColor === '') {
                button.style.backgroundColor = this.selectedColor;
            } else {
                button.style.backgroundColor = '';
            }
            this.isOrbitControlEnabled = !this.isOrbitControlEnabled;
            controls.enabled = this.isOrbitControlEnabled;
        }
    
        clearSelectedMeshes() {
            this.selectedMeshes.forEach((sphere) => {
                if (sphere.material) {
                    sphere.material.color.set(this.defaultColor);
                }
            });
            this.selectedMeshes = [];
            console.log("Selected meshes cleared:", this.selectedMeshes);
        }
    
        addEventListeners() {
            document.addEventListener('pointerdown', (event) => this.onPointerDown(event));
            document.addEventListener('pointermove', (event) => this.onPointerMove(event));
            document.addEventListener('pointerup', (event) => this.onPointerUp(event));
        }
    
        onPointerDown(event) {
            if (!this.isOrbitControlEnabled) {
                for (const item of this.selectionBox.collection) {
                    item.material.color.set(this.selectedColor);
                }
                const rect = this.designPart.getBoundingClientRect();
                this.selectionBox.startPoint.set(
                    (event.clientX - rect.left) / rect.width * 2 - 1,
                    -(event.clientY - rect.top) / rect.height * 2 + 1,
                    0.5
                );
            }
        }
    
        onPointerMove(event) {
            if (!this.isOrbitControlEnabled && this.helper.isDown) {
                const rect = this.designPart.getBoundingClientRect();
                this.selectionBox.endPoint.set(
                    (event.clientX - rect.left) / rect.width * 2 - 1,
                    -(event.clientY - rect.top) / rect.height * 2 + 1,
                    0.5
                );
                const allSelected = this.selectionBox.select();
                allSelected.forEach((sphere) => {
                    sphere.material.color.set(this.selectedColor);
                    this.selectedMeshes.push(sphere);
                });
            }
        }
    
        onPointerUp(event) {
            if (!this.isOrbitControlEnabled) {
                const rect = this.designPart.getBoundingClientRect();
                this.selectionBox.endPoint.set(
                    (event.clientX - rect.left) / rect.width * 2 - 1,
                    -(event.clientY - rect.top) / rect.height * 2 + 1,
                    0.5
                );
                const allSelected = this.selectionBox.select();
                allSelected.forEach((sphere) => {
                    sphere.material.color.set(this.selectedColor);
                    this.selectedMeshes.push(sphere);
                });
            }
        }
    
        sendSelectedMeshesToHTML() {
            const designVarList = this.selectedMeshes.map(mesh => mesh.designvar).join('<br>');
            document.getElementById(this.listId).innerHTML = designVarList;
        }
    }
    
    // ** Create Managers for BC and Force **
    const bcManager = new SelectionManager(camera, scene, renderer, 'bcareaadd', 'clearselectedbc', 'bclist', 0x00ff00, 'red');
    const forceManager = new SelectionManager(camera, scene, renderer, 'forceareaadd', 'clearselectedforce', 'forcelist', 0x00ff00, 'blue');
    
    // Submit Buttons
    document.getElementById('bcSubmit').addEventListener('click', () => bcManager.sendSelectedMeshesToHTML());
    document.getElementById('bcSubmit').addEventListener('click', () => forceManager.sendSelectedMeshesToHTML());
    
   
    geometry.dispose();
    camera.position.z = 30;
    
    //  ** Clickable Meshes **
    var clickedMesh = null;
    var infoBox = document.getElementById("info-box1"); // text box for mesh info
    const canvas = document.querySelector('canvas');
    const boxPosition = new THREE.Vector3();
    renderer.domElement.addEventListener('click', onCanvasClick, false);
    function onCanvasClick(event) {
        // Calculate the mouse click position in normalized device coordinates (NDC)
        var mouse = new THREE.Vector2();
        const containerRect = container.getBoundingClientRect();
        const x = ((event.clientX - containerRect.left) / container.clientWidth) * 2 - 1;
        const y = -((event.clientY - containerRect.top) / container.clientHeight) * 2 + 1;
        // Raycasting is used to determine which object was clicked
        raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, camera);
        raycaster.params.Points.threshold = 0.001; // Adjust the threshold as needed
        var intersects = raycaster.intersectObjects(spheres, true);
        if (intersects.length > 0) {
            if (INTERSECTED != intersects[0].object) {
                if (INTERSECTED && !selectedSphereIDs.includes(INTERSECTED.designvar)) {
                    INTERSECTED.material.emissive.set(INTERSECTED.currentHex); // change the color here (green)
                }
                INTERSECTED = intersects[0].object;
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.set(0xff0000);
                const selectedMeshUUID = INTERSECTED.uuid;
                const designVar = INTERSECTED.designvar;
                const strainEnergy = INTERSECTED.strain;
                const displacement = INTERSECTED.displacement;
                // Update the text box content
                const designVarText = "Design variable: " + designVar;
                const strainEnergyText = "Strain energy: " + strainEnergy;
                const displacementText = "Displacement: " + displacement;
                document.getElementById("design-var1").textContent = designVarText;
                document.getElementById("strain-energy1").textContent = strainEnergyText;
                document.getElementById("displacement1").textContent = displacementText;
            
                boxPosition.setFromMatrixPosition(INTERSECTED.matrixWorld);
                boxPosition.project(camera);
                var widthHalf = container.clientWidth / 2;
                var heightHalf = container.clientHeight / 2;
                boxPosition.x = (boxPosition.x * widthHalf) + widthHalf;
                boxPosition.y = - (boxPosition.y * heightHalf) + heightHalf;
                infoBox.style.display='block';
            }
        } else {
            // Hide the text box if no mesh is clicked
            infoBox.style.display='none';
        }        
    }
    
    function animate() {        
        requestAnimationFrame(animate);
        controls.update();
        controls2.update();
        camera2.position.copy(camera.position);
        camera2.position.sub(controls.target);
        camera2.position.setLength(CAM_DISTANCE);
        camera2.lookAt(scene2.position);
        render();
    }

    animate();  
    flag = true;
    function render() {
        renderer.render(scene, camera);
        renderer2.render(scene2, camera2);
    }       
}

