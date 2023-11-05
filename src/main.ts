import { readData } from "./raredisease";

const container = document.getElementById("catalog");
if (container) readData("/seq.d3.csv", container);
