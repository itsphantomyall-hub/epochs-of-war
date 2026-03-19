/**
 * TutorialManager -- tracks tutorial lesson completion and
 * manages first-launch detection.
 */

const STORAGE_KEY = 'eow_tutorial';

export interface TutorialProgress {
  lessonsCompleted: boolean[];
  skipped: boolean;
}

export const TUTORIAL_LESSONS = [
  { id: 0, name: 'First Blood', duration: 90, description: 'Spawn Clubmen to destroy the enemy base.' },
  { id: 1, name: 'Hold the Line', duration: 90, description: 'Build a turret and defend your base.' },
  { id: 2, name: 'Know Your Enemy', duration: 120, description: 'Learn unit counters: Ranged beats Heavy.' },
  { id: 3, name: 'The Next Age', duration: 120, description: 'Evolve to the next age and unlock new units.' },
  { id: 4, name: 'Command & Conquer', duration: 120, description: 'Use Hero abilities and Special attacks.' },
] as const;

export class TutorialManager {
  private progress: TutorialProgress;

  constructor() {
    this.progress = {
      lessonsCompleted: [false, false, false, false, false],
      skipped: false,
    };
    this.load();
  }

  // ── Queries ────────────────────────────────────────────

  isComplete(): boolean {
    return this.progress.skipped || this.progress.lessonsCompleted.every(Boolean);
  }

  isLessonComplete(lessonId: number): boolean {
    return this.progress.lessonsCompleted[lessonId] ?? false;
  }

  getCurrentLesson(): number {
    for (let i = 0; i < this.progress.lessonsCompleted.length; i++) {
      if (!this.progress.lessonsCompleted[i]) return i;
    }
    return -1; // all complete
  }

  isFirstLaunch(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === null;
    } catch {
      return true;
    }
  }

  wasSkipped(): boolean {
    return this.progress.skipped;
  }

  // ── Mutations ─────────────────────────────────────────

  markComplete(lessonId: number): void {
    if (lessonId >= 0 && lessonId < this.progress.lessonsCompleted.length) {
      this.progress.lessonsCompleted[lessonId] = true;
      this.save();
    }
  }

  skip(): void {
    this.progress.skipped = true;
    this.save();
  }

  reset(): void {
    this.progress = {
      lessonsCompleted: [false, false, false, false, false],
      skipped: false,
    };
    this.save();
  }

  // ── Persistence ───────────────────────────────────────

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      // Ignore storage errors
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<TutorialProgress>;
      if (data.lessonsCompleted && Array.isArray(data.lessonsCompleted)) {
        this.progress.lessonsCompleted = data.lessonsCompleted;
      }
      if (typeof data.skipped === 'boolean') {
        this.progress.skipped = data.skipped;
      }
    } catch {
      // Ignore parse errors
    }
  }
}
