/**
 * ClientPrediction -- Local prediction for responsive gameplay.
 *
 * When the player spawns a unit, immediately show it locally.
 * When server confirms, reconcile (usually no-op).
 * If server rejects (can't afford), rollback the local spawn.
 * Smoothly interpolate entity positions between server updates.
 */

import type { EntitySnapshot, PlayerSnapshot } from './NetworkManager';

/** A predicted local spawn that hasn't been confirmed by the server yet. */
interface PredictedSpawn {
  localId: number;
  unitIndex: number;
  cost: number;
  timestamp: number;
  confirmed: boolean;
  rejected: boolean;
}

/** Predicted local player state. */
interface PredictedState {
  gold: number;
  xp: number;
  currentAge: number;
  baseHp: number;
  baseMaxHp: number;
}

const PREDICTION_TIMEOUT_MS = 2000;

export class ClientPrediction {
  private predictions: PredictedSpawn[] = [];
  private nextLocalId: number = 100000; // start high to avoid collision with server IDs
  private predictedState: PredictedState | null = null;

  /**
   * Predict a spawn locally. Returns a local ID for the predicted entity.
   * The gold cost is deducted from predicted state immediately.
   */
  predictSpawn(
    unitIndex: number,
    cost: number,
    currentState: PlayerSnapshot
  ): number {
    const localId = this.nextLocalId++;

    // Initialize predicted state from server state if needed
    if (!this.predictedState) {
      this.predictedState = { ...currentState };
    }

    // Deduct cost from predicted state
    this.predictedState.gold -= cost;

    this.predictions.push({
      localId,
      unitIndex,
      cost,
      timestamp: Date.now(),
      confirmed: false,
      rejected: false,
    });

    return localId;
  }

  /**
   * Called when the server confirms a spawn (or we see the entity in state update).
   * Marks the oldest unconfirmed prediction as confirmed.
   */
  confirmSpawn(): void {
    const unconfirmed = this.predictions.find((p) => !p.confirmed && !p.rejected);
    if (unconfirmed) {
      unconfirmed.confirmed = true;
    }
  }

  /**
   * Called when the server rejects a spawn (inputRejected message).
   * Rolls back the gold cost.
   */
  rejectSpawn(unitIndex: number): void {
    // Find the matching prediction
    const prediction = this.predictions.find(
      (p) => p.unitIndex === unitIndex && !p.confirmed && !p.rejected
    );

    if (prediction) {
      prediction.rejected = true;

      // Refund gold in predicted state
      if (this.predictedState) {
        this.predictedState.gold += prediction.cost;
      }
    }
  }

  /**
   * Reconcile predicted state with server state.
   * Called every time a server state update is received.
   */
  reconcile(serverState: PlayerSnapshot): PlayerSnapshot {
    // Remove old/confirmed/rejected predictions
    const now = Date.now();
    this.predictions = this.predictions.filter((p) => {
      if (p.confirmed || p.rejected) return false;
      if (now - p.timestamp > PREDICTION_TIMEOUT_MS) return false;
      return true;
    });

    // Start from server state and re-apply unconfirmed predictions
    const reconciledState: PlayerSnapshot = { ...serverState };

    for (const prediction of this.predictions) {
      if (!prediction.confirmed && !prediction.rejected) {
        reconciledState.gold -= prediction.cost;
      }
    }

    this.predictedState = reconciledState;
    return reconciledState;
  }

  /**
   * Get the current predicted player state.
   * Falls back to the last known server state if no predictions exist.
   */
  getPredictedState(): PredictedState | null {
    return this.predictedState;
  }

  /** Get the list of local predicted entity IDs that haven't been confirmed yet. */
  getUnconfirmedLocalIds(): number[] {
    return this.predictions
      .filter((p) => !p.confirmed && !p.rejected)
      .map((p) => p.localId);
  }

  /** Check if there are any pending predictions. */
  hasPendingPredictions(): boolean {
    return this.predictions.some((p) => !p.confirmed && !p.rejected);
  }

  /** Reset all predictions (e.g., on desync or match end). */
  reset(): void {
    this.predictions = [];
    this.predictedState = null;
  }
}
