import React, { useState, useEffect } from 'react';

const MediaLibrary = ({ onSelectImage }) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch('/api/media')
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
      });
  }, []);

  return (
    <div>
      <h3>Media Library</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {images.map((image) => (
          <div key={image.id} style={{ margin: '10px', cursor: 'pointer' }} onClick={() => onSelectImage(image)}>
            <img src={image.url} alt={image.name} width="100" />
            <p>{image.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaLibrary;
