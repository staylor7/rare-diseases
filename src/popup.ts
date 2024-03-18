import { DatumNode } from "./types";

const POPUP = document.getElementById("popup");
const SUNBURST = document.getElementById("sunburst");
// const CIRCLE = document.getElementById("circle");

document.addEventListener("mousedown", handleClick);

/**
 * Closes popup if click is outside the popup and sunburst
 */
function handleClick(event: MouseEvent) {
  const obj = event.target;
  if (obj instanceof Node && POPUP && !POPUP?.contains(obj))
    POPUP.style.display = "none";
}

export default function handlePopup(p: DatumNode) {
  if (!POPUP || !SUNBURST) {
    console.error("Required elements not found.");
    return;
  }

  POPUP.style.display = "block";
  POPUP.innerHTML = `
    <div>
      <h1 class="title">${p.data.name}</h1>
      ${p.children ? generateDetailsHTML(p.children) : ""}
    </div>`;
}

function generateDetailsHTML(details: DatumNode[]) {
  let linkHtml = "";
  let detailsHtml = "";

  details.forEach((detail) => {
    // e.g. term = "elite", description = "yes"
    const parts = detail.data.name.split(/:(.+)/);
    const term = parts[0].trim().toLowerCase();
    const description = parts[1] ? parts[1].trim() : "";

    if (term === "link") linkHtml = generateLinkHtml(description);
    else if (term === "description")
      detailsHtml =
        `<li class="description">${toFirstCharUpperCase(description)}</li>` +
        detailsHtml;
    else
      detailsHtml += toFirstCharUpperCase(description)
        ? `<li>
            <strong>${toFirstCharUpperCase(term)}: </strong>
            ${description}
          </li>`
        : `<li>
            <strong>${toFirstCharUpperCase(term)}</strong>
          </li>`;
  });

  detailsHtml += linkHtml;

  return detailsHtml.trim()
    ? "<ul>" + detailsHtml + "</ul>"
    : "<p>No details available</p>";
}

function generateLinkHtml(url: string) {
  return `
  <div>
    <strong>Link:</strong>
    <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: purple;">
      Learn more
    </a>
  </div>`;
}

function toFirstCharUpperCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
