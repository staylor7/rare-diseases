import * as d3 from 'd3';
import { promises as fs } from 'fs';

async function convertCsvToJson() {
    try {
        const csvString = await fs.readFile('seq.d3.csv', 'utf8');
        const csvData = d3.csvParse(csvString);

        const stratifiedData = stratifyData(csvData);
        const json = JSON.stringify(stratifiedData, null, 2);

        await fs.writeFile('hierarchy.json', json, 'utf8');
        console.log('JSON file created successfully');
    } catch (error) {
        console.error('Error:', error);
    }
}

function stratifyData(csvData) {
    let root = {
        name: "Root",
        children: []
    };

    // Fields for layer 2
    const layer2Fields = ["Nphenotype", "Ngenes", "Elite", "Inheritance", "Nvariants", "Phenotype", "Gene", "Promoter", "Malacards"];

    csvData.forEach(row => {
        // Create nodes for layer 1
        let categoryNode = findOrCreateChild(root.children, row.Category);
        let chakraNode = findOrCreateChild(root.children, row.Chakra);

        // Create nodes for layer 2 under each layer 1 node
        layer2Fields.forEach(field => {
            categoryNode.children.push({
                name: field,
                children: [{ name: row[field], value: 3000 }]
            });
            chakraNode.children.push({
                name: field,
                children: [{ name: row[field], value: 3000 }]
            });
        });
    });

    return root;
}

function findOrCreateChild(children, name) {
    let child = children.find(c => c.name === name);
    if (!child) {
        child = { name: name, children: [] };
        children.push(child);
    }
    return child;
}

convertCsvToJson();
