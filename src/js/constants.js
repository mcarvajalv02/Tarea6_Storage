export const INDEXDB_NAME = "stickyNotesDB";
export const INDEXDB_VERSION = 1;
export const STORE_NAME = "notes";

// Datos de notas para sincronización
export const NotesData = {
  NOTES: []
};

// Sincroniza los datos de las notas con NotesData
export function syncNotesData(notes) {
  NotesData.NOTES.length = 0;

  notes.forEach((note) => {
    NotesData.NOTES.push(note);
  });
}
