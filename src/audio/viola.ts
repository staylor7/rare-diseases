import viola from "/viola.mp3";
import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { clickArc } from "../sunburst";
import { ScheduledAction } from "../types";
import { pause } from "./datum";

export const CSV = await csv(csvUrl);
export let isPlaying = false;

const AUDIO = <HTMLAudioElement>document.getElementById("viola");
if (!AUDIO) throw new Error("No container found with the ID 'viola'");

AUDIO.src = viola;
AUDIO.onpause = () => (isPlaying = false);
AUDIO.onplay = () => {
  isPlaying = true;
  pause();
};
AUDIO.onseeking = () => {
  isPlaying = true;
};
AUDIO.onseeked = () => {
  isPlaying = false;
};
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
