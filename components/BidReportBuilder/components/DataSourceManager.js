import React, { useState, useEffect } from 'react';

const DataSourceManager = ({ onSelectDataSource }) => {
  const [dataSources, setDataSources] = useState([]);

  useEffect(() => {
    fetch('/api/datasources')
      .then((res) => res.json())
      .then((data) => {
        setDataSources(data);
      });
  }, []);

  return (
    <div>
      <h3>Data Sources</h3>
      <ul>
        {dataSources.map((dataSource) => (
          <li key={dataSource.id} onClick={() => onSelectDataSource(dataSource)}>
            {dataSource.name}
          </li>
        ))}
      </ul>
      <button>Add New Data Source</button>
    </div>
  );
};

export default DataSourceManager;
