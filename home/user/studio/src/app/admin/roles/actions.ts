import { db } from "@/lib/firebase";
import { RoleFormSchema } from "./role-form-schema";
import { z } from "zod";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";

const rolesCollection = collection(db, "roles");

export async function getRoles() {
  const querySnapshot = await getDocs(rolesCollection);
  const roles = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return roles;
}

export async function addRole(data: z.infer<typeof RoleFormSchema>) {
  await addDoc(rolesCollection, data);
  revalidatePath("/admin/roles");
}

export async function updateRole(id: string, data: z.infer<typeof RoleFormSchema>) {
  const roleDoc = doc(db, "roles", id);
  await updateDoc(roleDoc, data);
  revalidatePath("/admin/roles");
}

export async function deleteRole(id: string) {
  const roleDoc = doc(db, "roles", id);
  await deleteDoc(roleDoc);
  revalidatePath("/admin/roles");
}