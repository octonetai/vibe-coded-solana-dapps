import React, { useState } from 'react';
import { CONFESSION_CATEGORIES } from '../constants';

const ConfessionForm = ({ client, onPostSuccess, showNotification }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterLimit = 500;
  const isContentValid = content.length >= 10 && content.length <= characterLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isContentValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // The new V2 client handles salt and nonce generation internally
      const result = await client.postAnonymousConfession(content, category);
      
      if (result.success) {
        onPostSuccess(); // No need to pass confession data, App will refresh feed
        setContent('');
        setCategory(0);
      } else {
        throw new Error(result.error || 'Failed to post confession.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="form-title">Share a Secret (V2)</h2>
      <form onSubmit={handleSubmit} className="confession-form">
        <textarea
          className="form-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? (10-500 characters)"
          rows="5"
          disabled={isSubmitting}
        />
        <div className={`char-counter ${content.length > characterLimit ? 'error' : ''}`}>
          {content.length} / {characterLimit}
        </div>
        <select
          className="form-input"
          value={category}
          onChange={(e) => setCategory(Number(e.target.value))}
          disabled={isSubmitting}
        >
          {CONFESSION_CATEGORIES.map((cat, index) => (
            <option key={index} value={index}>{cat}</option>
          ))}
        </select>
        <button
          type="submit"
          className="form-button"
          disabled={!isContentValid || isSubmitting}
        >
          {isSubmitting ? 'Posting Securely...' : 'Post Anonymously'}
        </button>
      </form>
    </div>
  );
};

export default ConfessionForm;
