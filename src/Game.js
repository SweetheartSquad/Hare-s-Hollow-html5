import Strand from "strand-core";
import assets from './assets';
import size from './size';
import script from "./assets/script.strand";
import Mouse from "./input-mouse";
import { incrementCounter, getStats } from './Database';

function preprocessScript(script) {
	let res = '';
	const chunks = script.split('~');
	for (let i = 0; i < chunks.length - 1; ++i) {
		const chunk = chunks[i];
		const idx = chunk.lastIndexOf("::");
		const genTitle = `AUTO_${i}`;
		chunks[i] = `${chunk}\n[[auto|${genTitle}]]\n::${genTitle}`;
	}
	window.script = chunks.join('\n');
	return chunks.join('\n');
}

let mouse;
class Game {
	constructor() {
		this.view = document.createElement('main');
		this.bg = document.createElement('img');
		this.bg.className = "bg";
		this.bg.draggable = false;
		this.avatar = document.createElement('img');
		this.avatar.className = "speaker";
		this.avatar.draggable = false;
		this.text = document.createElement('p');
		this.text.className = "text";
		this.options = document.createElement('nav');
		this.options.className = "options";

		this.view.appendChild(this.bg);
		this.view.appendChild(this.avatar);
		this.view.appendChild(this.text);
		this.view.appendChild(this.options);

		this.view.onmousedown = () => {
			if (!this.ready) {
				this.ready = true;
				for (const timeout of this.timeouts) {
					clearTimeout(timeout);
				}
				this.timeouts.length = 0;
				for (const child of this.text.children) {
					child.style.visibility = 'visible';
					child.style.animationName = 'text';
				}
				this.options.style.visibility = 'visible';
				return;
			}
			if (this.auto) {
				this.onClickAuto(this.auto);
			}
		};

		document.onkeydown = ({ keyCode }) => {
			if (keyCode === 27 ||
				keyCode === 80 ||
				keyCode === 13) {
				if (!this.strand.menu) {
					this.setBg(this.bg.src);
					this.strand.goto("menu")
						.then(this.showOptions);
				}
			} else if (keyCode === 32 && !this.skip) {
				this.skip = 1;
			}
		}
		document.onkeyup = ({ keyCode }) => {
			if (keyCode === 32) {
				this.skip = false;
			}
		}

		this.strand = new Strand({
			renderer: this,
			source: preprocessScript(script),
		});

		this.strand.goto("menu")
			.then(this.showOptions);

		this.startTime = Date.now();

		this.censored = true;
		this.timeouts = [];

		assets.audio.bgm.play()
		assets.audio.bgm.volume(0);
		assets.audio.bgm.loop(true);

		// mouse stuff
		mouse = new Mouse(this.view, true);
		this.mousePos = {
			x: 0,
			y: 0,
		};
		this.mouseEl = document.createElement("div");
		this.mouseEl.className = "mouse";
		this.view.appendChild(this.mouseEl);

		this.update();
	}

	showOptions = () => {
		this.options.style.visibility = 'visible';
	}

	update = () => {
		requestAnimationFrame(this.update);

		if (!document.pointerLockElement) {
			return;
		}

		let { x, y } = mouse.delta;

		this.mousePos.x += x;
		this.mousePos.y += y;

		const { width: bwidth, height: bheight } = document.body.getBoundingClientRect();
		const { top: ptop, left: pleft } = this.view.getBoundingClientRect();
		this.mousePos.x = Math.max(-pleft, Math.min(this.mousePos.x, bwidth));
		this.mousePos.y = Math.max(-ptop, Math.min(this.mousePos.y, bheight));

		// do the mouse thing
		if (this.options.children.length > 0 &&
			!this.strand.ATE &&
			this.options.lastChild.innerText.includes("Eat")) {
			console.log('do the mouse thing');
			const { top, left, width, height } = this.options.lastChild.getBoundingClientRect();
			let dx = left - pleft + width / 2 - this.mousePos.x;
			let dy = top - ptop + height / 2 - this.mousePos.y;
			const d = Math.sqrt(dx * dx + dy * dy);
			dx /= d;
			dy /= d;
			this.mousePos.x += (dx * 1.5 * Math.max(50, d) / 50 + Math.random() * 10 - 5) * this.strand.HUNGER;
			this.mousePos.y += (dy * 1.5 * Math.max(50, d) / 50 + Math.random() * 10 - 5) * this.strand.HUNGER;
		}

		for (let option of this.options.children) {
			const { top, left, width, height } = option.getBoundingClientRect();
			if (
				this.mousePos.x >= left - pleft &&
				this.mousePos.x <= left - pleft + width &&
				this.mousePos.y >= top - ptop &&
				this.mousePos.y <= top - ptop + height) {
				option.setAttribute('hover', true);
				if (mouse.isJustUp() && option.onclick) {
					option.onclick();
				}
			} else {
				option.setAttribute('hover', false);
			}
		}

		this.mouseEl.style.top = `${Math.floor(this.mousePos.y)}px`;
		this.mouseEl.style.left = `${Math.floor(this.mousePos.x)}px`;

		if (this.skip) {
			this.skip -= 1;
			if (this.skip <= 0) {
				this.skip = 5;
				this.view.onmousedown();
			}
		}

		mouse.update();
	}

	madeChoice(name, value) {
		incrementCounter(name, value);
	}

	onClickAuto = title => {
		this.strand.goto(title);
	}

