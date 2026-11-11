# Materiais e dependências

Os samples de pandeiro e os dois catálogos de ritmos vieram dos anexos do usuário. Os nomes das fontes bibliográficas foram preservados no catálogo; não foram incluídos livros, PDFs ou vídeos de métodos.

React, React Native, React Native Web, Expo, react-native-svg e @siteed/audio-studio usam suas respectivas licenças distribuídas nos pacotes npm (predominantemente MIT). O lockfile identifica as versões utilizadas. O código de bibliotecas permanece nos pacotes oficiais; não há um fork desses projetos.

Inter Tight, JetBrains Mono e Cormorant Garamond são distribuídas sob a SIL Open Font License 1.1. As licenças dos arquivos de fonte usados na exportação estão em `licenses/`.

Os símbolos musicais usam contornos da Bravura, de Steinberg Media Technologies, sob a SIL Open Font License 1.1. A fonte original não modificada está em `assets/fonts/Bravura.otf`; a licença em `licenses/Bravura-OFL.txt`. `tools/build-glyphs.py` extrai 19 glifos SMuFL para `src/data/music-glyphs.json`. O app desenha esses contornos em SVG e não depende de fontes musicais instaladas no aparelho. Origem: https://github.com/steinbergmedia/bravura.
