type LoadablePlayer = {
  isLoaded: boolean;
  addListener: (
    event: "playbackStatusUpdate",
    callback: (status: { isLoaded: boolean }) => void,
  ) => { remove: () => void };
};

/** Cancelar a preparação também libera o listener e o timeout do player antigo. */
export function waitForAudioLoad(player: LoadablePlayer, timeoutMs = 12000) {
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let subscription: { remove: () => void } | undefined;
  let resolve!: (loaded: boolean) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<boolean>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  const finish = (loaded: boolean, error?: Error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    subscription?.remove();
    if (error) reject(error);
    else resolve(loaded);
  };
  if (player.isLoaded) finish(true);
  else {
    subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded) finish(true);
    });
    if (settled) subscription.remove();
    else
      timer = setTimeout(
        () =>
          finish(
            false,
            new Error("Não foi possível carregar o áudio. Tente reiniciar."),
          ),
        timeoutMs,
      );
  }
  return { promise, cancel: () => finish(false) };
}
