const AUDIO = <HTMLAudioElement>document.getElementById("viola");
if (!AUDIO) throw new Error("No container found with the ID 'viola'");

let intervalId = "";
let currentTime = 0;

AUDIO.addEventListener("play", handlePlay);
AUDIO.addEventListener("pause", () => {
  console.log(`Pausing playback at ${AUDIO.currentTime}s`);
  clearInterval(intervalId);
});

function handlePlay() {
  console.log(`Starting playback: ${AUDIO.duration - currentTime}s remaining`);

  intervalId = String(
    setInterval(() => {
      currentTime = AUDIO.currentTime;
      console.log(`Current time: ${currentTime}s`);
      if (AUDIO.duration - currentTime < 1) clearInterval(intervalId);
    }, 1000)
  );
}
