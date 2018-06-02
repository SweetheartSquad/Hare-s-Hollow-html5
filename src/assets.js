import { Howl } from 'howler';
import * as textures from './assets/textures/textures';
import * as audio from './assets/audio/audio';

const howls = {};
for(const key in audio){
	howls[key] = new Howl({
		src: [audio[key]]
	});
}

export default {
	textures,
	audio: howls,
};
