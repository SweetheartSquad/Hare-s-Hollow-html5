import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
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
	const database = getDatabase();
} catch (err) {
	console.error(
		'Failed to init database',
		err
	);
}

export function incrementCounter(counter, value) {
	const ref = database.ref(`${counter}/${value}`);
	return ref.transaction(count => count + 1);
}

export function getStats() {
	return database.ref().once('value')
		.then(snapshot => snapshot.val());
}
