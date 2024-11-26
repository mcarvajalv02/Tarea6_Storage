import { INDEXDB_NAME, INDEXDB_VERSION, STORE_NAME, NotesData, syncNotesData } from "./constants.js";

class DatabaseManager {
  constructor(databaseName, databaseVersion) {
    this.databaseName = databaseName;
    this.databaseVersion = databaseVersion;
    this.db = null;
  }

  // Static method to get a singleton instance of DatabaseManager
  static getInstance() {
    if (!this.instance) {
      this.instance = new DatabaseManager(INDEXDB_NAME, INDEXDB_VERSION);
    }
    return this.instance;
  }

  // Method to open the IndexedDB database
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.databaseVersion);

      // Success handler for database open
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      // Error handler for database open
      request.onerror = (event) => {
        reject(event.target.error);
      };

      // Upgrade needed handler, called when the database needs to be initialized or upgraded
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  // Method to add a new note to the database
  add(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(data);

      // Resolve with the generated ID when the operation is successful
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Method to retrieve a note by its ID
  get(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Method to retrieve all notes from the database
  getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event) => {
        const notes = event.target.result;
        // Synchronize notes data with NotesData
        syncNotesData(notes);

        // You can access NotesData here to perform additional operations
        console.log("NOTES:", NotesData.NOTES);
        resolve(notes);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Method to update an existing note
  update(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Method to delete a note by its ID
  delete(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Method to clear all notes from the database
  clear() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

export { DatabaseManager };
