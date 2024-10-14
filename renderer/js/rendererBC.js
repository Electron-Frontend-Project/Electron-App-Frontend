const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const boundaryButton = document.getElementById('boundary');  // Boundary button
    const forcebc = document.getElementById("force-bc"); // the dialog
    const closeDialogButton = document.getElementById('closeDialog'); // close dialog
    const Submit = document.getElementById('bcSubmit'); // Submit button

    var fListsend = [];
    var forceDict = {};
    var bcDict = {};
    var designVarList= [];
   
    const f = {};

    boundaryButton.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log("Clicked boundary condition button!!");
        forcebc.show();
    });

    // Event listener for closing the dialog
    closeDialogButton.addEventListener('click', (event) => {
        event.preventDefault();
        forcebc.close();
    });

    // **to get points id**
    const addButton = document.getElementById('forcepointadd');
    addButton.addEventListener('click', () => {
        const designVarId = 'design-var1';
        const listContainerId = 'list-container1';
        const list = fListsend;
        const designvar = document.getElementById(designVarId).innerHTML;
        const dArray = designvar.split(" ");
        const dValue = dArray[2];
        if (dValue != null && !list.includes(dValue)) {
            list.push(dValue);
            updateList(listContainerId, list); // Update the displayed list
            fListsend = list; 
               
            // Send the ID of the selected sphere to rendererD.js
            const selectedMeshID = document.getElementById("design-var1").textContent.split(": ")[1];
            console.log("Selected Mesh ID:", selectedMeshID); // Debug log
            ipcRenderer.send('selected-sphere', selectedMeshID);     
        }
    });

    function updateList(listContainerId, list) {
        const listContainer = document.getElementById(listContainerId);
        // Clear existing list
        listContainer.innerHTML = "";
        // Create a list of elems and remove buttons
        for (const elem in list) {
            const listItem = document.createElement("li");
            listItem.textContent = list[elem];
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", (event) => {
                event.preventDefault();
                const removedID = list[elem];
                // Remove the element from the list
                delete list[elem];
                updateList(listContainerId, list); // Update the displayed list
                ipcRenderer.send('removed-sphere', removedID); // Send removeID to main
            });
            listItem.appendChild(removeButton);
            listContainer.appendChild(listItem);
        }
    }

    // **to get force components values**
    function forceComponents() {
        const xComponent = document.getElementById("x-com").value;
        const yComponent = document.getElementById("y-com").value;
        const zComponent = document.getElementById("z-com").value;

        const forceComponents = {
            x: parseFloat(xComponent) || 0,
            y: parseFloat(yComponent) || 0,
            z: parseFloat(zComponent) || 0,
        };
        console.log("xcom: ", forceComponents);
        forceDict = forceComponents;
        console.log("forceDict: ", forceDict);
    }

    //  **to get sphere ids in selected area**
    function handleSendButtonClick() {
        const listElementHTML = document.getElementById('list').innerHTML;
        const designVarListTemp = listElementHTML.split('<br>');
        const nonEmptyDesignVarListTemp = designVarListTemp.map(item => item.trim()).filter(item => item!== ''); // '' none element
        const uniqueDesignVarSetTemp = new Set(nonEmptyDesignVarListTemp);
        const uniqueDesignVarListTemp = Array.from(uniqueDesignVarSetTemp);
        designVarList = uniqueDesignVarListTemp.length > 0? uniqueDesignVarListTemp : [];
        console.log("designvarlist: " + designVarList.length);
    }

    // **to get bc components values**
    function bcComponents() {
        let xCom = false;
        let yCom = false;
        let zCom = false;

        // for x, y, and z components
        const xCheckbox = document.getElementById('x-checkbox');
        const yCheckbox = document.getElementById('y-checkbox');
        const zCheckbox = document.getElementById('z-checkbox');

        if (xCheckbox.checked) {
            xCom = true;
        }
        if (yCheckbox.checked) {
            yCom = true;
        }
        if (zCheckbox.checked) {
            zCom = true;
        }

        const bcComponents = {
            x: xCom,
            y: yCom,
            z: zCom,
        };
        bcDict = bcComponents;
    }

    Submit.addEventListener('click', async (event) => {
        event.preventDefault();
    console.log("submit hereeeeeeeeee");
    forceComponents();
    updateList('list-container1', fListsend); // Update the list before calling handleSendButtonClick()
    await new Promise(resolve => setTimeout(resolve, 100)); // wait for the list to be updated
    handleSendButtonClick(); // assign result to designVarList
    bcComponents();
      
        f['points'] = fListsend;
        if (fListsend && fListsend.length > 0) {
          f['points'] = fListsend.filter(point => point!== null);
        }
        f['forcecomponents'] = forceDict;
        f['constcomponents'] = bcDict;
        f['designVars'] = designVarList; // use the global designVarList variable
        console.log(f);
        ipcRenderer.send('send-BCparams', f);
    });
});
