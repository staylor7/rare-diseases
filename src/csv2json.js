import * as d3 from "d3";
import { promises as fs } from "fs";

async function convertCsvToJson(csvPath, jsonPath) {
  try {
    const csvString = await fs.readFile(csvPath, "utf8");
    const csvData = d3.csvParse(csvString);
    console.log("Parsed " + csvPath);

    const stratifiedData = stratifyData(csvData);
    const json = JSON.stringify(stratifiedData, null, 2);

    await fs.writeFile(jsonPath, json, "utf8");
    console.log("Exported " + jsonPath);
  } catch (error) {
    console.error("Error:", error);
  }
}

function stratifyData(csvData) {
  const root = {
    name: "Root",
    children: [],
  };

  csvData.forEach((row) => {
    // Create nodes for layer 1
    const categoryNode = findOrCreateChild(
      root.children,
      row.Category,
      row.Chakra
    );

    // Create nodes for layer 2 (disease names) under each layer 1 node
    const diseaseNode = {
      name: row["Disease"],
      children: [
        { name: `'Nphenotype': ${row["Nphenotype"]}`, value: 100 },
        { name: `'Ngenes': ${row["Ngenes"]}`, value: 100 },
        { name: `'Elite': ${row["Elite"]}`, value: 100 },
        { name: `'Inheritance': ${row["Inheritance"]}`, value: 100 },
        { name: `'Nvariants': ${row["Nvariants"]}`, value: 100 },
        { name: `'Phenotype': ${row["Phenotype"]}`, value: 100 },
        { name: `'Gene': ${row["Gene"]}`, value: 100 },
        {
          name: `'Promoter': ${row["Promoter"]}`,
          value: 100,
          label: "Promoter: hover for details",
        },
        {
          name: `'Malacards': ${row["Malacards"]}`,
          value: 100,
          label: "Malacards: hover for details",
        },
      ],
    };

    categoryNode.children.push(diseaseNode);
  });

  return root;
}

function findOrCreateChild(children, name, opName) {
  const fullName = `${name} (${opName})`;
  let child = children.find((c) => c.name === fullName);
  if (!child) {
    child = { name: fullName, children: [] };
    children.push(child);
  }
  return child;
}

if (process.argv.length == 4)
  convertCsvToJson(process.argv[2], process.argv[3]);
else
  console.error(
    "Expected 2 additional arguments (csvPath, jsonPath), got ",
    process.argv.slice(2)
  );
