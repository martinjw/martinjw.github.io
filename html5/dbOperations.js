// dbOperations.js

class CountryDatabase {
    constructor() {
        this.dbName = "CountryDb";
        this.dbVersion = 1;
        this.storeName = "Countries";
    }

    async openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => this.initializeDb(event.target.result);

            request.onerror = (event) => {
                console.error("Database error: ", event.target.error);
                reject("Failed to open DB");
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    initializeDb(db) {
        if (db.objectStoreNames.contains(this.storeName)) {
            db.deleteObjectStore(this.storeName);
        }

        const countryStore = db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
        countryStore.createIndex("by_name", "LowerCaseName", { unique: false });

        const countries = [
            { Name: "Australia", ShortName: "AU", LowerCaseName: "Australia".toLowerCase() },
            { Name: "Belgium", ShortName: "BE", LowerCaseName: "Belgium".toLowerCase() },
            { Name: "Brazil", ShortName: "BR", LowerCaseName: "Brazil".toLowerCase() },
            { Name: "Canada", ShortName: "CA", LowerCaseName: "Canada".toLowerCase() },
            { Name: "China", ShortName: "CN", LowerCaseName: "China".toLowerCase() },
            // Add more countries as needed...
        ];

        countries.forEach(country => countryStore.add(country));
    }

    async fetchAllCountries() {
        const db = await this.openDb();
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
            const getAllRequest = store.getAll();

            getAllRequest.onerror = (event) => {
                console.error("Error fetching countries: ", event.target.error);
                reject("Failed to fetch countries");
            };

            getAllRequest.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    async searchCountriesByNamePrefix(namePrefix) {
        const db = await this.openDb();
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("by_name");
        const lowercasedPrefix = namePrefix.toLowerCase();
        const range = IDBKeyRange.bound(lowercasedPrefix, lowercasedPrefix + '\uffff');
        return new Promise((resolve, reject) => {
            const cursorRequest = index.openCursor(range);
            const results = [];
            let count = 0;

            cursorRequest.onerror = (event) => {
                console.error("Error searching countries: ", event.target.error);
                reject("Failed to search countries");
            };

            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < 100) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }

    async updateCountryName(id, newName) {
        const db = await this.openDb();
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);

            getRequest.onerror = (event) => {
                console.error("Error fetching country: ", event.target.error);
                reject("Failed to fetch country");
            };

            getRequest.onsuccess = (event) => {
                const data = event.target.result;
                data.Name = newName;
                data.LowerCaseName = newName.toLowerCase();

                const putRequest = store.put(data);
                putRequest.onerror = (event) => {
                    console.error("Error updating country: ", event.target.error);
                    reject("Failed to update country");
                };

                putRequest.onsuccess = () => {
                    resolve("Country updated successfully");
                };
            };
        });
    }

    async addCountry(name, shortName) {
        const db = await this.openDb();
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("by_name");
        return new Promise((resolve, reject) => {
            const checkExistRequest = index.get(name.toLowerCase());

            checkExistRequest.onerror = (event) => {
                console.error("Error checking country existence: ", event.target.error);
                reject("Failed to check if country exists");
            };

            checkExistRequest.onsuccess = (event) => {
                if (event.target.result) {
                    reject("Country already exists");
                } else {
                    const addRequest = store.add({ Name: name, ShortName: shortName, LowerCaseName: name.toLowerCase() });

                    addRequest.onerror = (event) => {
                        console.error("Error adding country: ", event.target.error);
                        reject("Failed to add country");
                    };

                    addRequest.onsuccess = () => {
                        resolve("Country added successfully");
                    };
                }
            };
        });
    }
}

// Expose the CountryDatabase class to be used in the global scope
window.dbOperations = new CountryDatabase();
