import { Injectable } from '@nestjs/common';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import {
  CollectionReference,
  DocumentReference,
  Firestore,
  Transaction,
  getFirestore,
} from 'firebase-admin/firestore';

@Injectable()
export class DatabaseService {
  readonly firestore: Firestore;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID must be configured.');
    }

    const app = getApps().find((candidate) => candidate.options.projectId === projectId)
      ?? initializeApp({ credential: applicationDefault(), projectId });
    this.firestore = getFirestore(app);
  }

  collection<T extends FirebaseRecord = FirebaseRecord>(name: string): CollectionReference<T> {
    return this.firestore.collection(name) as CollectionReference<T>;
  }

  document<T extends FirebaseRecord = FirebaseRecord>(
    collection: string,
    id: string | number,
  ): DocumentReference<T> {
    return this.collection<T>(collection).doc(String(id));
  }

  async readNextId(
    transaction: Transaction,
    name: string,
  ): Promise<{ id: number; reference: DocumentReference<CounterRecord> }> {
    const reference = this.document<CounterRecord>('counters', name);
    const snapshot = await transaction.get(reference);
    return {
      id: (snapshot.data()?.value ?? 0) + 1,
      reference,
    };
  }
}

export interface FirebaseRecord {
  [field: string]: unknown;
}

interface CounterRecord extends FirebaseRecord {
  value: number;
}
