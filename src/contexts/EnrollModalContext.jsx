import { createContext, useContext, useState, useCallback } from "react";

const EnrollModalContext = createContext(null);

export function EnrollModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preProgram, setPreProgram] = useState("");

  const openEnrollModal = useCallback((program = "") => {
    setPreProgram(program || "");
    setIsOpen(true);
  }, []);

  const closeEnrollModal = useCallback(() => {
    setIsOpen(false);
    setPreProgram("");
  }, []);

  return (
    <EnrollModalContext.Provider value={{ isOpen, preProgram, openEnrollModal, closeEnrollModal }}>
      {children}
    </EnrollModalContext.Provider>
  );
}

export function useEnrollModal() {
  const ctx = useContext(EnrollModalContext);
  if (!ctx) throw new Error("useEnrollModal must be used inside EnrollModalProvider");
  return ctx;
}
