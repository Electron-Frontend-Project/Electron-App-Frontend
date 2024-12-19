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
isOrbitControlEnabled, selectionBox, helper, designPart, raycaster 
;
var INTERSECTED;
const selectedSphereIDs = [];
const removedSphereIDs = [];

document.addEventListener('DOMContentLoaded', () => {
    const readFile = document.getElementById('readFileDD');
    const designPart = document.getElementById('scene-container1');
    const topologyPart = document.getElementById('scene-container2');
    const mainPart = document.getElementById('main-part');
    let isDesignPartOpen = false;
    readFile.addEventListener('click', async () => {
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
        const userDir = os.homedir();
        const filePath = path.resolve(userDir, 'Desktop/PDTO-GitHub/PDTO-Project/topology/builtmeshallit/solid1.msh');
        ipcRenderer.send('read-file1', filePath);
    });
});

var i=0;
let dx, len, wid;
ipcRenderer.on('get-dxD', (event, data) => {    
    ({ dx, length: len, width: wid } = data);
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

ipcRenderer.on('file-read-error1', (event, errorMessage) => {
    // Handle the file read error here in the renderer process
    console.error('File read error:', errorMessage);
});

ipcRenderer.on('file-not-found1', (event, errorMessage) => {
    // Handle the file not found error here in the renderer process
    console.error('File not found:', errorMessage);
});

ipcRenderer.on('file-data1', (event, data) => {
    // Handle the received data here in the renderer process
    const lines = data.split('\n');
    if (dx) {
        console.log('dx:', dx);
        console.log('len: ', len);
        console.log('wid: ', wid);
    }
    console.log(lines[0]);

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
    // remove old scenes
    scene.remove(...scene.children);
    scene2.remove(...scene2.children);
    renderer.dispose();
    renderer2.dispose();
    controls.dispose();
    controls2.dispose();
    spheres.forEach(sphere => {
        sphere.geometry.dispose();
        sphere.material.dispose();
    });
    spheres = []; 
    container.removeChild(renderer.domElement);
    container2.removeChild(renderer2.domElement);
    if (selectionBox.dispose) {
        selectionBox.dispose();
    }
    if (helper.dispose) {
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
    const area = Math.sqrt(Math.pow(len, 2) + Math.pow(wid, 2));
    camera.zoom = 15 + dx/area;  //  for camera setting according to DX, LEN and WID 
    camera2 = new THREE.OrthographicCamera(
        width2 / -2,
        width2 / 2,
        height2 / 2,
        height2 / -2,
        0.1,
        50
    ); 
    camera2.zoom = 10 + dx/area;
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
        if (values.length === 8) {
            x = parseFloat(values[0]);
            y = parseFloat(values[1]);
            z = parseFloat(values[2]);
            strain = parseFloat(values[3]);
            designvar = values[4];
            dispx = parseFloat(values[5]);
            dispy = parseFloat(values[6]);
            dispz = parseFloat(values[7]);
        
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


    

    //  ** Select Box for BC **
    selectedMeshes = [];
    isOrbitControlEnabled = true;
   
    document.getElementById('bcareaadd').addEventListener('click', onPickAreaClick, false);
    function onPickAreaClick() {

        const button = document.getElementById('bcareaadd'); // Get the button

        // Change the button color directly
        if (button.style.backgroundColor === 'rgb(0, 123, 255)' || button.style.backgroundColor === '') { // Check if the current color is the default
            button.style.backgroundColor = 'red'; // Change to a new color
        } else {
            button.style.backgroundColor = ''; // Change back to the original color
        }
        isOrbitControlEnabled = !isOrbitControlEnabled;
        controls.enabled = isOrbitControlEnabled;
    }

    document.getElementById('clearselectedbc').addEventListener('click', clearSelectedSpheres, false);
    // Function to clear selected spheres
    function clearSelectedSpheres() {
        // Iterate through selectedMeshes and reset their colors
        selectedMeshes.forEach((sphere) => {
            if (sphere.material && sphere.material.emissive) {
                sphere.material.color.set(0x00ff00);
            } else {
              //  console.error("Material or emissive property is undefined for the sphere:", sphere);
            }
        });
        // Clear the selectedMeshes array
        selectedMeshes = [];
        console.log("selected meshes after clear: " + selectedMeshes);
    }
    selectionBox = new SelectionBox(camera, scene);
    helper = new SelectionHelper(renderer, 'sel_box');
    designPart = document.querySelector('.design-part');
    document.addEventListener('pointerdown', function (event) {
        if (!isOrbitControlEnabled) {
            for (const item of selectionBox.collection) {
                item.material.color.set(0xff0000);
            }
            const designPartRect = designPart.getBoundingClientRect();
            selectionBox.startPoint.set(
                (event.clientX - designPartRect.left) / designPartRect.width * 2 - 1,
                -(event.clientY - designPartRect.top) / designPartRect.height * 2 + 1,
                0.5
            );
        }
    });
    document.addEventListener('pointermove', function (event) {
        if (!isOrbitControlEnabled && helper.isDown) {
            for (let i = 0; i < selectionBox.collection.length; i++) {
                selectionBox.collection[i].material.color.set(0xff0000);
            }
            const designPartRect = designPart.getBoundingClientRect();
            selectionBox.endPoint.set(
                (event.clientX - designPartRect.left) / designPartRect.width * 2 - 1,
                -(event.clientY - designPartRect.top) / designPartRect.height * 2 + 1,
                0.5
            );
            const allSelected = selectionBox.select();
            for (let i = 0; i < allSelected.length; i++) {
                const selectedSphere = allSelected[i];
                selectedSphere.material.color.set(0xff0000);
                selectedMeshes.push(selectedSphere);
            }        
        }
    });
    document.addEventListener('pointerup', function (event) {
        if (!isOrbitControlEnabled) {
            const designPartRect = designPart.getBoundingClientRect();
            selectionBox.endPoint.set(
                (event.clientX - designPartRect.left) / designPartRect.width * 2 - 1,
                -(event.clientY - designPartRect.top) / designPartRect.height * 2 + 1,
                0.5
            );
            const allSelected = selectionBox.select();
            for (let i = 0; i < allSelected.length; i++) {
                const selectedSphere = allSelected[i];
                selectedSphere.material.color.set(0xff0000);
                selectedMeshes.push(selectedSphere.designvar);
            }
           
        }
    });
    
    //  ** Send selectedMeshes list to HTML for BC** 
    document.getElementById('bcSubmit').addEventListener('click', function() {
        sendDesignVarInfoBC(selectedMeshes);
    });
    function sendDesignVarInfoBC(meshes) {
        const designVarList = meshes.map(mesh => mesh.designvar).join('<br>');
        document.getElementById('bclist').innerHTML = designVarList;
    }














    //  ** Select Box for Force **
    var selectedMeshesForce = [];
    var isOrbitControlEnabledF = true;  
   
    document.getElementById('forceareaadd').addEventListener('click', onPickAreaClickF, false);

    function onPickAreaClickF() {

        const button = document.getElementById('forceareaadd'); // Get the button

        // Change the button color directly
        if (button.style.backgroundColor === 'rgb(0, 123, 255)' || button.style.backgroundColor === '') { // Check if the current color is the default
            button.style.backgroundColor = 'blue'; // Change to a new color
        } else {
            button.style.backgroundColor = ''; // Change back to the original color
        }

        isOrbitControlEnabledF = !isOrbitControlEnabledF;
        controls.enabled = isOrbitControlEnabledF;
    }

    document.getElementById('clearselectedforce').addEventListener('click', clearSelectedSpheresF, false);
   
    // Function to clear selected spheres
    function clearSelectedSpheresF() {
        // Iterate through selectedMeshes and reset their colors
        selectedMeshesForce.forEach((sphere) => {
            if (sphere.material && sphere.material.emissive) {
                sphere.material.color.set(0x00ff00);
            } 
        });
        // Clear the selectedMeshes array
        selectedMeshesForce = [];
        console.log("selected meshes after clear (F): " + selectedMeshesForce);
    }
    var selectionBoxF = new SelectionBox(camera, scene);
    var helperF = new SelectionHelper(renderer, 'sel_box');
    designPart = document.querySelector('.design-part');
    document.addEventListener('pointerdown', function (event) {
        if (!isOrbitControlEnabledF) {
            for (const item of selectionBoxF.collection) {
                item.material.color.set(0x0000ff);
            }
            const designPartRect = designPart.getBoundingClientRect();
            selectionBox.startPoint.set(
                (event.clientX - designPartRect.left) / designPartRect.width * 2 - 1,
                -(event.clientY - designPartRect.top) / designPartRect.height * 2 + 1,
                0.5
            );
        }
    });
    document.addEventListener('pointermove', function (event) {
        if (!isOrbitControlEnabledF && helperF.isDown) {
            for (let i = 0; i < selectionBoxF.collection.length; i++) {
                selectionBoxF.collection[i].material.color.set(0x0000ff);
            }
            const designPartRect = designPart.getBoundingClientRect();
            selectionBoxF.endPoint.set(
                (event.clientX - designPartRect.left) / designPartRect.width * 2 - 1,
                -(event.clientY - designPartRect.top) / designPartRect.height * 2 + 1,
                0.5
            );
            const allSelected = selectionBoxF.select();
            for (let i = 0; i < allSelected.length; i++) {
                const selectedSphere = allSelected[i];
                selectedSphere.material.color.set(0x0000ff);
                selectedMeshesForce.push(selectedSphere);
            }        
        }
    });
    
    document.addEventListener('pointerup', function (event) {
        if (!isOrbitControlEnabledF) {
            const designPartRect = designPart.getBoundingClientRect();
            selectionBoxF.endPoint.set(
                (event.clientX - designPartRect.left) / designPartRect.width * 2 - 1,
                -(event.clientY - designPartRect.top) / designPartRect.height * 2 + 1,
                0.5
            );
            const allSelected = selectionBoxF.select();
            for (let i = 0; i < allSelected.length; i++) {
                const selectedSphere = allSelected[i];
                selectedSphere.material.color.set(0x0000ff);
                selectedMeshesForce.push(selectedSphere.designvar);
            }           
        }
       
    });    
    //  ** Send selectedMeshes list to HTML for Force** 
    document.getElementById('bcSubmit').addEventListener('click', function() {
        sendDesignVarInfoF(selectedMeshesForce);
    }); 

    function sendDesignVarInfoF(meshes) {
        const designVarList = meshes.map(mesh => mesh.designvar).join('<br>');
        document.getElementById('forcelist').innerHTML = designVarList;
    }










    
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

