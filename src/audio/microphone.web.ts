import { Microphone, PcmCallback } from "./microphone.types";
/** AudioWorklet fornece timestamps do fluxo, sem depender da entrega da mensagem. */
export async function startMicrophone(
  onPcm: PcmCallback,
  onEnded: () => void,
): Promise<Microphone> {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error("O microfone precisa de HTTPS ou localhost.");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  let context: AudioContext | null = null;
  let url: string | null = null;
  try {
    context = new AudioContext();
    await context.resume();
    url = URL.createObjectURL(
      new Blob(
        [
          `class PCM extends AudioWorkletProcessor {
      process(inputs) { const samples=inputs[0]?.[0]; if(samples) this.port.postMessage({samples: new Float32Array(samples), time: currentTime}); return true; }
    } registerProcessor('pandeiro-pcm',PCM);`,
        ],
        { type: "text/javascript" },
      ),
    );
    await context.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    url = null;
    const source = context.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(context, "pandeiro-pcm");
    const silent = context.createGain();
    silent.gain.value = 0;
    const epoch = performance.now() / 1000 - context.currentTime;
    let stopped = false;
    const ended = () => {
      if (!stopped) onEnded();
    };
    worklet.port.onmessage = ({
      data,
    }: MessageEvent<{ samples: Float32Array; time: number }>) => {
      if (!stopped) onPcm(data.samples, context!.sampleRate, epoch + data.time);
    };
    source.connect(worklet);
    worklet.connect(silent);
    silent.connect(context.destination);
    stream
      .getTracks()
      .forEach((track) => track.addEventListener("ended", ended));
    return {
      stop: async () => {
        if (stopped) return;
        stopped = true;
        worklet.port.onmessage = null;
        source.disconnect();
        worklet.disconnect();
        stream.getTracks().forEach((track) => {
          track.removeEventListener("ended", ended);
          track.stop();
        });
        if (context!.state !== "closed") await context!.close();
      },
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    if (url) URL.revokeObjectURL(url);
    if (context && context.state !== "closed") await context.close();
    throw error;
  }
}
