let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
	const db = event.target.result;

	db.createObjectStore("pendingTransactions", {
		keyPath: "pendingID",
		autoIncrement: true,
	});
};

request.onsuccess = function (event) {
	db = event.target.result;

	if (navigator.onLine) {
		checkDatabase();
	}
};

request.onerror = function (event) {
	console.log(event);
};

function saveRecord(record) {
	const transaction = db.transaction(["pendingTransactions"], "readwrite");
	const store = transaction.objectStore("pendingTransactions");

	store.add(record);
}

function checkDatabase() {
	const transaction = db.transaction(["pendingTransactions"], "readwrite");
	const store = transaction.objectStore("pendingTransactions");
	const getAll = store.getAll();

	getAll.onsuccess = function () {
		if (getAll.result.length > 0) {
			fetch("/api/transaction/bulk", {
				method: "POST",
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
				.then((response) => response.json())
				.then(() => {
					const transaction = db.transaction(
						["pendingTransactions"],
						"readwrite"
					);
					const store = transaction.objectStore("pendingTransactions");
					store.clear();
				});
		}
	};
}

window.addEventListener("online", checkDatabase);
