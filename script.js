import xml2js from 'https://cdn.jsdelivr.net/npm/xml2js@0.6.2/+esm'


function isLikelyXML(str) {
    return str.trim().startsWith('<') && str.trim().endsWith('>');
}

function parseXMLString(xmlString, callback) {
    const parser = new xml2js.Parser({
        explicitArray: false,
        normalizeTags: false,
        charkey: "content",
    });

    parser.parseString(xmlString, (err, result) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, result);
    });
}
const translationLookup = {
    "componentes": "Components",
    "objetos": "Objects",
    "DISTRIBUCION": "Distribution",
    "GESTION_INTERNA_ENERGIA": "Internal Energy Mgmt",
    "JUGADOR": "Player",
    "AMBIENTE": "Atmosphere",
    "HISTORIA": "History",
    "EVENTOS": "Events",
    "DISTRIBUCION_INTERNA_FLUIDOS": "Fluid Distribution",
    "LOGROS_MLIBRE": "Free Achievements",
    "LOGISTICA": "Logistics",
    "INTERFAZ": "Interface",
    "MANTENIMIENTO": "Maintenance",
    "AUDITORIAS": "Audits",
    "CONFIG_ALARMAS": "Alarm Config",
    "TRANSFORMACION": "Transformation",
    "COMUNICACIONES": "Communications",
    // Add more translations here
};

function translateNodeName(nodeName) {
    return translationLookup[nodeName] || nodeName;
}

function createInvertedTranslationLookup() {
    const invertedLookup = {};
    for (const [key, value] of Object.entries(translationLookup)) {
        invertedLookup[value] = key;  // Swap the key and value
    }
    return invertedLookup;
}

const invertedTranslationLookup = createInvertedTranslationLookup();

function invertNodeName(nodeName) {
    return invertedTranslationLookup[nodeName] || nodeName;
}


function processNode(node, path = [], locations = [], callback) {
    if (typeof node === 'string') {
        
        if (isLikelyXML(node)) {
            parseXMLString(node, (err, result) => {
                if (!err) {
                    locations.push({ path: path.join(' > '), original: node, result });
                    //if(result.hasOwnProperty('CSaveClass') && result['CSaveClass'].hasOwnProperty('$') && Object.keys(result['CSaveClass']).length == 1){
                        //err = 'Ignoring node result due to no non-xmlns children';
                        //callback(err, null, locations);
                    //}else{
                        callback(null, result, locations);
                    //}
                } else {
                    callback(err, null, locations);
                }
            });
        }else if (node.includes('|')){
            const arrayValues = node.split('|').map(value => value.trim());
            callback(null, arrayValues, locations);
        } else {
            callback(null, node, locations); // No need to parse as XML, just return the node
        }
    } else if (typeof node === 'object' && node !== null) {
        const keys = Object.keys(node);
        let count = keys.length;

        keys.forEach(key => {
            processNode(node[key], [...path, key], locations, (err, result, updatedLocations) => {
                if (!err) {
                    node[key] = result;
                    locations = updatedLocations;
                }
                --count
                //if(--count === 0){
                //    callback(null, node, locations);
                //}
            });
        });

        if (count === 0) {
            callback(null, node, locations);
        }
    } else {
        callback(null, node, locations);
    }
}


function processXML(xmlString, callback) {
    parseXMLString(xmlString, (err, parsedXML) => {
        if (err) {
            callback(err, null);
            return;
        }
        processNode(parsedXML, [], [], (err, processedXML, locations) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, { processedXML, locations });
            console.log('processNode Callback');
            console.log(err);
        });
    });
}

