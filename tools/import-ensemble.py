"""Import a curated subset of the aligned bank: python tools/import-ensemble.py /path/to/samba-alinhado"""
from pathlib import Path
import sys,json,subprocess,base64,hashlib
root=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]);manifest=json.loads((source/'alinhamento.json').read_text());rows={r['file']:r for r in manifest['files']}
selection=[
('surdo84','Surdo', 'surdo','80 a 100 bpm/Surdo Levada b 84bmp.wav'),
('base84','Levada de pandeiro','pandeiro','80 a 100 bpm/Pandeiro Levada 84bpm.wav'),
('virada84','Virada B','pandeiro','80 a 100 bpm/Pandeiro virada b 84bpm.wav'),
('curta84','Virada curta H','pandeiro','80 a 100 bpm/Pandeiro virada h 84bpm.wav'),
('breque84','Breque','pandeiro','80 a 100 bpm/Pandeiro Breque 84bpm.wav'),
('final84','Final com ressonância','pandeiro','80 a 100 bpm/Pandeiro Final 84bpm.wav'),
('surdo92','Surdo','surdo','90 a 150 bpm/surdo levada a 92bpm.wav'),
('agogo92','Agogô','agogo','90 a 150 bpm/agogo levada a 92bpm.wav'),
('reco92','Reco-reco','reco','90 a 150 bpm/reco reco levada a 92bpm.wav'),
('base92','Levada de couro','pandeiro','90 a 150 bpm/pandeiro couro levada a 92bpm.wav'),
('nylon92','Levada de nylon','pandeiro','90 a 150 bpm/pandeiro nylon levada b 92bpm.wav'),
('virada92','Virada de couro','pandeiro','90 a 150 bpm/pandeiro couro virada a 92bpm.wav'),
('curta92','Virada curta de nylon','pandeiro','90 a 150 bpm/pandeiro nylon virada a 92bpm.wav'),
('final92','Final de nylon','pandeiro','90 a 150 bpm/pandeiro nylon final 92bpm.wav'),
]
clips=[]
for id,title,instrument,file in selection:
 r=rows[file];assert r['durationVerified'] and r['candidateBeatsSource']=='ACID'
 path=source/'audio'/file;assert hashlib.sha256(path.read_bytes()).hexdigest()==r['outputSha256']
 pcm=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','s16le','-acodec','pcm_s16le','-'],capture_output=True,check=True).stdout
 assert len(pcm)//2==r['frames']
 clips.append(dict(id=id,title=title,instrument=instrument,role=r['role'],bpm=r['namedBpm'],beats=r['targetBeats'],frames=r['frames'],source=file,sourceSha256=r['sourceSha256'],alignedSha256=r['outputSha256'],pcmSha256=hashlib.sha256(pcm).hexdigest(),credits=r['tags'],pcm=base64.b64encode(pcm).decode()))
(root/'src/data/ensemble.json').write_text(json.dumps({'rate':44100,'version':1,'clips':clips},ensure_ascii=False,separators=(',',':')))
print('Imported',len(clips),'aligned clips')
