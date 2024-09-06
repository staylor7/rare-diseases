import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { clickArc } from "../sunburst";
import { ScheduledAction } from "../types";

export const CSV = await csv(csvUrl);

const AUDIO = <HTMLAudioElement>document.getElementById("viola");
if (!AUDIO) throw new Error("No container found with the ID 'viola'");

AUDIO.src = (await import(`../../assets/viola.mp3`)).default;
// AUDIO.addEventListener("play", toggle);
AUDIO.ontimeupdate = () => handleTimeUpdate();

let currentChakra = "";
let currentDisease = "";

// Inefficient but whatever
const SCHEDULED_ACTIONS: ScheduledAction[] = [];
CSV.map((e) =>
  SCHEDULED_ACTIONS.push({
    chakra: e.Category,
    disease: e.Disease,
    timestamp: parseFloat(e.Timings),
  })
);

function handleTimeUpdate() {
  SCHEDULED_ACTIONS.forEach(({ chakra, disease, timestamp }) => {
    const diff = AUDIO.currentTime - timestamp;

    if (!(0 < diff && diff < 0.5)) return;
    if (chakra !== currentChakra) {
      clickArc(chakra);
      currentChakra = chakra;
    }
    if (disease !== currentDisease) {
      clickArc(disease);
      currentDisease = disease;
    }
  });
}
