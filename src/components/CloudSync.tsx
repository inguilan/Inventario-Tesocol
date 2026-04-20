"use client";

import { useToast } from "@/components/Toast";
import { firebaseApp, hasFirebaseConfig } from "@/lib/firebase";
import { loadAppStateFromFirestore, syncAppStateToFirestore } from "@/lib/firestore-app-state";
import { useStore } from "@/store/useStore";
import { useEffect, useMemo, useRef } from "react";

function getFirebaseErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return `Firebase: ${(error as { code: string }).code}`;
  }
  return "Error de conexion con Firebase";
}

export default function CloudSync() {
  const { toast } = useToast();

  const inventory = useStore((s) => s.inventory);
  const projects = useStore((s) => s.projects);
  const dispatches = useStore((s) => s.dispatches);
  const movements = useStore((s) => s.movements);
  const setAppData = useStore((s) => s.setAppData);

  const readyToSyncRef = useRef(false);
  const hydratingRef = useRef(true);
  const syncErrorShownRef = useRef(false);

  const snapshot = useMemo(
    () => ({ inventory, projects, dispatches, movements }),
    [inventory, projects, dispatches, movements]
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!hasFirebaseConfig || !firebaseApp) {
        if (!syncErrorShownRef.current) {
          syncErrorShownRef.current = true;
          toast("Firebase no esta configurado en este entorno", "error");
        }
        hydratingRef.current = false;
        return;
      }

      try {
        const cloudState = await loadAppStateFromFirestore();
        if (!active) return;
        setAppData(cloudState);
        readyToSyncRef.current = true;
      } catch (error) {
        console.error("No fue posible cargar estado desde Firestore", error);
        if (!syncErrorShownRef.current) {
          syncErrorShownRef.current = true;
          toast(getFirebaseErrorMessage(error), "error");
        }
      } finally {
        hydratingRef.current = false;
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [setAppData, toast]);

  useEffect(() => {
    if (hydratingRef.current || !readyToSyncRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      syncAppStateToFirestore(snapshot).catch((error) => {
        console.error("No fue posible sincronizar estado con Firestore", error);
        if (!syncErrorShownRef.current) {
          syncErrorShownRef.current = true;
          toast(getFirebaseErrorMessage(error), "error");
        }
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [snapshot, toast]);

  return null;
}
