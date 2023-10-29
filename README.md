# rare-diseases
Catalog of Rare Diseases

The goal is to create an online catalog of 230 rare diseases, using the d3 javascript library and the web audio API. Currently it's a fixed-media music composition based on a Max patch (https://www.youtube.com/watch?v=9DtO6oasmE8). 
The code here is a simple pie chart made with d3, based on this Observable notebook: https://observablehq.com/d/406232d3d1d682bb

The radius of each arc corresponds to the number of genes associated with each disease ("Ngenes" on the spreadsheet). Eventually it would be neat if other info could be displayed with mouseover.

And ultimately I want to add sound to this chart, so if you click on a disease, you can hear its DNA promoter sequence. I'll add another column to the csv of timestamps from the fixed-media piece, which will play on click, with nice cross-fading, etc. The background harmony comes from each category of disease; on the chart, these are colors.
Data courtesy of Dr. Aditi Kantipuly, who is collaborating on this project.
