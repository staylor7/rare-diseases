import * as d3 from "d3";

export function readData(file, id) {
	d3.csv(file, processData) // promise object
		.then((data) => graph(data, id)) //callback
		.catch((error) => console.log("Error: ", error.message));
}

export function processData(datum) {
	let dataItem = {
		disease: datum.Disease,
		category: datum.Category,
		chakra: datum.Chakra,
		gene: datum.Gene,
		ngenes: parseInt(datum.Ngenes) || 0,
		nphenotype: parseInt(datum.Nphenotype) || 0,
		nvariants: parseInt(datum.Nvariants) || 0,
		phenoSys: datum.Phenotype_System,
		promoter: datum.Promoter,
	};
	return dataItem;
}

export function graph(data, id) {
	const width = data.length * 4,
		height = data.length * 4,
		radius = Math.min(width, height) / 2;

	const arc = d3
		.arc()
		.innerRadius(radius * 0.3)
		//.outerRadius((d) => console.log(d.data.ngenes)); //undefined, why?
		.outerRadius((d) => radius * 0.75 + d.data.ngenes * 4);

	const pie = d3
		.pie()
		.padAngle(1 / radius)
		.sort(null)
		.value((d) => d.chakra.length); // not sure why this works

	let colors = d3
		.scaleOrdinal()
		.domain(data) // colorbrewer 2.0, qualitative color set
		.range(
			[
				"#8dd3c7",
				"#ffffb3",
				"#bebada",
				"#fb8072",
				"#80b1d3",
				"#fdb462",
				"#b3de69",
				"#fccde5",
				"#d9d9d9",
				"#bc80bd",
				"#ccebc5",
				"#ffed6f",
			],
			[
				"ritu",
				"indu",
				"vasu",
				"rudra",
				"veda",
				"aditya",
				"dishi",
				"bana",
				"bhrama",
				"netra",
				"agni",
				"rishi",
			]
		);

	let svg = d3
		.select(id)
		.append("svg") // create an <svg> element on the webpage
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [-width / 2, -height / 2, width, height])
		.attr("style", "max-width: 100%; height: auto;");

	svg
		.append("g")
		.selectAll()
		.data(pie(data))
		.join("path")
		.attr("fill", (d) => colors(d.data.chakra))
		.attr("d", arc)
		.append("title")
		.text((d) => `${d.data.chakra}: ${d.data.chakra.toLocaleString()}`);

	svg
		.append("g")
		.attr("font-family", "sans-serif")
		.attr("font-size", 12)
		.attr("text-anchor", "middle")
		.selectAll()
		.data(pie(data))
		.join("text")
		.attr("transform", (d) => `translate(${arc.centroid(d)})`)
		.call((text) =>
			text
				.append("tspan")
				.attr("y", "-0.4em")
				.attr("font-weight", "normal")
				//.text(d => d.data.gene))
				.text((d) => "")
		) // this should appear on mouseover only, so I've made it blank for now
		.call((text) =>
			text
				.filter((d) => d.endAngle - d.startAngle > 0.25)
				.append("tspan")
				.attr("x", 0)
				.attr("y", "0.7em")
				.attr("fill-opacity", 0.7)
				.text((d) => d.data.gene.toLocaleString("en-US"))
		);
}
