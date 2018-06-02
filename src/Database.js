import firebase from "firebase/app";
import "firebase/database";
var config = {
	apiKey: "AIzaSyDsq8W-7fmrcdk8nqYoNCEo60g-yKB6ubM",
	authDomain: "hares-hollow-stats.firebaseapp.com",
	databaseURL: "https://hares-hollow-stats.firebaseio.com",
	projectId: "hares-hollow-stats",
	storageBucket: "hares-hollow-stats.appspot.com",
	messagingSenderId: "189064406199"
};
firebase.initializeApp(config);
const database = firebase.database();

export function incrementCounter(counter, value) {
	const ref = database.ref(`${counter}/${value}`);
	return ref.transaction(count => count + 1);
}

export function getStats() {
	return database.ref().once('value')
		.then(snapshot => snapshot.val());
}
