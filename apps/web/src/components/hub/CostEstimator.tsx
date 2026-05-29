import React, { useState, useEffect } from 'react';
import { CostEstimation } from '../../context/ProjectContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Sliders } from 'lucide-react';

interface CostEstimatorProps {
  estimation: CostEstimation | null;
}

interface ModelPricing {
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
}

const MODEL_PRICING_TABLE: Record<string, ModelPricing> = {
  'llama-3.3-70b-versatile': { name: 'Llama 3.3 70B (Groq)', inputPerMillion: 0.59, outputPerMillion: 0.79 },
  'gpt-4o': { name: 'GPT-4o (OpenAI)', inputPerMillion: 5.00, outputPerMillion: 15.00 },
  'claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', inputPerMillion: 0.075, outputPerMillion: 0.30 }
};

export const CostEstimator: React.FC<CostEstimatorProps> = ({ estimation }) => {
  // Sliders state
  const [monthlyRuns, setMonthlyRuns] = useState<number>(10000);
  const [avgTokens, setAvgTokens] = useState<number>(4000);
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');

  // Outputs state
  const [llmCost, setLlmCost] = useState<number>(0);
  const [infraCost, setInfraCost] = useState<number>(40);
  const [complexity, setComplexity] = useState<number>(5);

  useEffect(() => {
    if (estimation) {
      setComplexity(estimation.complexity_score || 5);
      setSelectedModel(estimation.recommended_model || 'llama-3.3-70b-versatile');
    }
  }, [estimation]);

  // Recalculate cost when selections change
  useEffect(() => {
    const rate = MODEL_PRICING_TABLE[selectedModel] || MODEL_PRICING_TABLE['llama-3.3-70b-versatile'];
    
    // Assume 70% input tokens, 30% output tokens split
    const inputTokens = avgTokens * 0.7;
    const outputTokens = avgTokens * 0.3;

    const inputCost = (monthlyRuns * inputTokens * rate.inputPerMillion) / 1000000;
    const outputCost = (monthlyRuns * outputTokens * rate.outputPerMillion) / 1000000;
    
    setLlmCost(Number((inputCost + outputCost).toFixed(2)));
    
    // Base scaling cost estimation
    const complexityFactor = complexity / 10;
    const calculatedInfra = 15 + (monthlyRuns / 10000) * 12 * (1 + complexityFactor);
    setInfraCost(Number(calculatedInfra.toFixed(2)));
  }, [monthlyRuns, avgTokens, selectedModel, complexity]);

  const totalCost = Number((llmCost + infraCost).toFixed(2));

  // Chart data
  const chartData = [
    { name: 'Model Costs', value: llmCost, fill: '#6366f1' },
    { name: 'Hosting / VM', value: Number((infraCost * 0.6).toFixed(2)), fill: '#10b981' },
    { name: 'DB & Cache', value: Number((infraCost * 0.4).toFixed(2)), fill: '#f59e0b' }
  ];

  return (
    <div className="cost-estimator-container">
      <div className="estimator-left-panel">
        <div className="card-section-title">
          <Sliders size={16} />
          <h3>Sizing Parameters</h3>
        </div>

        <div className="slider-group">
          <div className="slider-label-row">
            <span>Monthly Executions</span>
            <span className="slider-value-display">{monthlyRuns.toLocaleString()} runs</span>
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={monthlyRuns}
            onChange={(e) => setMonthlyRuns(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <div className="slider-label-row">
            <span>Avg Tokens per Run</span>
            <span className="slider-value-display">{avgTokens.toLocaleString()} tokens</span>
          </div>
          <input
            type="range"
            min="500"
            max="25000"
            step="500"
            value={avgTokens}
            onChange={(e) => setAvgTokens(Number(e.target.value))}
          />
        </div>

        <div className="dropdown-select-group">
          <label htmlFor="price-model-select">Target Model Pricing Tier</label>
          <select
            id="price-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {Object.entries(MODEL_PRICING_TABLE).map(([key, info]) => (
              <option key={key} value={key}>{info.name}</option>
            ))}
          </select>
        </div>

        <div className="complexity-meter">
          <div className="meter-header">
            <span>System Complexity Index:</span>
            <span className="complexity-badge">Score {complexity}/10</span>
          </div>
          <div className="meter-bar-track">
            <div className="meter-fill" style={{ width: `${complexity * 10}%` }} />
          </div>
        </div>
      </div>

      <div className="estimator-right-panel">
        <div className="card-section-title">
          <DollarSign size={16} />
          <h3>Estimated Monthly Budget</h3>
        </div>

        <div className="budget-summary-display">
          <span className="dollar-symbol">$</span>
          <span className="budget-value">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="month-tag">/mo</span>
        </div>

        <hr className="divider" />

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#475569' }} />
              <Tooltip 
                contentStyle={{ 
                  background: '#ffffff', 
                  border: '1.5px solid rgba(99,102,241,0.2)', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.12)'
                }}
                itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                labelStyle={{ display: 'none' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default CostEstimator;
