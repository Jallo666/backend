import { useEffect } from "react";
import { playTheme, stopTheme } from "./musicController";

export default function useMusic(page) {

  useEffect(() => {

    if (!page) return;

    playTheme(page);

    return () => stopTheme();

  }, [page]);

}