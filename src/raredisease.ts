import * as d3 from "d3";

export function readData(file: string, container: HTMLElement) {
  d3.csv(file, processData) // promise object
    .then((data) => graph(data, container)) //callback
    .catch((error) => console.log("Error: ", error.message));
}

export function processData(datum) {
  const dataItem = {
    disease: datum.Disease,
    category: datum.Category,
    chakra: datum.Chakra,
    gene: datum.Gene,
    ngenes: parseInt(datum.Ngenes) || 0,
    nphenotype: parseInt(datum.Nphenotype) || 0,
    nvariants: parseInt(datum.Nvariants) || 0,
    phenoSys: datum.Phenotype,
    promoter: datum.Promoter,
    inheritance: datum.Inheritance,
    malacards: datum.Malacards
  };
  return dataItem;
}

export function graph(data, container: HTMLElement) {
  const width = data.length * 5,
    height = data.length * 5,
    radius = Math.min(width, height) / 2,
    stroke = 3;

  const arc = d3
    .arc()
    .innerRadius(radius * 0.3)
    //.outerRadius((d) => console.log(d.data.ngenes)) //undefined, why?
    .outerRadius((d) => radius * 0.75 + d.data.ngenes * 4);

  const pie = d3
    .pie()
    .padAngle(1 / radius)
    .sort(null)
    .value((d) => d.chakra.length); // determine each region of the pie

  const colors = d3
    .scaleOrdinal()
    .domain(data) // colorbrewer 2.0, qualitative color set
    .range(
      [
        "#8dd3c7",
        "#ffd9b2",
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
    
  const svg = d3
    .select(container)
    .append("svg") // create an <svg> element on the webpage
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // from Jackson Levitt's Pie Chart
  const center = svg.append("g")
    .attr("transform", `translate(${0}, ${0})`)

  const centerSvg = center.append("circle")
    .attr("fill", "white")
    .attr("r", radius * 0.275)

  const text = center.append("text")
    .attr("text-anchor","middle")
    .attr("transform", `translate(0, 10)`)
    //.attr("font-size", "0.75em")
    .attr("font-family","system-ui")
    .attr("fill", "#999999")
    .attr("id", "centerText")
    .html("disease name");
    
  svg
    .append("g")
    .selectAll()
    .data(pie(data))
    .join("path")
    .attr("fill", (d) => colors(d.data.chakra))
    .attr("d", arc)
    .on("mousemove",handleMouseOver)
    .on("mouseout", handleMouseOut)
    .append("title")
    .style("width", function(d) {return colors(d) + "px"; })
    .text((d) => `${d.data.malacards}`);      // tooltip on mouseover
 
  //function handleMouseOver(d, i) { // i doesn't seem necessary
  function handleMouseOver(d) {
      d3.select(this)
        .attr("stroke", "#fff")
        .attr("stroke-width",stroke);
      d3.select(this)
        .transition()
        .duration(500)
        .attr("transform",GetTransform);
      d3.select("#centerText")
        .html(`${d.target.__data__.data.disease}`);
        //.html(`${d.target.__data__.data.promoter}`); // why does this need the extra underscore?
            // if I put the promoter seqence in the center, how can I format this string to fit inside the center circle?
      d3.select("#diseaseText")
        .html(`<b>${d.target.__data__.data.disease} </b><br>
        <font size="-1">${d.target.__data__.data.promoter} </font><br>
        gene: ${d.target.__data__.data.gene}; ${d.target.__data__.data.phenoSys} <br>
        category: ${d.target.__data__.data.category}; ${d.target.__data__.data.chakra} chakra <br>
        inheritance: ${d.target.__data__.data.inheritance} <br>
        number of phenotypes: ${d.target.__data__.data.nphenotype} <br>
        number of genes: ${d.target.__data__.data.ngenes}`);

  }

  function GetTransform(d){
    var dist = 1;
    d.midAngle = ((d.endAngle - d.startAngle)/2) + d.startAngle;
    var x = Math.sin(d.midAngle) * dist;
    var y = Math.cos(d.midAngle) * dist;
    return "translate(" + x + "," + y + ")";
                        // maybe here is a place to try making an arc brighter?
  }

  function handleMouseOut(d,i){
    d3.select(this)
      .attr("stroke-width","0px");
    d3.select(this)
      .transition()
      .duration(500)
      .attr('transform','translate(0,0)');
    
      d3.select('#mainText')
        .html("Gene");
  }

}
