import { DatumNode } from "./types";

export default function handlePopup(p: DatumNode) {
  const popup = document.getElementById("diseasePopup");
  const sunburst = document.getElementById("sunburst"); // Reference to the sunburst container

  if (!popup || !sunburst) {
    console.error("Required elements not found.");
    return;
  }

  // Display the popup for disease nodes
  const detailsHtml =
    p.children
      ?.map((child) => {
        // Check if this child contains a 'Link'
        if (child.data.name.startsWith("Link:")) {
          // Extract the URL from the text, assuming it's the part after the colon
          const urlMatch = child.data.name.match(/Link:\s*(.*)/);
          const url = urlMatch ? urlMatch[1] : "";
          // Format the URL as a clickable link, but keep 'Link:' as plain text
          return `<strong>Link:</strong> <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: purple;">${url}</a>`;
        }
        // Format other details, making the part before ':' bold
        return child.data.name.replace(/(^[^:]+):/, "<strong>$1:</strong>");
      })
      .join("<br>") ?? "No details available";

  if (popup) {
    popup.innerHTML = `
        <div>
            <button id="popupCloseButton" style="float: right; cursor: pointer;">&times;</button>
            <strong>${p.data.name}</strong><br>${detailsHtml}
        </div>`;
    popup.style.display = "block";
    popup.style.position = "fixed";
    popup.style.left = "50%";
    popup.style.top = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.zIndex = "1000";

    sunburst.style.opacity = "0.5";
  }

  const closeButton = popup.querySelector("#popupCloseButton");
  if (closeButton) {
    closeButton.addEventListener("click", function (event) {
      popup.style.display = "none";
      sunburst.style.opacity = "1";
      event.stopPropagation(); // Prevent the click event from bubbling up
    });
  } else {
    console.error("Close button not found.");
  }
}
