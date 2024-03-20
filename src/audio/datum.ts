import { DatumNode } from "../types";
import { TRANSITION_TIME } from "../sunburst";
import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { isPlaying as IS_VIOLA_PLAYING } from "./viola";

export const CSV = await csv(csvUrl);

let currentChakra = "";
let currentChakraAudio: HTMLAudioElement;
let chakraContext: AudioContext;
let currentChakraGainNode: GainNode;
let inactivityTimeout = setInactivityTimeout();
// const loopTimeout = setLoopTimeout();

/**
 * Plays a chakra or disease sound according to the {@link DatumNode}
 * Ignores if viola is playing
 */
export default function playDatum(d: DatumNode) {
  if (IS_VIOLA_PLAYING) return;
  init();

  // Chakra
  if (d.depth === 1 && d.data.chakra) {
    if (d.data.name === currentChakra) return;
    playChakra(d.data.chakra);
    currentChakra = d.data.name;
  }
  // Disease
  else if (d.depth === 2) playDisease(d.data.name);
  else console.error(`Invalid datum to play: ${d}`);
}

function init() {
  if (!chakraContext) chakraContext = new AudioContext();
  if (!currentChakraGainNode)
    currentChakraGainNode = chakraContext.createGain();

  clearTimeout(inactivityTimeout);
  inactivityTimeout = setInactivityTimeout();
}

function setInactivityTimeout() {
  if (!currentChakraAudio) return;
  return setTimeout(() => {
    currentChakraAudio.pause();
    chakraContext.close();
  }, 1000 * currentChakraAudio.duration);
}

// function setLoopTimeout() {
//   if (!currentChakraAudio) return;
//   return setTimeout(() => {
//     playChakra(currentChakra);
//   }, 1000 * currentChakraAudio.duration);
// }

async function playChakra(name: string) {
  init();

  const path = (await import(`../../assets/chakra/${name}.mp3`)).default;
  currentChakraAudio = new Audio(path);

  const newGainNode = chakraContext.createGain();
  const source = chakraContext.createMediaElementSource(currentChakraAudio);

  newGainNode.connect(chakraContext.destination);
  source.connect(newGainNode);
  currentChakraAudio.play();

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

export function pause() {
  currentChakra = "";
  if (currentChakraGainNode) fade(currentChakraGainNode, 1, 0);
  if (currentChakraAudio)
    setTimeout(() => currentChakraAudio.pause(), TRANSITION_TIME);
}
