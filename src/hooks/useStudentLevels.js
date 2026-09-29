import { useCallback, useEffect, useRef, useState } from "react";

export function useStudentLevels(getHeaders) {
  const headers = useRef(getHeaders);
  headers.current = getHeaders;
  const [levels, setLevels] = useState([]);
  const [levelsError, setLevelsError] = useState("");
  const [levelsLoading, setLevelsLoading] = useState(true);
  const reloadLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const response = await fetch("/api/student_levels.php", { headers: headers.current() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load levels");
      setLevels(data.levels);
      setLevelsError("");
    } catch (error) { setLevelsError(error.message); }
    finally { setLevelsLoading(false); }
  }, []);
  useEffect(() => {
    reloadLevels();
    window.addEventListener("focus", reloadLevels);
    return () => window.removeEventListener("focus", reloadLevels);
  }, [reloadLevels]);
  return { levels, levelsError, levelsLoading, reloadLevels };
}