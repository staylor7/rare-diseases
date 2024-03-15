import { csv } from "d3";
import { DatumNode } from "../types";
import { TRANSITION_TIME } from "../sunburst";
import csvUrl from "/seq.d3.csv?url";

const CSV = await csv(csvUrl);

let currentCategory = "";

const CHAKRA_CONTEXT = new AudioContext();
let currentChakraGainNode = CHAKRA_CONTEXT.createGain();

export default function playDatum(d: DatumNode) {
  if (d.depth === 1 && d.data.chakra) {
    if (d.data.name === currentCategory) return; // Ignore replaying same category (continue looping)
    playChakra(d.data.chakra);
    currentCategory = d.data.name;
  } else if (d.depth === 2) playDisease(d.data.name);
  else console.error(`Invalid datum to play: ${d}`);
}

/**
 * Fades in a new chakra/category sound, fading out the current chakra sound if it exists
 */
async function playChakra(name: string) {
  const path = (await import(`../../assets/chakra/${name}.mp3`)).default;
  const audio = new Audio(path);
  const newGainNode = CHAKRA_CONTEXT.createGain();
  const source = CHAKRA_CONTEXT.createMediaElementSource(audio);

  newGainNode.connect(CHAKRA_CONTEXT.destination);
  source.connect(newGainNode);

  audio.loop = true;
  audio.play();

  fade(currentChakraGainNode, 1, 0);
  fade(newGainNode, 0, 1);

  currentChakraGainNode = newGainNode;
}

/**
 * Plays a new disease sound, overlapping the current disease sound if it exists
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

function fade(
  gainNode: GainNode,
  startVolume: number,
  endVolume: number,
  duration: number = TRANSITION_TIME
) {
  gainNode.gain.setValueAtTime(
    boundVolume(startVolume),
    CHAKRA_CONTEXT.currentTime
  );

  gainNode.gain.linearRampToValueAtTime(
    boundVolume(endVolume),
    CHAKRA_CONTEXT.currentTime + duration / 1000
  );
}

function boundVolume(volume: number) {
  return Math.min(Math.max(volume, 0), 1);
}

function findDiseaseNum(name: string) {
  const row = CSV.find((entry) => entry.Disease === name);
  return row ? row.index : null;
}
