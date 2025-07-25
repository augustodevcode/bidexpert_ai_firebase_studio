import React, { useState } from 'react';

const AIPanel = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');

  const handleNLQ = async () => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, type: 'nlq' }),
    });
    const data = await res.json();
    setResult(data.query);
  };

  const handleChartRecommendation = async () => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chart-recommendation' }),
    });
    const data = await res.json();
    setResult(`Recommended chart type: ${data.chartType}`);
  };

  const handleLayoutSuggestion = async () => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'layout-suggestion' }),
    });
    const data = await res.json();
    setResult(`Suggested layout: ${data.layout}`);
  };

  return (
    <div>
      <h3>AI Assistant</h3>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your data"
        />
        <button onClick={handleNLQ}>Ask</button>
      </div>
      <div>
        <button onClick={handleChartRecommendation}>Get Chart Recommendation</button>
        <button onClick={handleLayoutSuggestion}>Get Layout Suggestion</button>
      </div>
      <div>
        <h4>Result:</h4>
        <p>{result}</p>
      </div>
    </div>
  );
};

export default AIPanel;
