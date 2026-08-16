import { useState } from "react";
import { Target } from "lucide-react";
import { updatePreferences } from "../../services/api";

interface Props {
  goalKwh: number;
  currentKwh: number;
  onChangeGoal: (goal: number) => void;
}

export function GoalCard({ goalKwh, currentKwh, onChangeGoal }: Props) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(0);

  const goalProgress = goalKwh > 0 ? Math.min(100, (currentKwh / goalKwh) * 100) : 0;

  const handleSave = async () => {
    try {
      await updatePreferences({ consumption_goal: goalInput });
      onChangeGoal(goalInput);
      setEditingGoal(false);
    } catch {
      // silently fail, goal stays unchanged
    }
  };

  return (
    <div className="dash-section">
      <h3>
        <Target size={20} /> Meta de Consumo
      </h3>
      <div className="dash-goal-card">
        {editingGoal ? (
          <div className="dash-goal-edit">
            <input
              type="number"
              min="0"
              value={goalInput}
              onChange={(e) => setGoalInput(Number(e.target.value))}
              placeholder="Ex: 200 kWh"
            />
            <button className="dash-btn dash-btn--primary" onClick={handleSave}>
              Salvar
            </button>
            <button
              className="dash-btn dash-btn--secondary"
              onClick={() => {
                setEditingGoal(false);
                setGoalInput(goalKwh);
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="dash-goal-display">
            {goalKwh > 0 ? (
              <>
                <div className="dash-goal-bar-container">
                  <div
                    className="dash-goal-bar"
                    style={{
                      width: `${goalProgress}%`,
                      background:
                        goalProgress > 100
                          ? "var(--accent-red, #ef4444)"
                          : goalProgress > 80
                            ? "var(--accent-yellow, #f59e0b)"
                            : "var(--accent-green, #10b981)",
                    }}
                  />
                </div>
                <div className="dash-goal-stats">
                  <span>
                    Atual: <strong>{currentKwh.toFixed(0)} kWh</strong>
                  </span>
                  <span>
                    Meta: <strong>{goalKwh} kWh</strong>
                  </span>
                  <span>
                    {currentKwh <= goalKwh ? (
                      <span className="dash-goal-met">✓ Meta atingida!</span>
                    ) : (
                      <span className="dash-goal-excess">
                        Excesso: {(currentKwh - goalKwh).toFixed(0)} kWh
                      </span>
                    )}
                  </span>
                </div>
                <button
                  className="dash-btn dash-btn--secondary"
                  onClick={() => {
                    setEditingGoal(true);
                    setGoalInput(goalKwh);
                  }}
                  style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                >
                  Alterar meta
                </button>
              </>
            ) : (
              <div className="dash-goal-empty">
                <p>Defina uma meta mensal de consumo para acompanhar seu progresso.</p>
                <button
                  className="dash-btn dash-btn--primary"
                  onClick={() => {
                    setEditingGoal(true);
                    setGoalInput(Math.round(currentKwh * 0.8));
                  }}
                >
                  <Target size={16} /> Definir Meta
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
