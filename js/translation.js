
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

export default function translateNodeName(nodeName) {
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
