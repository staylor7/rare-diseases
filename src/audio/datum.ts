import { DatumNode } from "../types";

import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { TRANSITION_TIME } from "../constants";

export const CSV = await csv(csvUrl);

type DatumAudio = {
  element: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode;
  gainNode: GainNode;
};

const DATUM_AUDIOS = new Map<string, DatumAudio>();

let context: AudioContext;
let currChakra = "";
let masterGainNode: GainNode;

const stop = document.getElementById("stop");

stop?.addEventListener("click", () => {
  if (!context || !masterGainNode) return;
  fade(masterGainNode, 1, 0);
});

/**
 * Plays a chakra or disease sound according to the {@link DatumNode}
 */
export default function playDatum(d: DatumNode) {
  if (!context) context = new AudioContext(); // Initialize on first call, i.e. after user interaction (see https://goo.gl/7K7WLu)
  if (!masterGainNode) {
    masterGainNode = context.createGain();
    masterGainNode.connect(context.destination);
  }
  context.resume();
  masterGainNode.gain.value = 1;

  // Chakra/category
  const chakra = d.data.chakra;
  if (chakra) {
    if (chakra === currChakra) return; // Continue looping the same chakra
    fadeInChakra(chakra);
    if (currChakra) fadeOutChakra(currChakra);
    currChakra = chakra;
  }

  // Disease/promoter
  else if (d.data.name) playDisease(d.data.name);
  else console.error(`Invalid datum to play: ${d}`);
}

function fadeOutChakra(chakra: string) {
  const chakraAudio = DATUM_AUDIOS.get(chakra);
  if (!chakraAudio)
    throw new Error(`Chakra ${chakra} is not currently playing`);

  fade(chakraAudio.gainNode, 1, 0);
}

/**
 * Fades in the chakra audio
 */
async function fadeInChakra(chakra: string) {
  const element = new Audio(
    (await import(`../../assets/chakra/${chakra}.mp3`)).default
  );
  const gainNode = context.createGain();
  const sourceNode = context.createMediaElementSource(element);

  sourceNode.connect(gainNode);
  gainNode.connect(masterGainNode);

  fade(gainNode, 0, 1);
  element.play();
  element.loop = true;

  DATUM_AUDIOS.set(chakra, { element, sourceNode, gainNode });
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
 * Plays the disease audio
 */
async function playDisease(disease: string) {
  const diseaseAudio = DATUM_AUDIOS.get(disease);
  if (diseaseAudio) {
    diseaseAudio.element.currentTime = 0;
    diseaseAudio.element.play();
    return;
  }

  const index = getDiseaseIndex(disease);

  if (!index)
    return console.error(`Could not find row index for disease: ${disease}`);

  const element = new Audio(
    (
      await import(`../../assets/promoter/dna${index.padStart(3, "0")}.mp3`)
    ).default
  );

  const sourceNode = context.createMediaElementSource(element);
  const gainNode = context.createGain();

  sourceNode.connect(gainNode);
  gainNode.connect(masterGainNode);

  element.play();

  DATUM_AUDIOS.set(disease, { element, sourceNode, gainNode });
}

function getDiseaseIndex(disease: string): string | null {
  const row = CSV.find((entry) => entry.Disease === disease);
  return row ? row.index : null;
}
