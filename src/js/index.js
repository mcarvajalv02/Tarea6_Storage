import { DatabaseManager } from "./indexedDB.js"; // Import the IndexedDB database manager.

// Select DOM elements that will be used in the code.
const noteColorInput = document.querySelector("#noteColor"); // Selector for the note color input field.
const addInput = document.querySelector("#addButton"); // Selector for the button to add a new note.
const mainElement = document.querySelector("main"); // Selects the main container where notes will be displayed.

// Create an instance of the database and attempt to open it.
const dbManager = DatabaseManager.getInstance();
dbManager.open().then(() => {
  console.log("Database opened successfully");
  // Once the database is successfully opened, load all existing notes.
  dbManager.getAll().then(renderNotes); // `renderNotes` is a function that handles displaying the notes.
}).catch((error) => {
  console.error("Error opening the database:", error); 
});

let counterID = 0; 

// Event triggered when the "Add Note" button is clicked.
addInput.addEventListener("click", () => {
  const color = noteColorInput.value; // Get the note color from the input field.
  const noteData = {
    color,
    text: "", // Initialize the note text as empty.
    position: { x: 0, y: 0 }, // Initialize the note's position on the screen at (0, 0).
  };

  // Add the new note to the database.
  dbManager.add(noteData).then((id) => {
    noteData.id = id; // Assign a unique ID to the note after adding it.
    createNoteElement(noteData); // Create the visual element for the note on the screen.
    counterID++; // Increment the ID counter.
  }).catch((error) => {
    console.error("Error adding the note:", error); 
  });
});

// Event to listen for clicks in the document to delete a note.
document.addEventListener("click", (event) => {
  if (event.target.classList.contains('delete')) { // If the click is on the delete button.
    const noteElement = event.target.closest('.note'); // Find the container of the note to be deleted.
    const noteId = parseInt(noteElement.dataset.id, 10); // Get the ID of the note to be deleted.
    dbManager.delete(noteId).then(() => {
      noteElement.remove(); // If deletion is successful, remove the note from the DOM.
    }).catch((error) => {
      console.error("Error deleting the note:", error); 
    });
  }
});

// Variables to store information about the state of notes being moved.
let cursor = { 
  x: null, 
  y: null 
};
let note = { 
  dom: null, 
  x: null, 
  y: null 
};
let zIndexValue = 0; // zIndex value to ensure the note stays on top while being moved.

// Event to detect the start of note movement.
document.addEventListener("mousedown", (event) => {
  if (event.target.classList.contains('noteHeader')) { // If the click is on a note's header.
    cursor = { x: event.clientX, y: event.clientY }; // Save the cursor's position when movement starts.
    const current = event.target.closest('.note'); // Find the note being moved.
    note = {
      dom: current, // Save the DOM of the note.
      x: current.getBoundingClientRect().left, // Save the original position of the note.
      y: current.getBoundingClientRect().top,
    };
    current.style.cursor = "grabbing"; // Change the cursor to indicate movement.
    current.style.zIndex = zIndexValue; // Ensure the note stays on top during movement.
    zIndexValue++; // Increment the zIndex for the next note to be moved.
  }
});

// Event to update the position of the note while the cursor moves.
document.addEventListener("mousemove", (event) => {
  if (note.dom == null) return; // If no note is being moved, do nothing.

  const currentCursor = { 
    x: event.clientX, 
    y: event.clientY 
  };
  const distance = { 
    x: currentCursor.x - cursor.x, 
    y: currentCursor.y - cursor.y 
  };
  // Update the position of the note as the mouse moves.
  note.dom.style.left = (note.x + distance.x) + "px";
  note.dom.style.top = (note.y + distance.y) + "px";
});

// Event triggered when the mouse button is released to finish moving the note.
document.addEventListener("mouseup", (event) => {
  if (note.dom) {
    const noteId = parseInt(note.dom.dataset.id, 10); // Get the note's ID.
    const position = {
      x: parseInt(note.dom.style.left, 10), // Get the note's new position.
      y: parseInt(note.dom.style.top, 10),
    };
    // Update the note's position in the database.
    dbManager.get(noteId).then((noteData) => {
      noteData.position = position; // Update the note's position data.
      dbManager.update(noteData); // Update the note in the database.
    }).catch((error) => {
      console.error("Error updating the note's position:", error); 
    });
    note.dom = null; // Reset the note being moved.
    event.target.parentNode.style.cursor = "grab"; // Restore the cursor to its original style.
  }
});

// Function to create a visual element for the note and add it to the DOM.
function createNoteElement(noteData) {
  const newNote = document.createElement("div");
  newNote.classList.add("note");
  newNote.dataset.id = noteData.id; // Assign the note's ID to the element.

  // Create the note header with a delete button.
  const noteHeader = document.createElement("div");
  noteHeader.classList.add("noteHeader");
  noteHeader.innerHTML = `<button class="delete">X</button>`; // Button to delete the note.
  noteHeader.style.background = noteData.color; // Assign the background color to the note.
  newNote.appendChild(noteHeader);

  // Create the note content, a text area for editing the note's text.
  const noteContent = document.createElement("div");
  noteContent.classList.add("noteContent");
  noteContent.innerHTML = `<textarea name="noteText" id="noteText">${noteData.text}</textarea>`; // Insert the note's text.
  newNote.appendChild(noteContent);

  // Set the note's initial position.
  newNote.style.left = `${noteData.position.x}px`;
  newNote.style.top = `${noteData.position.y}px`;

  mainElement.appendChild(newNote); // Add the new note to the main container.

  // Event listener to detect changes in the text area and save them.
  const textarea = newNote.querySelector("textarea");
  textarea.addEventListener("input", () => {
    noteData.text = textarea.value; // Update the note's text.
    dbManager.update(noteData).catch((error) => {
      console.error("Error updating the note's text:", error); // Log an error if the update fails.
    });
  });
}

// Function to display all stored notes.
function renderNotes(notes) {
  notes.forEach((note) => {
    createNoteElement(note); // Create and add each note to the DOM.
  });
}
