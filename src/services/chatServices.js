import { getDownloadURL, uploadBytes, ref } from "firebase/storage";
import { auth, firestore as db, storage } from "../config/firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  arrayUnion,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  where,
  query,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";

// Función para crear nuevo usuario.
export const createUserAsync = async (creds) => {
  try {
    const user = {
      username: creds.username,
      email: creds.email,
      desc: "",
      profile: "",
      createdAt: serverTimestamp(),
    };
    return await setDoc(doc(db, "users", creds.uid), user);
  } catch (error) {
    console.log(error);
  }
};

// Función para actualizar los datos del usuario.
export const updateUserAsync = async (updatedUser, profileImage) => {
  try {
    const creds = auth.currentUser;
    const userDoc = doc(db, "users", creds.uid);

    // Aquí actualizamos la imagen del usuario (Avatar).
    if (profileImage) {
      const location = `/images/users/${creds.uid}/profile/`;
      const urls = await uploadFiles([profileImage], location);
      if (urls.length > 0) {
        updatedUser.profile = urls[0];
        await updateProfile(creds, {
          photoURL: urls[0].url,
          displayName: updatedUser.username,
        });
      }
    }
    await updateDoc(userDoc, updatedUser);
    const snapshot = await getDoc(userDoc);
    return getSnapshotData(snapshot);
  } catch (error) {
    console.log(error);
  }
};

// Borramos un usuario.
export const deleteUserAsync = async (id) => {
  try {
    const userDoc = doc(db, "users", id);
    const res = await deleteDoc(userDoc);
    return res;
  } catch (error) {
    console.log(error);
  }
};


export const getUsersAsync = async (user) => {
  if (!user) return;
  try {
    const snapshots = await getDocs(
      query(collection(db, "users"), where("email", "!=", user.email))
    );
    const users = snapshots.docs.map((item) => getSnapshotData(item));
    return users;
  } catch (error) {
    console.log(error);
  }
};

// Obtenemos los usuarios.
export const getUserAsync = async (id) => {
  try {
    const userDoc = doc(db, "users", id);
    const snapshot = await getDoc(userDoc);
    return getSnapshotData(snapshot);
  } catch (error) {
    console.log(error);
  }
};

// Aquí manejo las conversaciones.
export const createConversationAsync = async (userId, friendId) => {
  try {
    console.log(userId, friendId);
    const conv = {
      members: [userId, friendId],
      last: { message: "", createdAt: null },
      createdAt: serverTimestamp(),
    };

    const convDoc = await addDoc(collection(db, "conversations"), conv);
    let result = null;
    const convId = convDoc.id;
    if (convId) {
      const userDoc = doc(db, "users", friendId);
      const user_res = await getDoc(userDoc);
      const user_data = getSnapshotData(user_res);

      const res_conv = await getDoc(convDoc);
      if (res_conv) {
        result = {
          ...res_conv.data(),
          id: convId,
          friend: {
            id: user_data.id,
            username: user_data.username,
            profile: user_data.profile,
          },
        };
      }
    }
    // Devolvemos las conversaciones con la informacion del usuario.
    return result;
  } catch (error) {
    console.log(error);
  }
};

// Aquí manejamos los mensajes. (No se implemento por completo en el proyecto) 
export const createMessageAsync = async (message, images) => {
  // Si el usuario cargo una imagen la subimos al Store de FireBase.
  try {
    if (images.length > 0) {
      const location = `/images/messages/${message.conversationId}/`;
      const urls = await uploadFiles(images, location);
      if (urls.length > 0) {
        message.images = arrayUnion(...urls);
      } else {
        message.images = arrayUnion();
      }
    }

    const newMessage = {
      ...message,
      createdAt: serverTimestamp(),
    };

    const msgDoc = await addDoc(collection(db, "messages"), newMessage);
    const messageId = msgDoc.id;
    if (messageId) {
      const msg_res = await getDoc(msgDoc);
      const msg = getSnapshotData(msg_res);
      const convDoc = doc(db, "conversations", msg.conversationId);
      await updateDoc(convDoc, {
        last: { message: msg.message, createdAt: msg.createdAt },
      });
      return msg;
    }
  } catch (error) {
    console.log(error);
  }
};

export const getMsgQueryByConversationId = (convId) => {
  return query(
    collection(db, "messages"),
    where("conversationId", "==", convId)
  );
};

export const getConversationsQueryByUser = (userId) => {
  return query(
    collection(db, "conversations"),
    where("members", "array-contains", userId)
  );
};

// Función para subir archivos al Storage.
const uploadFiles = async (files, location) => {
  let filesUrls = [];
  for (const item of files) {
    const storageRef = ref(storage, `${location}${item.filename}`);
    const uploadTask = await uploadBytes(storageRef, item.file);
    const downloadURL = await getDownloadURL(uploadTask.ref);

    filesUrls.push({
      origin: item.origin,
      filename: item.filename,
      url: downloadURL,
    });
  }
  return filesUrls;
};

export const getSnapshotData = (snapshot) => {
  if (!snapshot.exists) return undefined;
  const data = snapshot.data();
  return { ...data, id: snapshot.id };
};
