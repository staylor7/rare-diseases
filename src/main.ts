import { draw } from "./raredisease";
import { parseCsv } from "./utils";

const csvPath = import.meta.env.BASE_URL + "seq.d3.csv";
const container = document.getElementById("catalog");
const data = await parseCsv(csvPath);

if (container) draw(data, container);
