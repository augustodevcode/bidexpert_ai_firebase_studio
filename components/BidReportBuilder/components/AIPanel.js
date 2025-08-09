import React, { useState } from 'react';

const AIPanel = ({ onGetAIAssistance }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleNLQ = async () => {
    try {
      const res = await onGetAIAssistance({ query, type: 'nlq' });
      const data = await res.json();
      if (res.ok) {
        setResult(data.query);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred while processing your request.');
    }
  };

  const handleChartRecommendation = async () => {
    try {
      const res = await onGetAIAssistance({ type: 'chart-recommendation' });
      const data = await res.json();
      if (res.ok) {
        setResult(`Recommended chart type: ${data.chartType}`);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred while processing your request.');
    }
  };

  const handleLayoutSuggestion = async () => {
    try {
      const res = await onGetAIAssistance({ type: 'layout-suggestion' });
      const data = await res.json();
      if (res.ok) {
        setResult(`Suggested layout: ${data.layout}`);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred while processing your request.');
    }
  };

  return (
    <div>
      <h3>AI Assistant</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