function rebuildXML(originalXMLObject, locations) {
    // Deep clone the original XML object to avoid modifying it directly
    let xmlObject = JSON.parse(JSON.stringify(originalXMLObject));

    // Invert translation for node names
    function invertNodeName(nodeName) {
        return invertedTranslationLookup[nodeName] || nodeName;
    }

    // Function to set the original string back into the XML object
    function setOriginalString(obj, path, originalString) {
        const keys = path.split(' > ').map(key => invertNodeName(key)); // Invert translation here
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = originalString;
    }

    // Replace the processed sections with the original strings
    locations.forEach(location => {
        setOriginalString(xmlObject, location.path, location.original);
    });
    
    // Convert the XML object back to string
    const builder = new xml2js.Builder();
    return builder.buildObject(xmlObject);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function handleFiles(files) {
    [...files].forEach(file => {
        console.log(this);
        console.log(file)
        if (file.type === "text/xml") {
            const reader = new FileReader();
            reader.onload = function (e) {
                const findings = processXML(e.target.result, (err, result) => {
                  if (err) {
                      console.error(err);
                  } else {
                      console.log('Processed XML:', result.processedXML);
                      console.log('HTML Entities Locations:', result.htmlEntitiesLocations);
                  }

                  createNavbarFromJson(result.processedXML['nucleares']);
                  //createXmlTreeView(result.processedXML, 'xmlTreeView');
                  // Rebuilding the original XML from the modified version
                  //const rebuiltXMLString = rebuildXML(result.processedXML, result.locations);
                  //const cleanedXMLString = rebuiltXMLString.replace(/&\#xD;/g, '');

                  // Trigger download
                  // download('rebuilt-file.xml', cleanedXMLString);
                });
                console.log(findings)
              
            };
            reader.readAsText(file);
        } else {
            alert("Please upload an XML file.");
        }
    });
}

// Drag and Drop Handlers
$(document).ready(function(){
    let dropArea = document.getElementById('drop-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('hover'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('hover'), false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);

    let fileElem = $('#fileElem');
    fileElem.change(function(){
         handleFiles(this.files)
    });
});

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    handleFiles(files);
}


function createTreeNode(key, value, parentNode) {
    let li = document.createElement('li');
    parentNode.appendChild(li);

    // Create a span to hold the key (and value if it's a text node)
    let span = document.createElement('span');
    span.textContent = typeof value === 'object' ? key : `${key}: ${value}`;
    li.appendChild(span);

    if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        let ul = document.createElement('ul');
        ul.style.display = 'none'; // Initially hide the child elements
        li.appendChild(ul);
        span.addEventListener('click', function(event) {
            ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
            event.stopPropagation(); // Prevent event bubbling
        });
        for (const [childKey, childValue] of Object.entries(value)) {
            createTreeNode(childKey, childValue, ul);
        }
    }
}

function createXmlTreeView(jsonObject, containerId) {
    let container = document.getElementById(containerId);
    let ul = document.createElement('ul');
    container.appendChild(ul);

    for (const [key, value] of Object.entries(jsonObject)) {
        createTreeNode(key, value, ul);
    }
}


function createNavbarFromJson(jsonData) {
    const navbarContainer = document.getElementById('xmlTab'); // Replace with your actual navbar container ID
    const keys = Object.keys(jsonData);

    keys.forEach((key, index) => {
        if (key === 'version') return; // Skip the 'version' element
        if (jsonData[key].hasOwnProperty('CSaveClass') && jsonData[key]['CSaveClass'].hasOwnProperty('$') && Object.keys(jsonData[key]['CSaveClass']).length  == 1) return;

        // Create the list item
        const listItem = document.createElement('li');
        listItem.className = 'nav-item';
        listItem.setAttribute('role', 'presentation');

        // Create the button
        const button = document.createElement('button');
        button.className = 'nav-link';
        button.id = `${key}-tab`;
        button.setAttribute('data-bs-toggle', 'tab');
        button.setAttribute('data-bs-target', `#${key}`);
        button.setAttribute('type', 'button');
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', key);
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false'); // First tab as selected
        button.textContent = translateNodeName(key); // Capitalize the first letter of the tab name

        // Append button to list item, and list item to the navbar
        listItem.appendChild(button);
        navbarContainer.appendChild(listItem);

        if(key === 'componentes' || key === 'objetos'){
            populateDropdownForTab(jsonData, key);
        }
    });
}

function populateDropdownForTab(jsonData, tabKey) {
    let tab = $(`#${tabKey}-tab`);
    const contents = tab.parent().html();
    tab.parent().html('<div class="btn-group">' + contents + '</div>');

    tab = $(`#${tabKey}-tab`);
    tab.addClass('btn');
    tab.parent().append($(`<button type="button" id="${tabKey}-tab-dropdown-btn" class="btn dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>`));
    tab.parent().append($(`<div class="dropdown-menu" id="${tabKey}-tab-dropdown" aria-labelledby="${tabKey}-tab-dropdown-btn"></div>`));

    const dropdown = $(`#${tabKey}-tab-dropdown`);
    if (!dropdown.length) return;

    // Clear existing options
    dropdown.empty();

    if (jsonData[tabKey]) {
        $.each(jsonData[tabKey], (index, item) => {
                dropdown.append($(`<a class="dropdown-item" href="#">${index}</a>`));
        });
    }

    // Add click event listener for dropdown items
    dropdown.on('click', '.dropdown-item', (event) => {
        event.preventDefault();
        const selectedItem = $(event.target).text();
        // Function to handle displaying details for the selected item
        displayDetailsForSelection(jsonData, tabKey, selectedItem);
    });
}
