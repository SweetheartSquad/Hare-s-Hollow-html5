import { initializeApp } from "firebase/app";
import { get, getDatabase, ref, runTransaction } from "firebase/database";

/** @type {import('firebase/database').Database} */
let database;
try {
	const config = {
		apiKey: "AIzaSyDsq8W-7fmrcdk8nqYoNCEo60g-yKB6ubM",
		authDomain: "hares-hollow-stats.firebaseapp.com",
		databaseURL: "https://hares-hollow-stats.firebaseio.com",
		projectId: "hares-hollow-stats",
		storageBucket: "hares-hollow-stats.appspot.com",
		messagingSenderId: "189064406199"
	};
	initializeApp(config);
	database = getDatabase();
} catch (err) {
	console.error(
		'Failed to init database',
		err
	);
}

export function incrementCounter(counter, value) {
	return runTransaction(ref(database, counter), post => {
		if (post) {
			post[value] += 1;
		}
		return post;
	});
}

export function getStats() {
	return get(ref(database)).then((snapshot) => snapshot.val());
}
