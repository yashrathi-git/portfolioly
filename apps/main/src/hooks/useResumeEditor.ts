/**
 * useResumeEditor Hook
 *
 * Manages resume state with:
 * - Undo/redo functionality
 * - Dirty state tracking
 * - Auto-save functionality
 *
 * _Requirements: 6.3, 6.4_
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { ResumeData } from "@/types/resume";

// ============================================================================
// Types
// ============================================================================

export interface UseResumeEditorOptions {
  /** Initial resume data */
  initialData: ResumeData;
  /** Callback when resume should be saved */
  onSave?: (data: ResumeData) => Promise<void>;
  /** Auto-save delay in milliseconds (default: 2000ms) */
  autoSaveDelay?: number;
  /** Maximum history size for undo/redo (default: 50) */
  maxHistorySize?: number;
  /** Enable auto-save (default: true) */
  autoSaveEnabled?: boolean;
}

export interface UseResumeEditorResult {
  /** Current resume data */
  data: ResumeData;
  /** Update resume data */
  setData: (data: ResumeData) => void;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Last save error, if any */
  saveError: string | null;
  /** Manually trigger save */
  save: () => Promise<void>;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Undo last change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Mark current state as saved (clears dirty flag) */
  markAsSaved: () => void;
}

// ============================================================================
// History Management
// ============================================================================

interface HistoryState {
  past: ResumeData[];
  present: ResumeData;
  future: ResumeData[];
}

function createInitialHistory(data: ResumeData): HistoryState {
  return {
    past: [],
    present: data,
    future: [],
  };
}
// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useResumeEditor - Hook for managing resume editing state
 *
 * Features:
 * - Undo/redo with configurable history size
 * - Dirty state tracking
 * - Auto-save with debouncing
 * - Manual save trigger
 */
export function useResumeEditor({
  initialData,
  onSave,
  autoSaveDelay = 2000,
  maxHistorySize = 50,
  autoSaveEnabled = true,
}: UseResumeEditorOptions): UseResumeEditorResult {
  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState>(() =>
    createInitialHistory(initialData)
  );

  // Track the last saved state to determine dirty status
  const [lastSavedData, setLastSavedData] = useState<ResumeData>(initialData);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current data
  const data = history.present;

  // Dirty state - compare current data with last saved
  const isDirty = JSON.stringify(data) !== JSON.stringify(lastSavedData);

  // Undo/redo availability
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Update data with history tracking
  const setData = useCallback(
    (newData: ResumeData) => {
      setHistory((prev) => {
        // Don't add to history if data hasn't changed
        if (JSON.stringify(prev.present) === JSON.stringify(newData)) {
          return prev;
        }

        // Trim history if it exceeds max size
        const newPast = [...prev.past, prev.present];
        if (newPast.length > maxHistorySize) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: newData,
          future: [], // Clear future on new change
        };
      });
    },
    [maxHistorySize]
  );

  // Undo
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previous = newPast.pop()!;

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const next = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setHistory(createInitialHistory(initialData));
    setLastSavedData(initialData);
    setSaveError(null);
  }, [initialData]);

  // Mark current state as saved
  const markAsSaved = useCallback(() => {
    setLastSavedData(data);
    setSaveError(null);
  }, [data]);

  // Save function
  const save = useCallback(async () => {
    if (!onSave) return;
    if (!isDirty) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(data);
      setLastSavedData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save resume";
      setSaveError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [onSave, data, isDirty]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !onSave || !isDirty) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      save().catch(() => {
        // Error is already handled in save function
      });
    }, autoSaveDelay);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, onSave, isDirty, autoSaveDelay, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Update initial data if it changes externally
  useEffect(() => {
    // Only reset if the initial data has actually changed
    // and we don't have unsaved changes
    if (
      !isDirty &&
      JSON.stringify(initialData) !== JSON.stringify(lastSavedData)
    ) {
      setHistory(createInitialHistory(initialData));
      setLastSavedData(initialData);
    }
  }, [initialData, isDirty, lastSavedData]);

  return {
    data,
    setData,
    isDirty,
    isSaving,
    saveError,
    save,
    canUndo,
    canRedo,
    undo,
    redo,
    reset,
    markAsSaved,
  };
}

export default useResumeEditor;
