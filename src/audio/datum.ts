import { csv } from "d3";
import { DatumNode } from "../types";
import { TRANSITION_TIME } from "../sunburst";
import csvUrl from "/seq.d3.csv?url";

const CSV = await csv(csvUrl);

let currentChakra = "";

const chakraContext = new AudioContext();
let currentChakraGainNode = chakraContext.createGain();

/**
 * Fades in a new chakra/category sound, fading out the current chakra sound if it exists
 * If the current sound is the same, ignores and continues looping
 */
export async function playChakra(chakraName: string) {
  if (chakraName === currentChakra) return;

  const path = (await import(`../../assets/chakra/${chakraName}.mp3`)).default;
  const audio = new Audio(path);
  const newGainNode = chakraContext.createGain();
  const source = chakraContext.createMediaElementSource(audio);

  newGainNode.connect(chakraContext.destination);
  source.connect(newGainNode);

  audio.loop = true;
  audio.play();

  fade(currentChakraGainNode, 1, 0);
  fade(newGainNode, 0, 1);

  currentChakra = chakraName;
  currentChakraGainNode = newGainNode;
}

/**
 * Plays a new disease sound, overlapping the current disease sound if it exists
 */
async function playDisease(diseaseName: string) {
  const num = findDiseaseNum(diseaseName);

  if (!num)
    return console.error(`Disease row number not found: ${diseaseName}`);

  new Audio(
    (
      await import(`../../assets/promoter/dna${num.padStart(3, "0")}.mp3`)
    ).default
  ).play();
}

export default function playDatum(d: DatumNode) {
  // Chakra/category
  if (d.depth === 1) {
    if (d.data.chakra) playChakra(d.data.chakra);
    else console.error(`Datum does not have a chakra: ${d}`);
  }
  // Disease/promoter
  else if (d.depth === 2) playDisease(d.data.name);
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

function findDiseaseNum(diseaseName: string) {
  const row = CSV.find((entry) => entry.Disease === diseaseName);
  return row ? row.index : null;
}
