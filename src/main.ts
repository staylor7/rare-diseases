import { draw } from "./raredisease";
import { parseCsv } from "./utils";

const csvPath = "seq.d3.csv";
const container = document.getElementById("catalog");
const data = await parseCsv(csvPath);

if (container) draw(data, container);
