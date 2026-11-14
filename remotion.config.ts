import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// WebGL (Three.js) butuh renderer GPU/ANGLE saat render headless
Config.setChromiumOpenGlRenderer('angle');
