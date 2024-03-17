import { DatumNode } from "./types";

export default function handlePopup(p: DatumNode) {
  const popup = document.getElementById("diseasePopup");
  const sunburst = document.getElementById("sunburst");

  if (!popup || !sunburst) {
    console.error("Required elements not found.");
    return;
  }

  let linksHtml = "";
  let detailsHtml = "";

  p.children?.forEach((child) => {
    // Format links
    if (child.data.name.startsWith("Link:")) {
      const urlMatch = child.data.name.match(/Link:\s*(.*)/);
      const url = urlMatch ? urlMatch[1] : "";
      linksHtml += `<div><strong>Link:</strong> <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: purple;">${url}</a></div>`;
      return;
    }

    const parts = child.data.name.split(/:(.+)/);
    const term = parts[0].trim();
    let description = parts[1] ? parts[1].trim() : "";

    // Capitalize the first letter of the description
    if (description)
      description = description.charAt(0).toUpperCase() + description.slice(1);

    // Format lines, e.g. "Elite: Yes"
    if (term.toLowerCase() === "description")
      detailsHtml =
        `<div style="margin-bottom: 10px;">${description}</div>` + detailsHtml;
    else
      detailsHtml += description
        ? `<div><strong>${term}:</strong> ${description}</div>`
        : `<div><strong>${term}</strong></div>`;
  });

  detailsHtml += linksHtml;

  if (!detailsHtml.trim()) detailsHtml = "<div>No details available</div>";

  popup.innerHTML = `
  <button id="popupCloseButton" style="position: absolute; top: 15px; right: 15px; cursor: pointer;">&times;</button>
    <div style="margin: 20px;">
        <div style="font-size: 18px; margin-bottom: 10px;"><strong>${p.data.name}</strong></div>
        ${detailsHtml}
    </div>`;
  popup.style.display = "block";
  popup.style.position = "fixed";
  popup.style.left = "50%";
  popup.style.top = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.zIndex = "1000";
  popup.style.backgroundColor = "white";
  popup.style.padding = "20px";
  popup.style.border = "1px solid #ccc";
  popup.style.borderRadius = "5px";
  popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
  popup.style.maxWidth = "80%";
  popup.style.wordWrap = "break-word"; // Deprecated, but will break continuous words (e.g. promoter sequence)

  sunburst.style.opacity = "0.5";

  const closeButton = popup.querySelector("#popupCloseButton");
  if (closeButton)
    closeButton.addEventListener("click", function (event) {
      popup.style.display = "none";
      sunburst.style.opacity = "1";
      event.stopPropagation(); // Prevent the click event from bubbling up
    });
  else console.error("Close button not found.");
}
