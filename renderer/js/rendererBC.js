const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    
    const boundaryButton = document.getElementById('boundary');  // Boundary button
    const force = document.getElementById("force"); // apply force button
    const bc = document.getElementById("bc"); // apply bc button
    const modal1 = document.querySelector(".modal1");
    const modal2 = document.querySelector(".modal2");
    const forcebc = document.getElementById("force-bc"); // the dialog
    const closeBtn1 = document.querySelector(".close-btn1")
    const closeBtn2 = document.querySelector(".close-btn2")
    const closeDialogButton = document.getElementById('closeDialog'); // close dialog
  // const forcepointadd = document.getElementById('forcepointadd'); // add button force
  // const bcpointadd = document.getElementById('bcpointadd'); // add button for bc
      
    boundaryButton.addEventListener('click', async () => {
        console.log("Clicked boundary con button!!");
        forcebc.show();              
    });
    force.addEventListener('click', async () => {
        modal1.style.display = "block"
    });
    closeBtn1.onclick = function(){
        modal1.style.display = "none"
    }
    bc.addEventListener('click', async () => {
        modal2.style.display = "block"
    });
    closeBtn2.onclick = function(){
        modal2.style.display = "none"
    }
    // Event listener for closing the dialog
    closeDialogButton.addEventListener('click', () => {
        forcebc.close();
    });

    var forceDict = {};
    var bcDict = {};
    function addButtonClickListener(buttonId, designVarId, strainId, displacementId, listContainerId, dictionary) {
        const button = document.getElementById(buttonId);
    
        button.addEventListener('click', async () => {
            const designvar = document.getElementById(designVarId).innerHTML;
            const strain = document.getElementById(strainId).innerHTML;
            const disp = document.getElementById(displacementId).innerHTML;
    
            const dArray = designvar.split(" ");
            const sArray = strain.split(" ");
            const disArray = disp.split(" ");
    
            const dValue = dArray[2];
            const sValue = sArray[2];
            const disValue = disArray.slice(1, 4);
    
            if (dValue != null && !dictionary.hasOwnProperty(dValue)) {
                dictionary[dValue] = {
                    strain: sValue,
                    displacement: disValue
                };
                updateList(listContainerId, dictionary); // Update the displayed list
            }
        });
    }
    
    function updateList(listContainerId, dictionary) {
        const listContainer = document.getElementById(listContainerId);
    
        // Clear existing list
        listContainer.innerHTML = "";
    
        // Create a list of keys and remove buttons
        for (const key in dictionary) {
            if (dictionary.hasOwnProperty(key)) {
                const listItem = document.createElement("li");
                listItem.textContent = key;
    
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.addEventListener("click", () => {
                    // Remove the element from the dictionary
                    delete dictionary[key];
                    updateList(listContainerId, dictionary); // Update the displayed list
                });
    
                listItem.appendChild(removeButton);
                listContainer.appendChild(listItem);
            }
        }
    }
    // for design domain part: design-var1, strain-energy1, displacement1
    addButtonClickListener('forcepointadd', 'design-var1', 'strain-energy1', 'displacement1', 'list-container1', forceDict);
    addButtonClickListener('bcpointadd', 'design-var1', 'strain-energy1', 'displacement1', 'list-container2', bcDict);
});