	setBg(tex) {
		if (this.bg.src === tex) {
			return;
		}
		const oldBg = this.bg;
		this.bg = document.createElement('img');
		this.bg.className = "bg";
		this.bg.draggable = false;
		this.bg.src = tex;
		oldBg.style.opacity = 0;
		oldBg.parentNode.insertBefore(this.bg, oldBg);
		oldBg.addEventListener('transitionend', () => {
			oldBg.remove();
		});
		oldBg.addEventListener('webkittransitionend', () => {
			oldBg.remove();
		});
	}

	displayPassage(passage) {
		// cleanup
		while (this.options.lastChild) {
			this.options.removeChild(this.options.lastChild);
		}

		document.body.className = passage.title;

		let output = "";
		const program = this.strand.execute(passage.program);

		this.auto = null;
		for (let node of program) {
			switch (node.name) {
				case "text":
					output += node.value;
					break;
				case "action":
					if (node.value.text === "auto") {
						this.auto = node.value.action;
						break;
					}
					const a = document.createElement("a");
					a.innerHTML = node.value.text;
					a.href = "#";
					setTimeout(() => {
						a.onclick = () => {
							assets.audio.None.play();
							this.strand.eval(node.value.action);
						};
					}, 500);
					this.options.appendChild(a);
					break;
				default:
					throw new Error(
						`Unrecognized program node type: ${node.name}`
					);
			}
		}

		// greyed out option
		if (!this.strand.menu && this.options.children.length > 0 && this.strand.OPTION) {
			const a = document.createElement("a");
			a.className = "disabled";
			a.innerHTML = this.strand.OPTION;
			a.href = "#";
			a.onclick = () => {
				assets.audio.None.play();
			};
			this.options.appendChild(a);
		}

		if (this.strand.currentPassage.title === "menu") {
			assets.audio.bgm.fade(assets.audio.bgm.volume(), 1, 7000);

			// stats
			const a = document.createElement("a");
			a.className = "disabled";
			a.href = "#";
			a.onclick = () => {
				assets.audio.None.play();
			};
			if (this.strand.finished) {
				a.innerHTML = "Global Stats";
				getStats().then(stats => {
					a.className = "";
					a.onclick = () => {
						this.strand.stats = stats;
						this.strand.goto("Stats");
					};
				});
			} else {
				a.innerHTML = "???";
			}
			this.options.insertBefore(a, this.options.lastChild);
		}

		let tex;
		document.body.style.backgroundColor = this.strand.bg;
		if (this.censored) {
			tex = assets.textures[`CENSORED_${this.strand.portrait}`];
			if (!tex) {
				tex = assets.textures[this.strand.portrait];
			} else {
				document.body.style.backgroundColor = '#000000';
				document.body.className += " censored";
			}
		} else {
			tex = assets.textures[this.strand.portrait];
		}

		// bg transition
		this.setBg(tex);

		// parse text + speaker
		output = String(output).trim();
		const match = output.match(/(.*):([^]*)/);

		// speaker transition
		let speaker = this.speaker;
		if (match) {
			[, speaker, output] = match;
			tex = `url("${assets.textures[speaker] || assets.textures.TRANSPARENT}")`;
			if (this.avatar.style.backgroundImage !== tex) {
				const oldSpeaker = this.avatar;
				this.avatar = document.createElement('img');
				this.avatar.className = "speaker";
				this.avatar.draggable = false;
				this.avatar.style.backgroundImage = tex;
				this.avatar.style.opacity = 0;
				requestAnimationFrame(() => {
					this.avatar.style.opacity = '';
				});
				oldSpeaker.style.opacity = 0;
				oldSpeaker.parentNode.insertBefore(this.avatar, oldSpeaker);
				oldSpeaker.addEventListener('transitionend', () => {
					oldSpeaker.remove();
				});
				oldSpeaker.addEventListener('webkittransitionend', () => {
					oldSpeaker.remove();
				});
			}
		}
		this.speaker = speaker;

		output = output
			.trim()
			.split('')
			.map(t => `<span>${t}</span>`)
			.join('')
			.replace(/<span>\n<\/span>/g, "<br>")
			.replace(/\s/g, "&nbsp;");

		// text transition
		this.text.innerHTML = output;
		this.ready = false;
		this.options.style.visibility = 'hidden';
		const voice = assets.audio[this.speaker];
		Array.from(this.text.children).forEach((child, i) => {
			child.style.visibility = 'hidden';
			this.timeouts.push(setTimeout(() => {
				child.style.visibility = 'visible';
				child.style.animationName = 'text';
				if (voice && i % 2 == 0 && child.innerText.trim().length) {
					this.lasthowl = voice.play();
					voice.rate(child.innerText.codePointAt(0) / 178 + .75, this.lasthowl);
				}
				if (child === this.text.lastChild) {
					setTimeout(() => {
						this.ready = true;
						this.options.style.visibility = 'visible';
					}, 100);
				}
			}, i * 50));
		});

		return Promise.resolve();
	}

	showStats() {
		requestAnimationFrame(() => {
			const table = document.createElement("table");
			[
				["Stats", { Ate: "Ate", Spared: "Spared" }],
				...Object.entries(this.strand.stats)
			].map(([key, { Ate = 0, Spared = 0 }]) => {
				const tr = document.createElement("tr");
				[key, Ate, Spared]
				.map(text => {
					const td = document.createElement("td");
					td.innerText = text;
					return td;
				}).forEach(td => tr.appendChild(td));
				return tr;
			}).forEach(tr => table.appendChild(tr));
			this.text.appendChild(table);
			this.showOptions();
		});
	}

	fadeOut() {
		setTimeout(() => {
			assets.audio.bgm.fade(1, 0, 10000);
		}, 500);
	}
}

const game = new Game();
export default game;
