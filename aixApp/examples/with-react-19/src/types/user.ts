/** User as stored in Firestore (without password). */
export interface FirestoreUser {
  id: string;
  userid: string;
  name: string;
}
