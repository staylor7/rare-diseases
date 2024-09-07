import { DatumNode } from "../types";

import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { TRANSITION_TIME } from "../constants";

export const CSV = await csv(csvUrl);

let context: AudioContext;
let currGain: GainNode;
let currChakra = "";

const stop = document.getElementById("stop");

stop?.addEventListener("click", (_) => {
  if (!context || !currGain) return;

  fade(currGain, 1, 0);
  const newGain = context.createGain();
  newGain.connect(context.destination);
});

/**
 * Plays a chakra or disease sound according to the {@link DatumNode}
 */
export default function playDatum(d: DatumNode) {
  if (!context) context = new AudioContext(); // Initialize on first call, i.e. after user interaction (see https://goo.gl/7K7WLu)
  context.resume();

  // Chakra/category
  const chakra = d.data.chakra;
  if (chakra) {
    if (chakra === currChakra) return; // Ignore replaying the same chakra (continue looping)
    playChakra(chakra);
    currChakra = chakra;
  }

  // Disease/promoter
  else if (d.data.name) playDisease(d.data.name);
  else console.error(`Invalid datum to play: ${d}`);
}

/**
 * Fades in the sound of the given chakra, fading out the current chakra sound if it exists
 */
async function playChakra(chakra: string) {
  const audio = new Audio(
    (await import(`../../assets/chakra/${chakra}.mp3`)).default
  );
  const newGain = context.createGain();
  context.createMediaElementSource(audio).connect(newGain);
  newGain.connect(context.destination);

  audio.loop = true;
  audio.play();

  // Crossfade old and new chakra audios
  if (currGain) fade(currGain, 1, 0); // WARNING: Does not pause audio once it mutes
  fade(newGain, 0, 1);

  currGain = newGain;
}

function fade(
  gainNode: GainNode,
  startVolume: number,
  endVolume: number,
  duration: number = TRANSITION_TIME
) {
  gainNode.gain.setValueAtTime(bound(startVolume), context.currentTime);

  gainNode.gain.linearRampToValueAtTime(
    bound(endVolume),
    context.currentTime + duration / 1000
  );
}

function bound(n: number, floor = 0, ceiling = 1) {
  return Math.min(Math.max(n, floor), ceiling);
}

/**
 * Plays the disease audio, ignoring/overlapping any context ("fire and forget")
 */
async function playDisease(disease: string) {
  const index = getDiseaseIndex(disease);

  if (!index)
    return console.error(`Could not find row index for disease: ${disease}`);

  const audio = new Audio(
    (
      await import(`../../assets/promoter/dna${index.padStart(3, "0")}.mp3`)
    ).default
  );

  context.createMediaElementSource(audio).connect(currGain);
  audio.play();
}

function getDiseaseIndex(disease: string): string | null {
  const row = CSV.find((entry) => entry.Disease === disease);
  return row ? row.index : null;
}
