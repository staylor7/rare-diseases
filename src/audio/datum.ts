import { DatumNode } from "../types";

import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { TRANSITION_TIME } from "../constants";

export const CSV = await csv(csvUrl);

let currentCategory = "";
let chakraContext: AudioContext;
let currentChakraGainNode: GainNode;

/**
 * Plays a chakra or disease sound according to the {@link DatumNode}
 */
export default function playDatum(d: DatumNode) {
  // Initialize on first call, i.e. after user interaction (see https://goo.gl/7K7WLu)
  if (!chakraContext) chakraContext = new AudioContext();
  if (!currentChakraGainNode)
    currentChakraGainNode = chakraContext.createGain();

  // Chakra/category
  if (d.depth === 1 && d.data.chakra) {
    if (d.data.name === currentCategory) return; // Ignore replaying the same category (continue looping)
    playChakra(d.data.chakra);
    currentCategory = d.data.name;
  }

  // Disease/promoter
  else if (d.depth === 2) playDisease(d.data.name);
  else console.error(`Invalid datum to play: ${d}`);
}

/**
 * Fades in the sound of the given chakra, fading out the current chakra sound if it exists
 */
async function playChakra(name: string) {
  const path = (await import(`../../assets/chakra/${name}.mp3`)).default;
  const audio = new Audio(path);
  const newGainNode = chakraContext.createGain();
  const source = chakraContext.createMediaElementSource(audio);

  newGainNode.connect(chakraContext.destination);
  source.connect(newGainNode);

  audio.loop = true;
  audio.play();

  fade(currentChakraGainNode, 1, 0);
  fade(newGainNode, 0, 1);

  currentChakraGainNode = newGainNode;
}

function fade(
  gainNode: GainNode,
  startVolume: number,
  endVolume: number,
  duration: number = TRANSITION_TIME
) {
  gainNode.gain.setValueAtTime(
    boundVolume(startVolume),
    chakraContext.currentTime
  );

  gainNode.gain.linearRampToValueAtTime(
    boundVolume(endVolume),
    chakraContext.currentTime + duration / 1000
  );
}

function boundVolume(volume: number) {
  return Math.min(Math.max(volume, 0), 1);
}

/**
 * Plays the sound for the given disease, overlapping any current audio
 */
async function playDisease(name: string) {
  const num = findDiseaseNum(name);

  if (!num) return console.error(`Disease row number not found: ${name}`);

  new Audio(
    (
      await import(`../../assets/promoter/dna${num.padStart(3, "0")}.mp3`)
    ).default
  ).play();
}

function findDiseaseNum(name: string) {
  const row = CSV.find((entry) => entry.Disease === name);
  return row ? row.index : null;
}
