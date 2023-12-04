import { readData } from "./raredisease";

const container = document.getElementById("catalog");

if (container) readData(import.meta.env.BASE_URL + "seq.d3.csv", container);
