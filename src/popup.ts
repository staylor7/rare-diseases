import { DatumNode } from "./types";

export default function handlePopup(p: DatumNode) {
  const popup = document.getElementById("popup");
  const sunburst = document.getElementById("sunburst");

  if (!popup || !sunburst) {
    console.error("Required elements not found.");
    return;
  }

  // Set popup width relative to sunburst's width (consider moving this outside if it doesn't need to be recalculated every time)
  const sunburstRect = sunburst.getBoundingClientRect();
  const popupWidth = (sunburstRect.width / 2) * 0.6; // 60% of half the sunburst width
  popup.style.width = `${popupWidth}px`;

  // Make popup visible to calculate its dimensions accurately
  popup.style.display = "block";

  // Use requestAnimationFrame to ensure the layout has updated with the popup now being visible
  requestAnimationFrame(() => {
    // Adjust calculations to consider the current scroll position
    const sunburstCenterX =
      sunburstRect.left + window.scrollX + sunburstRect.width / 2;
    const sunburstCenterY =
      sunburstRect.top + window.scrollY + sunburstRect.height / 2;

    const popupHeight = popup.offsetHeight;
    const centeredLeft = sunburstCenterX - popupWidth / 2;
    const centeredTop = sunburstCenterY - popupHeight / 2;

    // Update popup position
    popup.style.left = `${centeredLeft}px`;
    popup.style.top = `${centeredTop}px`;

    // Setup close button functionality
    const closeButton = document.getElementById("closePopup");
    if (closeButton) {
      closeButton.onclick = () => closePopup();
    } else {
      console.error("Close button not found.");
    }

    function closePopup() {
      if (popup) {
        popup.style.display = "none";
        document.removeEventListener("mousedown", handleOutsideClick);
      }
      if (sunburst) {
        sunburst.style.opacity = "1";
      }
    }

    // Add an event listener to close the popup when clicking outside
    function handleOutsideClick(event: MouseEvent) {
      if (
        popup &&
        !popup.contains(event.target as Node) &&
        (!sunburst || event.target !== sunburst)
      ) {
        closePopup();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
  });

  popup.style.position = "absolute";
  popup.style.zIndex = "1000"; // Ensure the popup is above other content

  let linksHtml = "";
  let detailsHtml = "";

  p.children?.forEach((child) => {
    // Split the name to separate the term from the description or URL
    const parts = child.data.name.split(/:(.+)/);
    const term = parts[0].trim();
    let description = parts[1] ? parts[1].trim() : "";

    // Check if the term is 'Link', indicating it's a URL to be displayed as "learn more"
    if (term.toLowerCase() === "link") {
      // Display "Link" in a strong tag and make "learn more" the clickable text
      linksHtml += `<div><strong>Link:</strong> <a href="${description}" target="_blank" rel="noopener noreferrer" style="color: purple;">Learn more</a></div>`;
      return; // Skip the rest of the processing for this child
    }

    // Capitalize the first letter of the description for non-link items
    if (description)
      description = description.charAt(0).toUpperCase() + description.slice(1);

    // Format lines for non-link items, e.g., "Elite: Yes" or adding descriptions
    if (term.toLowerCase() === "description")
      detailsHtml =
        `<div style="margin-bottom: 10px;">${description}</div>` + detailsHtml;
    else
      detailsHtml += description
        ? `<div><strong>${term}:</strong> ${description}</div>`
        : `<div><strong>${term}</strong></div>`;
  });

  // Concatenate linksHtml at the end of detailsHtml
  detailsHtml += linksHtml;

  // The rest of your function remains unchanged, eventually setting popup.innerHTML with the modified detailsHtml

  if (!detailsHtml.trim()) detailsHtml = "<div>No details available</div>";

  popup.innerHTML = `
  <button id="closePopup" style="position: absolute; top: 15px; right: 15px; cursor: pointer;">&times;</button>
    <div style="margin: 20px;">
        <div style="font-size: 18px; margin-bottom: 10px;"><strong>${p.data.name}</strong></div>
        ${detailsHtml}
    </div>`;

  popup.style.zIndex = "1000";
  popup.style.backgroundColor = "white";
  popup.style.padding = "20px";
  popup.style.border = "1px solid #ccc";
  popup.style.borderRadius = "5px";
  popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
  popup.style.maxWidth = "80%";
  popup.style.wordWrap = "break-word"; // Deprecated, but will break continuous words (e.g. promoter sequence)

  sunburst.style.opacity = "0.5";

  const closeButton = popup.querySelector("#closePopup");
  if (closeButton)
    closeButton.addEventListener("click", function (event) {
      popup.style.display = "none";
      sunburst.style.opacity = "1";
      event.stopPropagation(); // Prevent the click event from bubbling up
    });
  else console.error("Close button not found.");
}
