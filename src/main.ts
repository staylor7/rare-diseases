import { readData } from "./raredisease";

const container = document.getElementById("catalog");
if (container) readData("/rare-diseases/seq.d3.csv", container);
