import {
  LegacyEventEmitter,
  requireOptionalNativeModule,
} from "expo-modules-core";
import { Microphone, PcmCallback } from "./microphone.types";
type NativeAudio = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  startRecording: (config: object) => Promise<{ sampleRate?: number }>;
  stopRecording: () => Promise<unknown>;
};
/** Carregado somente ao pedir microfone. Expo Go continua funcionando no modo toque. */
export async function startMicrophone(
  onPcm: PcmCallback,
  onEnded: () => void,
): Promise<Microphone> {
  const module = requireOptionalNativeModule<NativeAudio>("AudioStudio");
  if (!module)
    throw new Error(
      "Microfone ao vivo exige um development build. Use npm run android:build ou npm run ios:build. O toque funciona no Expo Go.",
    );
  const permission = await module.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Acesso ao microfone negado. Libere a permissão nas configurações.",
    );
  const emitter = new LegacyEventEmitter(module as never);
  let epoch = performance.now() / 1000,
    count = 0,
    rate = 16000;
  const subscription = emitter.addListener<{
    pcmFloat32?: Float32Array | number[];
  }>("AudioData", (event) => {
    if (!event.pcmFloat32) return;
    const samples = new Float32Array(event.pcmFloat32);
    // Ancoragem no início da captura; compensação manual cobre atraso fixo do dispositivo.
    onPcm(samples, rate, epoch + count / rate);
    count += samples.length;
  });
  const interruption = emitter.addListener("onRecordingInterrupted", onEnded);
  try {
    epoch = performance.now() / 1000;
    const result = await module.startRecording({
      sampleRate: 16000,
      channels: 1,
      encoding: "pcm_16bit",
      streamFormat: "float32",
      interval: 20,
      bufferDurationSeconds: 0.02,
      enableProcessing: false,
      keepAwake: false,
      showNotification: false,
      output: { primary: { enabled: false } },
      autoResumeAfterInterruption: false,
    });
    rate = result.sampleRate || 16000;
    return {
      stop: async () => {
        subscription.remove();
        interruption.remove();
        await module.stopRecording();
      },
    };
  } catch (error) {
    subscription.remove();
    interruption.remove();
    throw error;
  }
}
