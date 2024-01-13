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


function processNode(node, path = [], locations = [], callback) {
    if (typeof node === 'string') {
        if (isLikelyXML(node)) {
            parseXMLString(node, (err, result) => {
                if (!err) {
                    locations.push({ path: path.join(' > '), original: node, result });
                    callback(null, result, locations);
                } else {
                    callback(err, null, locations);
                }
            });
        } else if (node.includes('|')) {
            const arrayValues = node.split('|').map(value => value.trim());
            let count = arrayValues.length;
            arrayValues.forEach((value, index) => {
                if (isLikelyXML(value)) {
                    parseXMLString(value, (err, result) => {
                        if (!err) {
                            arrayValues[index] = result;
                        }
                        --count;
                        if (count === 0) {
                            callback(null, arrayValues, locations);
                        }
                    });
                } else {
                    --count;
                    if (count === 0) {
                        callback(null, arrayValues, locations);
                    }
                }
            });
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
                --count;
                if (count === 0) {
                    callback(null, node, locations);
                }
            });
        });
    } else {
        callback(null, node, locations);
    }
}


export default function processXML(xmlString, callback) {
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