import { DatumNode } from "../types";
import { TRANSITION_TIME } from "../sunburst";
import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";

export const CSV = await csv(csvUrl);

let currentCategory = "";
let chakraContext: AudioContext;
let currentChakraGainNode: GainNode;
let inactivityTimer: ReturnType<typeof setTimeout>;
let currentAudio: HTMLAudioElement;

/**
 * Initializes the audio context on first call.
 */
function initAudioContext() {
  if (!chakraContext) chakraContext = new AudioContext();
  if (!currentChakraGainNode) currentChakraGainNode = chakraContext.createGain();
}

/**
 * Resets the inactivity timer.
 */
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    if (currentAudio) currentAudio.pause(); // Stop current audio on inactivity
  }, TRANSITION_TIME + 5000); // Adjust time according to requirements
}

/**
 * Plays a chakra or disease sound according to the {@link DatumNode}
 */
export default function playDatum(d: DatumNode) {
  initAudioContext();
  resetInactivityTimer();

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
 * Fades in the sound of the given chakra, fading out the current chakra sound if it exists.
 */
interface CurrentSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

let currentSource: CurrentSource | null = null; // Initialize as null


async function playChakra(name: string, startTime = 0) {
  if (!chakraContext) chakraContext = new AudioContext();

  // Load the audio file into an AudioBuffer
  const response = await fetch(`../../assets/chakra/${name}.mp3`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await chakraContext.decodeAudioData(arrayBuffer);

  // Create a new AudioBufferSourceNode for each play
  const source = chakraContext.createBufferSource();
  source.buffer = audioBuffer;

  // Create a new GainNode for volume control
  const newGainNode = chakraContext.createGain();
  source.connect(newGainNode);
  newGainNode.connect(chakraContext.destination);

  // Calculate fade duration and overlap
  let duration = audioBuffer.duration;
  let fadeDuration = TRANSITION_TIME / 1000; // Transition time in seconds
  let overlap = fadeDuration / 2; // Overlap duration for crossfade

  // Schedule the fade in for the new source
  newGainNode.gain.setValueAtTime(0, chakraContext.currentTime + startTime);
  newGainNode.gain.linearRampToValueAtTime(1, chakraContext.currentTime + startTime + overlap);

  // Schedule the fade out to start at duration - overlap
  if (currentSource !== null) {
    let currentGainNode = currentSource.gainNode;
    currentGainNode.gain.setValueAtTime(1, chakraContext.currentTime);
    currentGainNode.gain.linearRampToValueAtTime(0, chakraContext.currentTime + overlap);
    currentSource.source.stop(chakraContext.currentTime + overlap); // Stop the previous source after fade out
  }

  // Update the current source tracking
  currentSource = { source: source, gainNode: newGainNode };

  // Start the new source
  source.start(chakraContext.currentTime + startTime);

  // Prepare the next loop
  setTimeout(() => {
    playChakra(name, -overlap); // Start the next loop with an overlap
  }, (duration - overlap) * 900); // Convert seconds to milliseconds
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
