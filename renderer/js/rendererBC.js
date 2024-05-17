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
    var fListsend = [];
    const forceSend = document.getElementById('forceSend');
    const bcSend = document.getElementById('bcSend');
    var forceDict = {};
    var bcDict = {};
    var forceDictsend = {};
    var bcDictsend = {};
    var forcesend = {};
    const f = {};
      
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
    
//  to get selected point ids from Force
    function pointClickListener(buttonID, designVarId, listContainerId, list, pointSubmit){
        const button = document.getElementById(buttonID);
        const pointSub = document.getElementById(pointSubmit);
        button.addEventListener('click', async () => {
            const designvar = document.getElementById(designVarId).innerHTML;
            const dArray = designvar.split(" ");
            const dValue = dArray[2];  
            if (dValue != null && !list.includes(dValue)) {
                list.push(dValue);

                updateList(listContainerId, list); // Update the displayed list
                if (buttonID == 'forcepointadd'){
                    fListsend = list;
                }
            }
            console.log('send ', fListsend);                   
            pointSub.addEventListener('click', async () => {                
                forcesend = fListsend;                
            });
        });
        console.log('fsend: ', forcesend);
    }

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
            removeButton.addEventListener("click", () => {
                // Remove the element from the list
                delete list[elem];
                updateList(listContainerId, list); // Update the displayed list
            });
            listItem.appendChild(removeButton);
            listContainer.appendChild(listItem);    
        }
    }

    // Function to handle force component submission
    function addForceComponentListener(submitButtonId, forceDict) {
        const submitButton = document.getElementById(submitButtonId);

        submitButton.addEventListener('click', async () => {
            const xComponent = document.getElementById("x-com").value;
            const yComponent = document.getElementById("y-com").value;
            const zComponent = document.getElementById("z-com").value;

            const forceComponents = {
                x: parseFloat(xComponent) || 0,
                y: parseFloat(yComponent) || 0,
                z: parseFloat(zComponent) || 0,
            };
            console.log("xcom: ", forceComponents);            
            forceDictsend = forceComponents
          //  updateList('list-container1', forceDict);
            // send forceDictsend for components
        });
    }

    function addBCComponentListener(submitButtonId, bcDict) {       
        const submitButton = document.getElementById(submitButtonId);

        let xCom = false;
        let yCom = false;
        let zCom = false;

        // for x, y, and z components
        const xComponentButton = document.getElementById('x-btn');
        const yComponentButton = document.getElementById('y-btn');
        const zComponentButton = document.getElementById('z-btn');

        xComponentButton.addEventListener('click', () => {
            xCom = !xCom;
        });

        yComponentButton.addEventListener('click', () => {
            yCom = !yCom;
        });

        zComponentButton.addEventListener('click', () => {
            zCom = !zCom;
        });

        submitButton.addEventListener('click', () => {
            const bcComponents = {
                x: xCom,
                y: yCom,
                z: zCom,
            };

            bcDictsend = bcComponents;
            updateList('list-container2', bcDict);
            console.log('bcComp: ', bcComponents);
            // send bcDictsend 
        });
    }

    // for design domain part: design-var1
    pointClickListener('forcepointadd', 'design-var1', 'list-container1', fListsend, 'forcepointSub')
    
    // Add listeners for force and bc component submissions
    addForceComponentListener('forceFSubmit', forceDict);
    addBCComponentListener('bcFSubmit', bcDict);

    forceSend.addEventListener('click', async () => {
        
        f['points'] = fListsend;
        f['forcecomponents'] = forceDictsend;     
        if (fListsend && fListsend.length > 0) {
            f['points'] = fListsend.filter(point => point !== null);
        }
        console.log('points:  ', f['points']);
        console.log('forcecomponents: ', f['forcecomponents']);
        console.log(f);
    });

    bcSend.addEventListener('click', async () => {
        handleSendButtonClick();
        const designVarList = handleSendButtonClick();
        f['constcomponents'] = bcDictsend; 
        f['designVars'] = designVarList; 
        console.log('components: ', f['components']);
        console.log('Design Vars: ', f['designVars']);
        console.log(f);
        ipcRenderer.send('send-BCparams', f);
    });

//  to get sphere ids in selected area
    function handleSendButtonClick() {
        const listElementHTML = document.getElementById('list').innerHTML;    
        const designVarList = listElementHTML.split('<br>');    
        const nonEmptyDesignVarList = designVarList.map(item => item.trim()).filter(item => item !== ''); // '' none element   
        const uniqueDesignVarSet = new Set(nonEmptyDesignVarList);
        const uniqueDesignVarList = Array.from(uniqueDesignVarSet);
        return uniqueDesignVarList.length > 0 ? uniqueDesignVarList : [];    
    }    
});


