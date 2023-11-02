import { readData } from "./raredisease";

async function displayCatalog() {
	const container = document.getElementById("catalog");
	if (container?.id) readData("/seq.d3.csv", container.id);
	console.log(container);
}

displayCatalog();
