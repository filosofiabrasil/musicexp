"""WAV de teste para o dispositivo de captura virtual do Chromium; sem simular eventos de golpes."""
import json
import base64
import wave
from pathlib import Path

root = Path(__file__).resolve().parent.parent
kit = json.loads((root / 'src/data/kit.json').read_text())
rate = kit['rate']
output = root / '.test-fixtures/microphone-fixture.wav'
output.parent.mkdir(exist_ok=True)
with wave.open(str(output), 'wb') as wav:
    wav.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    wav.writeframes(bytes(rate * 2))
    for _ in range(3):
        for kind in ['grave', 'dedos', 'tapa', 'punho']:
            pcm = base64.b64decode(kit['samples'][kind])
            wav.writeframes(pcm + bytes(max(0, int(rate * .8) * 2 - len(pcm))))
print(output)
